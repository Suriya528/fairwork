const fs = require("fs");
const path = require("path");
const { logger } = require("../utils/logger");
const { createPublicClient, http } = require("viem");
const { resolveViemChain, getRpcUrl } = require("./chainResolver");
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
  buildBlockchainEventKey,
} = require("./reconciliationService");
const mongoose = require("mongoose");
const {
  handleEscrowFunded,
  handleEscrowRefunded,
  handleRefundRequested,
  handleRefundCancelled,
  handleEscrowDisputed,
  handleDisputeResolved,
} = require("./eventHandlers");

function safeStringify(val) {
  if (val === undefined || val === null) return null;
  try {
    return JSON.stringify(val, (key, value) => typeof value === "bigint" ? value.toString() : value);
  } catch {
    return String(val);
  }
}

const listenerStatus = {
  started: false,
  healthy: true,
  halted: false,
  lastPollTimestamp: null,
  lastProcessedBlock: null,
  consecutiveFailures: 0,
  lastError: null,
};

function getListenerStatus() {
  return { ...listenerStatus };
}

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
  try {
    const podId = config.podId || `pod-${process.pid}-${Math.random().toString(36).slice(2, 7)}`;
    const syncKey = config.syncKey || "SEPOLIA_ESCROW_SYNC";

    // 1. Startup Integrity Bundle Verification
    const integrity = await verifyAtStartup(config);
    if (integrity.status === "FAILED_PROD") {
      throw new Error("STARTUP_INTEGRITY_VERIFICATION_FAILED");
    }

    const escrowAddress = getResolvedContractAddress("CANONICAL_ESCROW_ADDRESS", "ESCROW_ADDRESS");
    const tokenAddress = getResolvedContractAddress("CANONICAL_TOKEN_ADDRESS", "USDC_ADDRESS");
    const rpcUrl = getRpcUrl(config.rpcUrl);
    const chainId = config.chainId || parseInt(process.env.CHAIN_ID || "11155111", 10);

    if (!escrowAddress) {
      logger.warn("WARNING: Escrow address unconfigured. Blockchain listener paused.");
      return;
    }

    // 2. Ensure SyncState document exists
    await ensureSyncState(syncKey, chainId, escrowAddress);

    const publicClient = createPublicClient({ chain: resolveViemChain(chainId), transport: http(rpcUrl) });
  let currentLease = await acquireLease(podId, syncKey);

  if (!currentLease) {
    logger.info(`[Indexer ${podId}] Lease active by another pod or active takeover. Retrying in 15s...`);
  }

  // H-2R: Drain-aware polling via self-scheduling setTimeout chain
  let shuttingDown = false;
  let shutdownResolve;
  const shutdownPromise = new Promise((resolve) => { shutdownResolve = resolve; });
  let pollTimeoutId;

  async function poll() {
    if (shuttingDown) { shutdownResolve(); return; }
    try {
      if (!currentLease) {
        currentLease = await acquireLease(podId, syncKey);
        if (!currentLease) {
          if (!shuttingDown) pollTimeoutId = setTimeout(poll, 15000);
          else shutdownResolve();
          return;
        }
      } else {
        currentLease = await renewLease(podId, currentLease.leaseGeneration, syncKey);
        if (!currentLease) {
          if (!shuttingDown) pollTimeoutId = setTimeout(poll, 15000);
          else shutdownResolve();
          return;
        }
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
        logger.warn(`[Indexer ${podId}] Reorg detected! Depth: ${reorgCheck.reorgDepth}, Ancestor: ${reorgCheck.commonAncestorBlock}`);
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
      const CONFIRMATION_DEPTH = BigInt(process.env.CONFIRMATION_DEPTH || (process.env.NODE_ENV === "production" ? 3 : 1));
      const fromBlock = BigInt(currentLease.lastProcessedBlock + 1);
      const latestBlock = await executeWithFullJitter(() => publicClient.getBlockNumber());
      const safeHeadBlock = latestBlock >= CONFIRMATION_DEPTH ? latestBlock - CONFIRMATION_DEPTH : 0n;

      if (safeHeadBlock < fromBlock) {
        // No newly confirmed blocks — just process outbox
        await pollAndProcessOutboxBatch(podId, 10, config.io);
        listenerStatus.healthy = true;
        listenerStatus.consecutiveFailures = 0;
        return;
      }

      const toBlock = safeHeadBlock - fromBlock > BigInt(CHUNK_SIZE)
        ? fromBlock + BigInt(CHUNK_SIZE) - 1n
        : safeHeadBlock;

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
        if (rawLog.blockNumber && rawLog.blockHash) {
          await BlockCheckpoint.updateOne(
            { chainId, contractAddress: escrowAddress.toLowerCase(), blockNumber: Number(rawLog.blockNumber) },
            { $set: { blockHash: rawLog.blockHash.toLowerCase() } },
            { upsert: true }
          );
        }

        let verifiedEvent;
        try {
          verifiedEvent = decodeRawLogToVerifiedEvent({
            rawLog,
            expectedChainId: chainId,
            expectedEscrowAddress: escrowAddress,
          });
        } catch (decodeErr) {
          // Quarantine malformed events
          try {
            await QuarantineEvent.create({
              category: "DECODE_FAILURE",
              chainId,
              contractAddress: escrowAddress.toLowerCase(),
              blockNumber: rawLog?.blockNumber ? Number(rawLog.blockNumber) : null,
              transactionHash: rawLog?.transactionHash ? String(rawLog.transactionHash).toLowerCase() : null,
              logIndex: rawLog?.logIndex !== undefined && rawLog?.logIndex !== null ? Number(rawLog.logIndex) : null,
              errorMessage: decodeErr.message,
              rawEventData: safeStringify(rawLog),
            });
          } catch (qErr) {
            logger.error(`[Indexer ${podId}] Failed to record QuarantineEvent for DECODE_FAILURE:`, qErr.message);
          }
          continue;
        }

        if (!verifiedEvent) continue; // Unknown event type, skipped

        const eventName = verifiedEvent.eventName;
        const needsOnChainRead = ['MilestoneReleased', 'EscrowFunded', 'EscrowRefunded', 'DisputeResolved'].includes(eventName);

        let onChainEscrowState;
        if (needsOnChainRead) {
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
                    { type: "uint256", name: "totalAmount" },
                    { type: "uint256", name: "releasedAmount" },
                    { type: "bool", name: "isFunded" },
                    { type: "bool", name: "isDisputed" },
                    { type: "bool", name: "isCompleted" },
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
              releasedAmount: escrowData[4],
              funded: Boolean(escrowData[5]),
              isDisputed: Boolean(escrowData[6]),
              completed: Boolean(escrowData[7]),
            };
          } catch (readErr) {
            try {
              await QuarantineEvent.create({
                category: "ON_CHAIN_READ_FAILURE",
                chainId,
                contractAddress: escrowAddress.toLowerCase(),
                blockNumber: verifiedEvent.blockNumber,
                transactionHash: verifiedEvent.transactionHash,
                logIndex: verifiedEvent.logIndex,
                errorMessage: readErr.message,
                stackTrace: readErr.stack,
                rawEventData: safeStringify(verifiedEvent),
              });
            } catch (qErr) {
              logger.error(`[Indexer ${podId}] Failed to record QuarantineEvent for ON_CHAIN_READ_FAILURE:`, qErr.message);
            }
            continue;
          }
        }

        // Reconcile event within an ACID transaction with generation fencing
        try {
          if (eventName === "MilestoneReleased") {
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
          } else {
            const session = await mongoose.startSession();
            try {
              session.startTransaction();
              await validateFence(syncKey, podId, currentLease.leaseGeneration, session);
              
              if (eventName === 'EscrowFunded') await handleEscrowFunded({ verifiedEvent, onChainEscrowState, session });
              else if (eventName === 'EscrowRefunded') await handleEscrowRefunded({ verifiedEvent, session });
              else if (eventName === 'RefundRequested') await handleRefundRequested({ verifiedEvent, session });
              else if (eventName === 'RefundCancelled') await handleRefundCancelled({ verifiedEvent, session });
              else if (eventName === 'EscrowDisputed') await handleEscrowDisputed({ verifiedEvent, session });
              else if (eventName === 'DisputeResolved') await handleDisputeResolved({ verifiedEvent, onChainEscrowState, session });

              await session.commitTransaction();
            } catch (err) {
              if (session.inTransaction()) await session.abortTransaction();
              throw err;
            } finally {
              await session.endSession();
            }
          }
        } catch (reconcileErr) {
          if (reconcileErr.message === "STALE_GENERATION_FENCE_VIOLATION") {
            logger.warn(`[Indexer ${podId}] Fence violation — lease stolen. Stopping.`);
            currentLease = null;
            return;
          }
          logger.error(`[Indexer ${podId}] Reconciliation error for event ${verifiedEvent.transactionHash}:${verifiedEvent.logIndex}:`, reconcileErr.message);
          try {
            await QuarantineEvent.create({
              category: "BUSINESS_STATE_CONFLICT",
              sourceEventKey: verifiedEvent ? buildBlockchainEventKey({
                chainId,
                contractAddress: escrowAddress,
                transactionHash: verifiedEvent.transactionHash,
                logIndex: verifiedEvent.logIndex,
              }) : null,
              chainId,
              contractAddress: escrowAddress.toLowerCase(),
              blockNumber: verifiedEvent?.blockNumber,
              transactionHash: verifiedEvent?.transactionHash,
              logIndex: verifiedEvent?.logIndex,
              rawEventData: safeStringify(verifiedEvent),
              errorMessage: reconcileErr.message,
              stackTrace: reconcileErr.stack,
            });
          } catch (qErr) {
            logger.error(`[Indexer ${podId}] Failed to record QuarantineEvent:`, qErr.message);
          }
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

      listenerStatus.healthy = true;
      listenerStatus.halted = false;
      listenerStatus.consecutiveFailures = 0;
      listenerStatus.lastError = null;
      listenerStatus.lastProcessedBlock = lastBlockNum;

      // Run background Outbox Event Worker batch
      await pollAndProcessOutboxBatch(podId, 10, config.io);

    } catch (err) {
      listenerStatus.consecutiveFailures++;
      listenerStatus.lastError = err.message;
      if (err.message?.includes("REORG_HISTORY_UNAVAILABLE") || err.message?.includes("REORG_EXCEEDS_MAX_DEPTH") || listenerStatus.consecutiveFailures >= 5) {
        listenerStatus.healthy = false;
        listenerStatus.halted = true;
        logger.error(`CRITICAL INDEXER HALT: ${err.message}`);
        try {
          await QuarantineEvent.create({
            category: "OPERATOR_REVIEW",
            errorMessage: err.message,
            stackTrace: err.stack,
          });
        } catch (qErr) {
          logger.error(`[Indexer ${podId}] Failed to record QuarantineEvent:`, qErr.message);
        }
      } else {
        logger.error(`[Indexer ${podId}] Error in loop:`, err.message);
      }
    }

    // Schedule next iteration
    if (!shuttingDown && !listenerStatus.halted) {
      pollTimeoutId = setTimeout(poll, 15000);
    } else {
      shutdownResolve();
    }
  }

  // Start the first iteration
  listenerStatus.started = true;
  pollTimeoutId = setTimeout(poll, 1000);

    return {
      pollTimeoutId,
      podId,
      syncKey,
      async shutdown() {
        shuttingDown = true;
        listenerStatus.healthy = false;
        listenerStatus.halted = true;
        clearTimeout(pollTimeoutId);
        await shutdownPromise;
        logger.info(`[Indexer ${podId}] Shutdown complete — in-flight work drained.`);
      },
    };
  } catch (err) {
    listenerStatus.started = false;
    listenerStatus.healthy = false;
    listenerStatus.halted = true;
    listenerStatus.lastError = err.message;
    throw err;
  }
}

module.exports = {
  startBlockchainListener,
  getListenerStatus,
  isRetryableRpcError,
  executeWithFullJitter,
};
