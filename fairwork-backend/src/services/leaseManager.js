const BlockchainSyncState = require("../models/BlockchainSyncState");

/**
 * Fencing Lease Manager
 * 
 * Implements pure CAS lease takeover and generation-based fencing.
 * Invariant: leaseOwner and leaseGeneration are NEVER written outside leaseManager.js.
 */
const DEFAULT_LEASE_TTL_MS = 60 * 1000; // 60 seconds

/**
 * Called once during deployment or process startup to initialize the SyncState record.
 * Idempotent — does nothing if document already exists.
 */
async function ensureSyncState(syncKey = "SEPOLIA_ESCROW_SYNC", chainId = 11155111, contractAddress = null) {
  const existing = await BlockchainSyncState.findOne({ key: syncKey });
  if (!existing) {
    await BlockchainSyncState.create({
      key: syncKey,
      lastProcessedBlock: 0,
      lastProcessedBlockHash: null,
      leaseOwner: null,
      leaseGeneration: 0,
      leaseExpiresAt: new Date(0),
      lastFenceGeneration: 0,
      chainId,
      contractAddress: contractAddress ? contractAddress.toLowerCase() : null,
    });
  }
}

/**
 * Pure CAS takeover of the sync lease.
 * Returns updated sync state document if lease acquired, or null if lease is active by another pod.
 */
async function acquireLease(podId, syncKey = "SEPOLIA_ESCROW_SYNC", leaseTTLMs = DEFAULT_LEASE_TTL_MS) {
  const now = new Date();

  // Pure CAS query: only acquire if lease is unassigned OR expired
  const doc = await BlockchainSyncState.findOneAndUpdate(
    {
      key: syncKey,
      $or: [
        { leaseOwner: null },
        { leaseExpiresAt: { $lte: now } },
      ],
    },
    {
      $set: {
        leaseOwner: podId,
        leaseExpiresAt: new Date(Date.now() + leaseTTLMs),
      },
      $inc: { leaseGeneration: 1 },
    },
    { returnDocument: "after" }
  );

  return doc; // Returns null if held actively by another pod or same pod (caller should renewLease if same pod)
}

/**
 * Extends lease expiry without incrementing generation.
 */
async function renewLease(podId, expectedGeneration, syncKey = "SEPOLIA_ESCROW_SYNC", leaseTTLMs = DEFAULT_LEASE_TTL_MS) {
  const doc = await BlockchainSyncState.findOneAndUpdate(
    {
      key: syncKey,
      leaseOwner: podId,
      leaseGeneration: expectedGeneration,
    },
    {
      $set: { leaseExpiresAt: new Date(Date.now() + leaseTTLMs) },
    },
    { returnDocument: "after" }
  );

  return doc;
}

/**
 * Validates generation-based fence inside a MongoDB ACID transaction.
 * Updates lastFenceGeneration to currentGeneration.
 */
async function validateFence(syncKey, podId, currentGeneration, session) {
  const fenceResult = await BlockchainSyncState.findOneAndUpdate(
    {
      key: syncKey,
      leaseOwner: podId,
      leaseGeneration: currentGeneration,
    },
    {
      $set: { lastFenceGeneration: currentGeneration },
    },
    { session, returnDocument: "after" }
  );

  if (!fenceResult) {
    const err = new Error("STALE_GENERATION_FENCE_VIOLATION");
    err.statusCode = 409;
    throw err;
  }

  return fenceResult;
}

module.exports = {
  ensureSyncState,
  acquireLease,
  renewLease,
  validateFence,
};
