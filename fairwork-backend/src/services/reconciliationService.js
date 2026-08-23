const mongoose = require("mongoose");
const { decodeEventLog, parseUnits, keccak256, toHex, createPublicClient, http } = require("viem");
const { sepolia } = require("viem/chains");
const SettlementEvent = require("../models/SettlementEvent");
const Message = require("../models/Message");
const Project = require("../models/Project");

const FINANCIAL_INVARIANTS = {
  MIN_TRANSACTION_CENTS: 1n,
  MAX_TRANSACTION_CENTS: 100_000_000n, // $1,000,000.00 USD documented platform ceiling
  MAX_DECIMALS: 2,
  CANONICAL_TOKEN_DECIMALS: 6,
};

const ESCROW_ABI = [
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
    type: "event",
    name: "EscrowCreated",
    inputs: [
      { type: "string", name: "projectId", indexed: true },
      { type: "address", name: "client", indexed: true },
      { type: "address", name: "freelancer", indexed: true },
      { type: "address", name: "token", indexed: false },
      { type: "uint256", name: "totalAmount", indexed: false },
    ],
  },
  {
    type: "event",
    name: "EscrowDisputed",
    inputs: [{ type: "string", name: "projectId", indexed: true }],
  },
  {
    type: "event",
    name: "EscrowRefunded",
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
  {
    type: "function",
    name: "getEscrowParties",
    stateMutability: "view",
    inputs: [{ type: "string", name: "projectId" }],
    outputs: [
      { type: "address", name: "client" },
      { type: "address", name: "freelancer" },
      { type: "bool", name: "isFunded" },
      { type: "bool", name: "isDisputed" },
      { type: "bool", name: "isCompleted" },
    ],
  },
];

// Calculate MilestoneReleased Topic0 hash using keccak256
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

function businessAmountToTokenUnits(rawAmount, verifiedTokenAddress, expectedTokenAddress, verifiedDecimals) {
  if (typeof rawAmount !== "string" && typeof rawAmount !== "number") {
    throw new TypeError("INVALID_MONETARY_TYPE_STRING_REQUIRED");
  }
  const strAmount = String(rawAmount).trim();
  if (!isValidEthAddress(verifiedTokenAddress) || !isValidEthAddress(expectedTokenAddress)) {
    throw new Error("INVALID_TOKEN_ADDRESS_FORMAT");
  }
  if (verifiedTokenAddress.toLowerCase() !== expectedTokenAddress.toLowerCase()) {
    throw new Error("TOKEN_ADDRESS_MISMATCH");
  }
  if (typeof verifiedDecimals !== "number" || verifiedDecimals <= 0 || !Number.isInteger(verifiedDecimals)) {
    throw new TypeError("INVALID_TOKEN_DECIMALS");
  }

  if (!/^([1-9]\d*|0)(\.\d{1,2})?$/.test(strAmount)) {
    throw new Error("NON_CANONICAL_MONETARY_STRING");
  }

  const [wholeStr, fracStr = ""] = strAmount.split(".");
  const normalizedFrac = fracStr.padEnd(FINANCIAL_INVARIANTS.MAX_DECIMALS, "0").slice(0, FINANCIAL_INVARIANTS.MAX_DECIMALS);
  const totalCents = BigInt(wholeStr) * 100n + BigInt(normalizedFrac);

  if (totalCents < FINANCIAL_INVARIANTS.MIN_TRANSACTION_CENTS) {
    throw new Error("AMOUNT_BELOW_MINIMUM");
  }
  if (totalCents > FINANCIAL_INVARIANTS.MAX_TRANSACTION_CENTS) {
    throw new Error("AMOUNT_EXCEEDS_MAXIMUM");
  }

  return parseUnits(strAmount, verifiedDecimals);
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
    eventName: "MilestoneReleased",
    projectId: String(rawProjId),
    milestoneIndex,
    freelancerAddress: freelancerAddress.toLowerCase(),
    onChainAmountUnits,
  };
}

function createOnChainEscrowReader(rpcUrl, escrowAddress) {
  const client = createPublicClient({ chain: sepolia, transport: http(rpcUrl) });
  return async function readOnChainEscrow(projectId) {
    const data = await client.readContract({
      address: escrowAddress,
      abi: ESCROW_ABI,
      functionName: "escrows",
      args: [projectId],
    });
    return {
      client: data[0],
      freelancer: data[1],
      token: data[2],
      totalBudget: BigInt(data[3].toString()),
      funded: Boolean(data[4]),
      completed: Boolean(data[5]),
    };
  };
}

async function reconcileVerifiedBlockchainEvent({
  ProjectModel = Project,
  SettlementEventModel = SettlementEvent,
  verifiedEvent,
  onChainEscrowState,
  expectedTokenAddress,
  tokenDecimals = FINANCIAL_INVARIANTS.CANONICAL_TOKEN_DECIMALS,
  session: externalSession = null,
}) {
  const {
    chainId,
    contractAddress,
    transactionHash,
    logIndex,
    blockNumber,
    eventName,
    projectId,
    milestoneIndex,
    freelancerAddress,
    onChainAmountUnits,
  } = verifiedEvent;

  // 1. Mandatory On-Chain State Assertions (ZERO FALLBACK)
  if (!onChainEscrowState || typeof onChainEscrowState !== "object") {
    throw new Error("MISSING_ON_CHAIN_ESCROW_STATE");
  }
  if (!onChainEscrowState.funded) {
    throw new Error("ON_CHAIN_ESCROW_NOT_FUNDED");
  }
  if (!isValidEthAddress(onChainEscrowState.token)) {
    throw new Error("INVALID_ON_CHAIN_TOKEN_ADDRESS");
  }
  if (onChainEscrowState.token.toLowerCase() !== expectedTokenAddress.toLowerCase()) {
    throw new Error("ON_CHAIN_TOKEN_ADDRESS_MISMATCH");
  }
  if (!isValidEthAddress(onChainEscrowState.freelancer)) {
    throw new Error("INVALID_ON_CHAIN_FREELANCER_ADDRESS");
  }
  if (onChainEscrowState.freelancer.toLowerCase() !== freelancerAddress.toLowerCase()) {
    throw new Error("ON_CHAIN_BENEFICIARY_MISMATCH");
  }

  const useSession = externalSession || (mongoose.connection.readyState === 1 && typeof mongoose.connection.startSession === "function" ? await mongoose.startSession() : null);
  const isSelfManaged = useSession && !externalSession;
  if (isSelfManaged && typeof useSession.startTransaction === "function") {
    useSession.startTransaction();
  }

  try {
    // 2. Event Ledger Deduplication Check
    const findQuery = SettlementEventModel.findOne({
      chainId,
      contractAddress,
      transactionHash,
      logIndex,
    });
    if (useSession) findQuery.session(useSession);
    const existingEvent = await findQuery;

    if (existingEvent) {
      if (isSelfManaged && useSession.inTransaction?.()) await useSession.abortTransaction();
      return "ALREADY_PROCESSED";
    }

    // 3. Project Validation
    const projQuery = ProjectModel.findById(projectId);
    if (useSession) projQuery.session(useSession);
    const project = await projQuery;
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    if (project.freelancerWalletAddress && freelancerAddress.toLowerCase() !== project.freelancerWalletAddress.toLowerCase()) {
      throw new Error("DB_BENEFICIARY_MISMATCH");
    }

    const milestone = project.milestones && project.milestones[milestoneIndex];
    if (!milestone) throw new Error("MILESTONE_INDEX_OUT_OF_BOUNDS");

    const expectedUnits = businessAmountToTokenUnits(
      milestone.amount.toString(),
      onChainEscrowState.token,
      expectedTokenAddress,
      tokenDecimals
    );

    if (onChainAmountUnits !== expectedUnits) {
      throw new Error("EVENT_AMOUNT_MISMATCH");
    }

    if (onChainEscrowState.totalBudget !== undefined && onChainEscrowState.totalBudget !== null) {
      const expectedTotalBudgetUnits = businessAmountToTokenUnits(
        project.budget.toString(),
        onChainEscrowState.token,
        expectedTokenAddress,
        tokenDecimals
      );
      if (BigInt(onChainEscrowState.totalBudget.toString()) !== expectedTotalBudgetUnits) {
        throw new Error("ON_CHAIN_BUDGET_MISMATCH");
      }
    }

    // 4. Record Immutable Event
    const createOpts = useSession ? { session: useSession } : {};
    await SettlementEventModel.create(
      [
        {
          chainId,
          contractAddress,
          transactionHash,
          logIndex,
          blockNumber,
          eventName,
          projectId,
          milestoneIndex,
          freelancerAddress,
          tokenAddress: onChainEscrowState.token.toLowerCase(),
          amountUnits: onChainAmountUnits.toString(),
        },
      ],
      createOpts
    );

    // 5. Mutate Milestone State
    const updateOpts = useSession ? { session: useSession } : {};
    const updateResult = await ProjectModel.updateOne(
      {
        _id: projectId,
        [`milestones.${milestoneIndex}.paymentReleased`]: false,
      },
      {
        $set: {
          [`milestones.${milestoneIndex}.paymentReleased`]: true,
          [`milestones.${milestoneIndex}.settlementChainId`]: chainId,
          [`milestones.${milestoneIndex}.settlementContractAddress`]: contractAddress,
          [`milestones.${milestoneIndex}.settlementTxHash`]: transactionHash,
          [`milestones.${milestoneIndex}.settlementLogIndex`]: logIndex,
          [`milestones.${milestoneIndex}.settlementBlockNumber`]: blockNumber,
        },
      },
      updateOpts
    );

    if (updateResult.modifiedCount === 0) {
      const reQuery = ProjectModel.findById(projectId);
      if (useSession) reQuery.session(useSession);
      const refreshed = await reQuery;
      const m = refreshed ? refreshed.milestones[milestoneIndex] : null;
      if (m && m.paymentReleased && m.settlementTxHash === transactionHash && m.settlementLogIndex === logIndex) {
        if (isSelfManaged && useSession.inTransaction?.()) await useSession.commitTransaction();
        return "ALREADY_PROCESSED";
      }
      throw new Error("INCONSISTENT_SETTLEMENT_STATE");
    }

    if (isSelfManaged && useSession.inTransaction?.()) await useSession.commitTransaction();
    return "MUTATED";
  } catch (err) {
    if (isSelfManaged && useSession?.inTransaction?.()) {
      await useSession.abortTransaction();
    }
    if (err.code === 11000) return "ALREADY_PROCESSED";
    throw err;
  } finally {
    if (isSelfManaged && useSession) await useSession.endSession();
  }
}

async function ensureBlockchainSystemEventMessage({
  io = null,
  projectId,
  chainId,
  contractAddress,
  transactionHash,
  logIndex,
  content,
}) {
  const eventKey = buildBlockchainEventKey({
    chainId,
    contractAddress,
    transactionHash,
    logIndex,
  });

  try {
    const message = await Message.create({
      projectId,
      senderId: null,
      content,
      type: "SYSTEM_EVENT",
      systemEventKey: eventKey,
    });

    if (io) {
      io.to(`project:${projectId}`).emit("receive_message", message);
    }
    return { message, isDuplicate: false };
  } catch (err) {
    if (err.code === 11000) {
      const existing = await Message.findOne({ projectId, systemEventKey: eventKey });
      return { message: existing, isDuplicate: true };
    }
    throw err;
  }
}

// Backward-compatible wrappers for existing project reconciliation controllers
function getResolvedContractAddress(canonicalKey, legacyAliasKey) {
  const canonical = process.env[canonicalKey];
  const alias = process.env[legacyAliasKey];
  if (canonical && alias && canonical.trim().toLowerCase() !== alias.trim().toLowerCase()) {
    throw new Error(`Blockchain configuration conflict: ${canonicalKey} and ${legacyAliasKey} conflict.`);
  }
  const resolved = (canonical || alias || "").trim();
  return resolved ? resolved.toLowerCase() : null;
}

async function reconcileEscrowFunding(projectId, txnHash) {
  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found");
  project.escrowFunded = true;
  if (txnHash) project.escrowTxnHash = txnHash;
  await project.save();
  return project;
}

async function reconcileMilestoneRelease(projectId, milestoneIndex, txnHash) {
  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found");
  const index = Number(milestoneIndex);
  if (project.milestones && project.milestones[index]) {
    project.milestones[index].paymentReleased = true;
    project.milestones[index].status = "completed";
  }
  const allReleased = project.milestones && project.milestones.every((m) => m.paymentReleased);
  if (allReleased) {
    project.escrowCompleted = true;
    project.status = "completed";
  }
  await project.save();
  return project;
}

async function reconcileEscrowCloseout(projectId, reason = "refunded", txnHash = null) {
  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found");
  project.escrowCompleted = true;
  project.status = reason === "refunded" ? "refunded" : "completed";
  if (project.milestones) {
    project.milestones.forEach((m) => {
      if (!m.paymentReleased) {
        m.paymentReleased = true;
        m.status = "completed";
      }
    });
  }
  await project.save();
  return project;
}

module.exports = {
  FINANCIAL_INVARIANTS,
  ESCROW_ABI,
  MILESTONE_RELEASED_TOPIC,
  isValidEthAddress,
  isValidTxHash,
  assertNonNegativeSafeInteger,
  buildBlockchainEventKey,
  businessAmountToTokenUnits,
  decodeRawLogToVerifiedEvent,
  createOnChainEscrowReader,
  reconcileVerifiedBlockchainEvent,
  ensureBlockchainSystemEventMessage,
  getResolvedContractAddress,
  reconcileEscrowFunding,
  reconcileMilestoneRelease,
  reconcileEscrowCloseout,
};
