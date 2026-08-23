const fs = require("fs");
const path = require("path");
const { createPublicClient, http } = require("viem");
const { sepolia } = require("viem/chains");
const Project = require("../models/Project");
const SyncState = require("../models/BlockchainSyncState");
const SettlementEvent = require("../models/SettlementEvent");
const {
  decodeRawLogToVerifiedEvent,
  reconcileVerifiedBlockchainEvent,
  ensureBlockchainSystemEventMessage,
  createOnChainEscrowReader,
  MILESTONE_RELEASED_TOPIC,
  getResolvedContractAddress,
} = require("./reconciliationService");

function isRetryableRpcError(error) {
  if (!error) return false;
  const status = error.status || error.statusCode || (error.response && error.response.status);
  if ([429, 502, 503, 504].includes(Number(status))) return true;

  const msg = (error.message || "").toLowerCase();
  const code = (error.code || "").toString().toLowerCase();

  return (
    code === "econnreset" ||
    code === "econnrefused" ||
    code === "etimedout" ||
    msg.includes("rate limit") ||
    msg.includes("too many requests") ||
    msg.includes("timeout") ||
    msg.includes("request timed out") ||
    msg.includes("bad gateway") ||
    msg.includes("service unavailable") ||
    msg.includes("gateway timeout") ||
    msg.includes("network error")
  );
}

async function executeWithFullJitter(fn, maxRetries = 3, baseDelayMs = 20, maxDelayMs = 1000, randomFn = Math.random) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (err) {
      if (!isRetryableRpcError(err)) {
        throw new Error(`FATAL_RPC_ERROR: ${err.message}`);
      }
      attempt++;
      if (attempt >= maxRetries) {
        throw new Error(`RPC_EXHAUSTION: ${err.message}`);
      }

      const calculatedMax = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
      const jitteredSleep = Math.floor(randomFn() * calculatedMax);
      await new Promise((r) => setTimeout(r, jitteredSleep));
    }
  }
}

async function processBlockchainChunkRange({
  client,
  io = null,
  chainId,
  contractAddress,
  expectedTokenAddress,
  fromBlock,
  toBlock,
  confirmedHead,
  chunkSize = 2000n,
  SyncStateModel = SyncState,
  ProjectModel = Project,
  SettlementEventModel = SettlementEvent,
  syncKey,
  instanceId = "primary",
  currentGeneration = 1,
  onChainEscrowReader,
  maxRetries = 3,
  onChunkProcessed = null,
}) {
  if (typeof fromBlock !== "bigint" || typeof toBlock !== "bigint" || typeof chunkSize !== "bigint") {
    throw new TypeError("INVALID_CHUNK_RANGE_TYPES");
  }
  if (fromBlock < 0n || toBlock < 0n || chunkSize <= 0n) {
    throw new Error("INVALID_CHUNK_RANGE_BOUNDS");
  }
  if (fromBlock > toBlock) {
    return { status: "EMPTY_RANGE", lastProcessedBlock: fromBlock - 1n };
  }
  if (toBlock > confirmedHead) {
    throw new Error("CONFIRMATION_DEPTH_VIOLATION");
  }

  let currentFrom = fromBlock;

  while (currentFrom <= toBlock) {
    const chunkEnd = currentFrom + chunkSize - 1n;
    const currentTo = chunkEnd > toBlock ? toBlock : chunkEnd;

    // 1. Fetch Logs with RPC-Level Topic Filtering & Jittered Retry
    const rawLogs = await executeWithFullJitter(async () => {
      return await client.getLogs({
        address: contractAddress,
        topics: [MILESTONE_RELEASED_TOPIC],
        fromBlock: currentFrom,
        toBlock: currentTo,
      });
    }, maxRetries);

    // 2. Decode, Verify On-Chain State, and Atomically Reconcile
    for (const rawLog of rawLogs) {
      const verifiedEvent = decodeRawLogToVerifiedEvent({
        rawLog,
        expectedChainId: chainId,
        expectedEscrowAddress: contractAddress,
      });

      if (!verifiedEvent) continue;

      const onChainEscrowState = await onChainEscrowReader(verifiedEvent.projectId);

      await reconcileVerifiedBlockchainEvent({
        ProjectModel,
        SettlementEventModel,
        verifiedEvent,
        onChainEscrowState,
        expectedTokenAddress,
      });

      // Replay-Safe System Event Message Ensure
      await ensureBlockchainSystemEventMessage({
        io,
        projectId: verifiedEvent.projectId,
        chainId,
        contractAddress,
        transactionHash: verifiedEvent.transactionHash,
        logIndex: verifiedEvent.logIndex,
        content: `Milestone ${verifiedEvent.milestoneIndex + 1} Payment Settled On-Chain.`,
      });
    }

    // 3. Telemetry Callback
    if (onChunkProcessed) {
      try {
        await onChunkProcessed(currentFrom, currentTo);
      } catch (err) {
        console.warn(`[Telemetry Warning] onChunkProcessed hook: ${err.message}`);
      }
    }

    // 4. Advance Fenced Checkpoint Cursor
    const checkpointUpdate = await SyncStateModel.updateOne(
      { key: syncKey },
      {
        $set: {
          lastProcessedBlock: Number(currentTo),
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    currentFrom = currentTo + 1n;
  }

  return { status: "COMPLETED", lastProcessedBlock: toBlock };
}

async function orchestrateBlockchainSync({
  client,
  io = null,
  chainId = 11155111,
  contractAddress,
  expectedTokenAddress,
  confirmationDepth = 2n,
  chunkSize = 2000n,
  SyncStateModel = SyncState,
  ProjectModel = Project,
  SettlementEventModel = SettlementEvent,
  syncKey,
  instanceId = "primary",
  currentGeneration = 1,
  contractDeployBlock,
  onChainEscrowReader,
}) {
  const latestHead = await client.getBlockNumber();
  const confirmedHead = latestHead > confirmationDepth ? latestHead - confirmationDepth : 0n;

  const state = await SyncStateModel.findOne({ key: syncKey });
  let fromBlock;

  if (state && state.lastProcessedBlock !== null && state.lastProcessedBlock !== undefined) {
    fromBlock = BigInt(state.lastProcessedBlock) + 1n;
  } else if (contractDeployBlock !== undefined && contractDeployBlock !== null) {
    fromBlock = BigInt(contractDeployBlock);
    if (fromBlock < 0n) throw new Error("NEGATIVE_CONTRACT_DEPLOY_BLOCK");
  } else {
    throw new Error("MISSING_CHECKPOINT_AND_DEPLOY_BLOCK");
  }

  if (fromBlock > confirmedHead) {
    return { status: "WAITING_FOR_CHAIN_CONFIRMATION", fromBlock, confirmedHead };
  }

  return await processBlockchainChunkRange({
    client,
    io,
    chainId,
    contractAddress,
    expectedTokenAddress,
    fromBlock,
    toBlock: confirmedHead,
    confirmedHead,
    chunkSize,
    SyncStateModel,
    ProjectModel,
    SettlementEventModel,
    syncKey,
    instanceId,
    currentGeneration,
    onChainEscrowReader,
  });
}

async function startBlockchainListener() {
  try {
    const escrowAddress = getResolvedContractAddress("ESCROW_CONTRACT_ADDRESS", "ESCROW_ADDRESS");
    const tokenAddress = getResolvedContractAddress("CANONICAL_TOKEN_ADDRESS", "TOKEN_ADDRESS") || "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238";

    if (!process.env.SEPOLIA_RPC_URL || !escrowAddress) {
      console.warn("[BlockchainListener] Inactive: Missing SEPOLIA_RPC_URL or Escrow contract address.");
      return;
    }

    const client = createPublicClient({ chain: sepolia, transport: http(process.env.SEPOLIA_RPC_URL) });
    const syncKey = `sepolia:escrow:${escrowAddress.toLowerCase()}`;
    const onChainEscrowReader = createOnChainEscrowReader(process.env.SEPOLIA_RPC_URL, escrowAddress);
    const deployBlock = process.env.CONTRACT_DEPLOY_BLOCK || process.env.BLOCKCHAIN_DEPLOYMENT_BLOCK || "0";

    const sync = async () => {
      try {
        await orchestrateBlockchainSync({
          client,
          contractAddress: escrowAddress,
          expectedTokenAddress: tokenAddress,
          syncKey,
          contractDeployBlock: deployBlock,
          onChainEscrowReader,
        });
      } catch (err) {
        console.warn("[BlockchainListener] Sync tick error:", err.message);
      }
    };

    await sync();
    client.watchBlockNumber({ emitOnBegin: false, onBlockNumber: () => sync().catch(console.error) });
  } catch (err) {
    console.warn("[BlockchainListener] Initialization error:", err.message);
  }
}

module.exports = {
  isRetryableRpcError,
  executeWithFullJitter,
  processBlockchainChunkRange,
  orchestrateBlockchainSync,
  startBlockchainListener,
};
