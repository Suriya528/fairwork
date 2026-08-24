const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { decodeEventLog, parseUnits, keccak256, toHex, createPublicClient, http } = require("viem");
const { sepolia } = require("viem/chains");

const SettlementEvent = require("../models/SettlementEvent");
const OutboxEvent = require("../models/OutboxEvent");
const QuarantineEvent = require("../models/QuarantineEvent");
const Message = require("../models/Message");
const Project = require("../models/Project.js");
const { validateFence } = require("./leaseManager");

const FINANCIAL_INVARIANTS = {
  MIN_TRANSACTION_CENTS: 1n,
  MAX_TRANSACTION_CENTS: 100_000_000n, // $1,000,000.00 USD
  MAX_DECIMALS: 2,
  CANONICAL_TOKEN_DECIMALS: 6,
};

// Load Escrow ABI dynamically with fallback
let ESCROW_ABI = [];
try {
  const abiPath = path.join(__dirname, "../abi/EscrowContract.abi.json");
  if (fs.existsSync(abiPath)) {
    ESCROW_ABI = JSON.parse(fs.readFileSync(abiPath, "utf-8"));
  }
} catch {
  // Fallback ABI inline
}

if (!ESCROW_ABI.length) {
  ESCROW_ABI = [
    {
      type: "event",
      name: "MilestoneReleased",
      inputs: [
        { type: "string", name: "projectId", indexed: true },
        { type: "uint256", name: "milestoneIndex", indexed: true },
        { type: "address", name: "freelancer", indexed: true },
        { type: "uint256", name: "amount", indexed: false },
      ],
    },
    {
      type: "event",
      name: "EscrowFunded",
      inputs: [
        { type: "string", name: "projectId", indexed: true },
        { type: "address", name: "client", indexed: true },
        { type: "uint256", name: "amount", indexed: false },
      ],
    },
    {
      type: "function",
      name: "escrows",
      stateMutability: "view",
      inputs: [{ type: "string", name: "projectId" }],
      outputs: [
        { type: "address", name: "client" },
        { type: "address", name: "freelancer" },
        { type: "address", name: "token" },
        { type: "uint256", name: "totalBudget" },
        { type: "bool", name: "funded" },
        { type: "bool", name: "completed" },
      ],
    },
  ];
}

const MILESTONE_RELEASED_TOPIC = keccak256(toHex("MilestoneReleased(string,uint256,address,uint256)"));

function isValidEthAddress(address) {
  return typeof address === "string" && /^0x[a-fA-F0-9]{40}$/.test(address.trim());
}

function isValidTxHash(hash) {
  return typeof hash === "string" && /^0x[a-fA-F0-9]{64}$/.test(hash.trim());
}

function assertNonNegativeSafeInteger(val, name) {
  if (typeof val === "bigint") {
    if (val < 0n || val > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new TypeError(`INVALID_SAFE_INTEGER_${name.toUpperCase()}`);
    }
    return Number(val);
  }
  const num = Number(val);
  if (!Number.isSafeInteger(num) || num < 0) {
    throw new TypeError(`INVALID_SAFE_INTEGER_${name.toUpperCase()}`);
  }
  return num;
}

function buildBlockchainEventKey({ chainId, contractAddress, transactionHash, logIndex }) {
  if (!chainId || !isValidEthAddress(contractAddress) || !isValidTxHash(transactionHash) || logIndex === undefined || logIndex === null) {
    throw new Error("MALFORMED_EVENT_COORDINATES");
  }
  return `EVENT:${assertNonNegativeSafeInteger(chainId, "chainId")}:${contractAddress.toLowerCase()}:${transactionHash.toLowerCase()}:${assertNonNegativeSafeInteger(logIndex, "logIndex")}`;
}

function decodeRawLogToVerifiedEvent({ rawLog, expectedChainId, expectedEscrowAddress }) {
  if (!rawLog || !Array.isArray(rawLog.topics) || rawLog.data === undefined) {
    throw new Error("MALFORMED_RAW_LOG_PAYLOAD");
  }

  const contractAddress = rawLog.address;
  if (!isValidEthAddress(contractAddress)) throw new Error("INVALID_ESCROW_CONTRACT_ADDRESS");
  if (contractAddress.toLowerCase() !== expectedEscrowAddress.toLowerCase()) {
    throw new Error("ESCROW_CONTRACT_ADDRESS_MISMATCH");
  }

  if (rawLog.topics[0] !== MILESTONE_RELEASED_TOPIC) {
    return null;
  }

  const chainId = assertNonNegativeSafeInteger(expectedChainId, "expectedChainId");
  const transactionHash = rawLog.transactionHash;
  if (!isValidTxHash(transactionHash)) throw new Error("INVALID_TRANSACTION_HASH");

  const logIndex = assertNonNegativeSafeInteger(rawLog.logIndex, "logIndex");
  const blockNumber = assertNonNegativeSafeInteger(rawLog.blockNumber, "blockNumber");
  const blockHash = rawLog.blockHash ? rawLog.blockHash.toLowerCase() : "0x" + "0".repeat(64);

  const parsed = decodeEventLog({
    abi: ESCROW_ABI,
    data: rawLog.data,
    topics: rawLog.topics,
  });

  if (!parsed || parsed.eventName !== "MilestoneReleased") {
    throw new Error("INVALID_EVENT_SIGNATURE");
  }

  const rawProjId = parsed.args.projectId;
  if (!mongoose.isValidObjectId(rawProjId)) {
    throw new Error("INVALID_PROJECT_ID_IN_LOG");
  }

  const milestoneIndex = assertNonNegativeSafeInteger(parsed.args.milestoneIndex, "milestoneIndex");
  const freelancerAddress = parsed.args.freelancer;
  if (!isValidEthAddress(freelancerAddress)) throw new Error("INVALID_FREELANCER_ADDRESS_IN_LOG");

  const onChainAmountUnits = BigInt(parsed.args.amount.toString());
  if (onChainAmountUnits <= 0n) throw new Error("NON_POSITIVE_AMOUNT_UNITS");

  return {
    chainId,
    contractAddress: contractAddress.toLowerCase(),
    transactionHash: transactionHash.toLowerCase(),
    logIndex,
    blockNumber,
    blockHash,
    eventName: "MilestoneReleased",
    projectId: String(rawProjId),
    milestoneIndex,
    freelancerAddress: freelancerAddress.toLowerCase(),
    onChainAmountUnits,
  };
}

/**
 * Main financial settlement reconciliation entry point.
 */
async function reconcileVerifiedBlockchainEvent({
  ProjectModel = Project,
  SettlementEventModel = SettlementEvent,
  OutboxEventModel = OutboxEvent,
  QuarantineEventModel = QuarantineEvent,
  verifiedEvent,
  onChainEscrowState,
  expectedTokenAddress,
  tokenDecimals = FINANCIAL_INVARIANTS.CANONICAL_TOKEN_DECIMALS,
  fenceState = null,
  session: externalSession = null,
}) {
  const {
    chainId,
    contractAddress,
    transactionHash,
    logIndex,
    blockNumber,
    blockHash,
    eventName,
    projectId,
    milestoneIndex,
    freelancerAddress,
    onChainAmountUnits,
  } = verifiedEvent;

  // 1. Mandatory On-Chain State Assertions
  if (!onChainEscrowState || typeof onChainEscrowState !== "object") {
    await QuarantineEventModel.create({
      category: "SECURITY_VALIDATION_FAILURE",
      sourceEventKey: buildBlockchainEventKey({ chainId, contractAddress, transactionHash, logIndex }),
      chainId,
      contractAddress,
      blockNumber,
      transactionHash,
      logIndex,
      rawEventData: verifiedEvent,
      errorMessage: "MISSING_ON_CHAIN_ESCROW_STATE",
    });
    throw new Error("MISSING_ON_CHAIN_ESCROW_STATE");
  }

  if (!onChainEscrowState.funded) {
    throw new Error("ON_CHAIN_ESCROW_NOT_FUNDED");
  }

  if (onChainEscrowState.token.toLowerCase() !== expectedTokenAddress.toLowerCase()) {
    throw new Error("ON_CHAIN_TOKEN_ADDRESS_MISMATCH");
  }

  if (onChainEscrowState.freelancer.toLowerCase() !== freelancerAddress.toLowerCase()) {
    throw new Error("ON_CHAIN_BENEFICIARY_MISMATCH");
  }

  const sourceEventKey = buildBlockchainEventKey({ chainId, contractAddress, transactionHash, logIndex });

  const useSession = externalSession || (mongoose.connection.readyState === 1 && typeof mongoose.connection.startSession === "function" ? await mongoose.startSession() : null);
  const isSelfManaged = useSession && !externalSession;
  if (isSelfManaged && typeof useSession.startTransaction === "function") {
    useSession.startTransaction();
  }

  try {
    // 2. Validate generation fence if fenceState provided
    if (fenceState) {
      await validateFence(fenceState.syncKey, fenceState.podId, fenceState.currentGeneration, useSession);
    }

    // 3. Project Validation
    const projQuery = ProjectModel.findById(projectId);
    if (useSession) projQuery.session(useSession);
    const project = await projQuery;
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    if (project.freelancerWalletAddress && freelancerAddress.toLowerCase() !== project.freelancerWalletAddress.toLowerCase()) {
      throw new Error("DB_BENEFICIARY_MISMATCH");
    }

    if (project.clientWalletAddress && onChainEscrowState.client && onChainEscrowState.client.toLowerCase() !== project.clientWalletAddress.toLowerCase()) {
      throw new Error("DB_CLIENT_BENEFICIARY_MISMATCH");
    }

    const milestone = project.milestones && project.milestones[milestoneIndex];
    if (!milestone) throw new Error("MILESTONE_INDEX_OUT_OF_BOUNDS");

    // Reconcile against locked settlement expectedMilestoneUnits
    const expectedUnitsStr = project.settlement?.expectedMilestoneUnits?.[milestoneIndex];
    if (expectedUnitsStr) {
      if (onChainAmountUnits.toString() !== expectedUnitsStr) {
        throw new Error("EVENT_AMOUNT_MISMATCH: " + onChainAmountUnits.toString() + " vs expected " + expectedUnitsStr);
      }
    }

    // 4. Record Immutable Settlement Event
    const createOpts = useSession ? { session: useSession } : {};
    const [settlementEvent] = await SettlementEventModel.create(
      [
        {
          sourceEventKey,
          chainId,
          contractAddress,
          transactionHash,
          logIndex,
          blockNumber,
          blockHash,
          eventName,
          projectId,
          milestoneIndex,
          freelancerAddress,
          tokenAddress: onChainEscrowState.token.toLowerCase(),
          amountUnits: onChainAmountUnits.toString(),
          status: "ACTIVE",
        },
      ],
      createOpts
    );

    // 5. Mutate Milestone State (Mandatory modifiedCount === 1 check)
    const updateOpts = useSession ? { session: useSession } : {};
    const updateResult = await ProjectModel.updateOne(
      {
        _id: projectId,
        [`milestones.${milestoneIndex}.paymentReleased`]: false,
      },
      {
        $set: {
          [`milestones.${milestoneIndex}.paymentReleased`]: true,
          [`milestones.${milestoneIndex}.settlementEventId`]: settlementEvent._id,
        },
      },
      updateOpts
    );

    if (updateResult.matchedCount !== 1 || updateResult.modifiedCount !== 1) {
      throw new Error("SETTLEMENT_PROJECTION_FAILED: Milestone was already released or not found.");
    }

    // 6. Enqueue Outbox Event in same ACID transaction
    await OutboxEventModel.create(
      [
        {
          sourceEventKey,
          eventType: "MilestoneReleased",
          settlementEventId: settlementEvent._id,
          projectId,
          content: `Milestone #${milestoneIndex + 1} ("${milestone.title}") payment was released on-chain.`,
          status: "PENDING",
        },
      ],
      createOpts
    );

    if (isSelfManaged && useSession.inTransaction?.()) await useSession.commitTransaction();
    return "MUTATED";
  } catch (err) {
    if (isSelfManaged && useSession?.inTransaction?.()) {
      await useSession.abortTransaction();
    }

    if (err.code === 11000) {
      const keyPattern = err.keyPattern || {};
      if (keyPattern.sourceEventKey || (keyPattern.chainId && keyPattern.transactionHash && keyPattern.logIndex)) {
        return "ALREADY_PROCESSED";
      }
      throw new Error("UNEXPECTED_DUPLICATE_KEY: " + JSON.stringify(keyPattern));
    }
    throw err;
  } finally {
    if (isSelfManaged && useSession) await useSession.endSession();
  }
}

// Backward-compatible export helper
function getResolvedContractAddress(canonicalKey, legacyAliasKey) {
  const canonical = process.env[canonicalKey];
  const alias = process.env[legacyAliasKey];
  if (canonical && alias && canonical.trim().toLowerCase() !== alias.trim().toLowerCase()) {
    throw new Error(`Blockchain configuration conflict: ${canonicalKey} and ${legacyAliasKey} conflict.`);
  }
  const resolved = (canonical || alias || "").trim();
  return resolved ? resolved.toLowerCase() : null;
}

module.exports = {
  reconcileVerifiedBlockchainEvent,
  decodeRawLogToVerifiedEvent,
  buildBlockchainEventKey,
  isValidEthAddress,
  isValidTxHash,
  assertNonNegativeSafeInteger,
  getResolvedContractAddress,
  FINANCIAL_INVARIANTS,
};
