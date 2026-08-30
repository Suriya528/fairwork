const fs = require("fs");
const path = require("path");
const { createPublicClient, http } = require("viem");
const { sepolia } = require("viem/chains");
const Project = require("../models/Project.js");
const SyncState = require("../models/BlockchainSyncState");
const SettlementEvent = require("../models/SettlementEvent");
const BlockCheckpoint = require("../models/BlockCheckpoint");
const OutboxEvent = require("../models/OutboxEvent");
const QuarantineEvent = require("../models/QuarantineEvent");
const { verifyAtStartup } = require("./contractIntegrity");
const { ensureSyncState, acquireLease, renewLease, validateFence } = require("./leaseManager");
const { pollAndProcessOutboxBatch } = require("./outboxWorker");
const { detectReorg, processReorgReversal } = require("./reorgEngine");
const {
  decodeRawLogToVerifiedEvent,
  reconcileVerifiedBlockchainEvent,
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

async function executeWithFullJitter(fn, maxRetries = 3, baseDelayMs = 20, maxDelayMs = 1000) {
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
      const jitteredSleep = Math.floor(Math.random() * calculatedMax);
      await new Promise((r) => setTimeout(r, jitteredSleep));
    }
  }
}

/**
 * Main loop for the blockchain indexing service.
 */
async function startBlockchainListener(config = {}) {
  const podId = config.podId || `pod-${process.pid}-${Math.random().toString(36).slice(2, 7)}`;
  const syncKey = config.syncKey || "SEPOLIA_ESCROW_SYNC";

  // 1. Startup Integrity Bundle Verification
  const integrity = await verifyAtStartup(config);
  if (integrity.status === "FAILED_PROD") {
    throw new Error("STARTUP_INTEGRITY_VERIFICATION_FAILED");
  }

  const escrowAddress = getResolvedContractAddress("CANONICAL_ESCROW_ADDRESS", "ESCROW_ADDRESS");
  const tokenAddress = getResolvedContractAddress("CANONICAL_TOKEN_ADDRESS", "USDC_ADDRESS");
  const rpcUrl = config.rpcUrl || process.env.SEPOLIA_RPC_URL || process.env.RPC_URL || "https://rpc.sepolia.org";
  const chainId = config.chainId || parseInt(process.env.CHAIN_ID || "11155111", 10);

  if (!escrowAddress) {
    console.warn("WARNING: Escrow address unconfigured. Blockchain listener paused.");
    return;
  }

  // 2. Ensure SyncState document exists
  await ensureSyncState(syncKey, chainId, escrowAddress);

  const publicClient = createPublicClient({ chain: sepolia, transport: http(rpcUrl) });
  let currentLease = await acquireLease(podId, syncKey);

  if (!currentLease) {
    console.log(`[Indexer ${podId}] Lease active by another pod or active takeover. Retrying in 15s...`);
  }

  // Polling loop
  const pollIntervalId = setInterval(async () => {
    try {
      if (!currentLease) {
        currentLease = await acquireLease(podId, syncKey);
        if (!currentLease) return;
      } else {
        currentLease = await renewLease(podId, currentLease.leaseGeneration, syncKey);
        if (!currentLease) return; // Lease lost or stolen
      }

      // Check for reorgs before chunk processing
      const reorgCheck = await detectReorg({
        publicClient,
        chainId,
        contractAddress: escrowAddress,
        lastProcessedBlock: currentLease.lastProcessedBlock,
        lastProcessedBlockHash: currentLease.lastProcessedBlockHash,
      });

      if (reorgCheck.hasReorg) {
        console.warn(`[Indexer ${podId}] Reorg detected! Depth: ${reorgCheck.reorgDepth}, Ancestor: ${reorgCheck.commonAncestorBlock}`);
        await processReorgReversal({
          chainId,
          contractAddress: escrowAddress,
          orphanedBlockStart: reorgCheck.orphanedBlockStart,
          orphanedBlockEnd: reorgCheck.orphanedBlockEnd,
          io: config.io,
        });

        // Reset sync state cursor to common ancestor
        await SyncState.updateOne(
          { key: syncKey, leaseOwner: podId, leaseGeneration: currentLease.leaseGeneration },
          { $set: { lastProcessedBlock: reorgCheck.commonAncestorBlock } }
        );
        return;
      }

      // ── Core Block Processing: fetch new logs and reconcile ──
      const CHUNK_SIZE = config.chunkSize || 500;
      const fromBlock = BigInt(currentLease.lastProcessedBlock + 1);
      const latestBlock = await executeWithFullJitter(() => publicClient.getBlockNumber());

      if (latestBlock < fromBlock) {
        // No new blocks — just process outbox
        await pollAndProcessOutboxBatch(podId, 10, config.io);
        return;
      }

      const toBlock = latestBlock - fromBlock > BigInt(CHUNK_SIZE)
        ? fromBlock + BigInt(CHUNK_SIZE) - 1n
        : latestBlock;

      // Fetch logs from the escrow contract in the block range
      const logs = await executeWithFullJitter(() =>
        publicClient.getLogs({
          address: escrowAddress,
          fromBlock,
          toBlock,
        })
      );

      let lastBlockNum = Number(toBlock);
      let lastBlockHash = null;

      // Fetch the block hash for the last block in the range (for reorg detection)
      const lastBlockData = await executeWithFullJitter(() =>
        publicClient.getBlock({ blockNumber: toBlock })
      );
      lastBlockHash = lastBlockData.hash.toLowerCase();

      // Process each log
      for (const rawLog of logs) {
        let verifiedEvent;
        try {
          verifiedEvent = decodeRawLogToVerifiedEvent({
            rawLog,
            expectedChainId: chainId,
            expectedEscrowAddress: escrowAddress,
          });
        } catch (decodeErr) {
          // Quarantine malformed events
          await QuarantineEvent.create({
            category: "DECODE_FAILURE",
            errorMessage: decodeErr.message,
            rawEventData: JSON.stringify(rawLog),
          });
          continue;
        }

        if (!verifiedEvent) continue; // Not a MilestoneReleased event

        // On-chain escrow state read for reconciliation
        let onChainEscrowState;
        try {
          const escrowData = await executeWithFullJitter(() =>
            publicClient.readContract({
              address: escrowAddress,
              abi: [{
                type: "function", name: "escrows", stateMutability: "view",
                inputs: [{ type: "string", name: "projectId" }],
                outputs: [
                  { type: "address", name: "client" },
                  { type: "address", name: "freelancer" },
                  { type: "address", name: "token" },
                  { type: "uint256", name: "totalBudget" },
                  { type: "bool", name: "funded" },
                  { type: "bool", name: "completed" },
                ],
              }],
              functionName: "escrows",
              args: [verifiedEvent.projectId],
            })
          );
          onChainEscrowState = {
            client: escrowData[0],
            freelancer: escrowData[1],
            token: escrowData[2],
            totalBudget: escrowData[3],
            funded: escrowData[4],
            completed: escrowData[5],
          };
        } catch (readErr) {
          await QuarantineEvent.create({
            category: "ON_CHAIN_READ_FAILURE",
            errorMessage: readErr.message,
            rawEventData: JSON.stringify(verifiedEvent),
          });
          continue;
        }

        // Reconcile event within an ACID transaction with generation fencing
        try {
          await reconcileVerifiedBlockchainEvent({
            verifiedEvent,
            onChainEscrowState,
            expectedTokenAddress: tokenAddress,
            fenceState: {
              syncKey,
              podId,
              currentGeneration: currentLease.leaseGeneration,
            },
          });
        } catch (reconcileErr) {
          if (reconcileErr.message === "STALE_GENERATION_FENCE_VIOLATION") {
            console.warn(`[Indexer ${podId}] Fence violation — lease stolen. Stopping.`);
            currentLease = null;
            return;
          }
          console.error(`[Indexer ${podId}] Reconciliation error for event ${verifiedEvent.transactionHash}:${verifiedEvent.logIndex}:`, reconcileErr.message);
        }
      }

      // Record block checkpoint for the last block in the range
      await BlockCheckpoint.findOneAndUpdate(
        { chainId, contractAddress: escrowAddress.toLowerCase(), blockNumber: lastBlockNum },
        { $set: { blockHash: lastBlockHash, parentHash: lastBlockData.parentHash?.toLowerCase() || null } },
        { upsert: true }
      );

      // Advance the sync cursor
      await SyncState.updateOne(
        { key: syncKey, leaseOwner: podId, leaseGeneration: currentLease.leaseGeneration },
        { $set: { lastProcessedBlock: lastBlockNum, lastProcessedBlockHash: lastBlockHash } }
      );

      // Run background Outbox Event Worker batch
      await pollAndProcessOutboxBatch(podId, 10, config.io);

    } catch (err) {
      if (err.message?.includes("REORG_HISTORY_UNAVAILABLE") || err.message?.includes("REORG_EXCEEDS_MAX_DEPTH")) {
        console.error(`CRITICAL INDEXER HALT: ${err.message}`);
        await QuarantineEvent.create({
          category: "OPERATOR_REVIEW",
          errorMessage: err.message,
          stackTrace: err.stack,
        });
      } else {
        console.error(`[Indexer ${podId}] Error in loop:`, err.message);
      }
    }
  }, 15000);

  return { pollIntervalId, podId, syncKey };
}

module.exports = {
  startBlockchainListener,
  isRetryableRpcError,
  executeWithFullJitter,
};
