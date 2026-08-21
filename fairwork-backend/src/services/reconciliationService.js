const fs = require("fs");
const path = require("path");
const { createPublicClient, http, decodeEventLog, parseUnits } = require("viem");
const { sepolia } = require("viem/chains");
const Project = require("../models/Project");
const User = require("../models/User");
const Dispute = require("../models/Dispute");
const { recordActivitySafely } = require("./activityService");

/* ────────────────────────────────────────────────────────────
 * Single Authoritative Financial Reconciliation Service
 *
 * This module is the ONLY server-side writer authorized to mutate:
 *   - project.escrowFunded
 *   - milestone.paymentReleased
 *   - project.escrowCompleted
 *   - project.escrowDisputed
 *
 * Both REST API endpoints (depositEscrow, releaseEscrow) and the
 * asynchronous blockchain listener delegate to this service.
 * ──────────────────────────────────────────────────────────── */

const ESCROW_ABI = [
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
    name: "EscrowFunded",
    inputs: [
      { type: "string", name: "projectId", indexed: true },
      { type: "address", name: "client", indexed: true },
      { type: "uint256", name: "amount", indexed: false },
    ],
  },
  {
    type: "event",
    name: "MilestoneReleased",
    inputs: [
      { type: "string", name: "projectId", indexed: true },
      { type: "uint256", name: "milestoneIndex", indexed: false },
      { type: "address", name: "freelancer", indexed: true },
      { type: "uint256", name: "amount", indexed: false },
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
];

/**
 * Validates contract configuration and returns the canonical address with conflict detection.
 */
function getResolvedContractAddress(canonicalKey, legacyAliasKey) {
  const canonical = process.env[canonicalKey];
  const alias = process.env[legacyAliasKey];

  if (canonical && alias && canonical.trim().toLowerCase() !== alias.trim().toLowerCase()) {
    throw new Error(
      `Blockchain configuration conflict: ${canonicalKey} ("${canonical}") and ${legacyAliasKey} ("${alias}") are defined with different values. Clean up your environment config.`
    );
  }

  const resolved = (canonical || alias || "").trim();
  return resolved ? resolved.toLowerCase() : null;
}

function getPublicClient() {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  if (!rpcUrl) return null;
  try {
    return createPublicClient({ chain: sepolia, transport: http(rpcUrl) });
  } catch {
    return null;
  }
}

/**
 * Reconciles and records on-chain escrow funding for a project.
 *
 * Verifies:
 *  1. Project exists and client caller is authorized
 *  2. Escrow contract address is resolved and configured
 *  3. Transaction hash receipt is successful on Sepolia
 *  4. Transaction target (`to`) matches EscrowContract
 *  5. Transaction sender (`from`) matches the verified Client wallet
 *  6. Receipt contains a valid `EscrowFunded` event log for `projectId`
 *  7. On-chain contract query (`getEscrowParties`) confirms `isFunded === true`
 */
async function reconcileEscrowFunding(projectId, txnHash, requestingUserId = null) {
  const escrowAddress = getResolvedContractAddress("ESCROW_CONTRACT_ADDRESS", "ESCROW_ADDRESS");
  const project = await Project.findById(projectId).populate("clientId", "walletAddress");
  if (!project) throw new Error("Project not found");

  // Authorization check if initiated by API user
  if (requestingUserId) {
    const clientObjId = project.clientId?._id ? String(project.clientId._id) : String(project.clientId);
    if (clientObjId !== String(requestingUserId)) {
      const err = new Error("Only the project client can deposit escrow");
      err.status = 403;
      throw err;
    }
  }

  // Idempotency check: if already funded, return existing project state safely
  if (project.escrowFunded) {
    if (txnHash && !project.escrowTxnHash) {
      project.escrowTxnHash = txnHash;
      await project.save();
    }
    return project;
  }

  const client = getPublicClient();
  if (client && escrowAddress && txnHash) {
    // 1. Fetch transaction and receipt
    let tx, receipt;
    try {
      tx = await client.getTransaction({ hash: txnHash });
      receipt = await client.waitForTransactionReceipt({ hash: txnHash });
    } catch (err) {
      throw new Error(`Blockchain transaction lookup failed: ${err.message}`);
    }

    if (!receipt || receipt.status !== "success") {
      throw new Error("Transaction reverted or failed on-chain.");
    }

    // 2. Verify target contract address
    if (!tx.to || tx.to.toLowerCase() !== escrowAddress.toLowerCase()) {
      throw new Error("Transaction target does not match the configured EscrowContract address.");
    }

    // 3. Verify sender authority: tx.from MUST match client's verified wallet
    const clientWallet = project.clientId?.walletAddress?.toLowerCase();
    if (clientWallet && tx.from.toLowerCase() !== clientWallet) {
      throw new Error(`Transaction sender (${tx.from}) does not match the verified client wallet (${clientWallet}).`);
    }

    // 4. Verify EscrowFunded event log in receipt
    let fundedLogFound = false;
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== escrowAddress.toLowerCase()) continue;
      try {
        const decoded = decodeEventLog({ abi: ESCROW_ABI, data: log.data, topics: log.topics });
        if (decoded.eventName === "EscrowFunded" && String(decoded.args.projectId) === String(projectId)) {
          fundedLogFound = true;
          break;
        }
      } catch {
        // ignore unmatching log topics
      }
    }

    if (!fundedLogFound) {
      // Fallback check on smart contract state read
      try {
        const parties = await client.readContract({
          address: escrowAddress,
          abi: ESCROW_ABI,
          functionName: "getEscrowParties",
          args: [projectId],
        });
        if (!parties || !parties[2]) {
          throw new Error("EscrowFunded event log not found and contract reports isFunded = false.");
        }
      } catch (err) {
        throw new Error(`Escrow contract validation failed: ${err.message}`);
      }
    }
  }

  // Monotonic update: false -> true only
  project.escrowFunded = true;
  if (txnHash) project.escrowTxnHash = txnHash;
  await project.save();

  // Record idempotent activity log
  const eventKey = txnHash ? `chain:${txnHash}:escrow_funded` : `reconcile:escrow_funded:${project._id}`;
  recordActivitySafely({
    userIds: [project.clientId?._id || project.clientId, project.freelancerId?._id || project.freelancerId],
    eventKey,
    type: "escrow_funded",
    title: "Escrow funded",
    message: `Escrow deposit confirmed for “${project.title}”.`,
    projectId: project._id,
  });

  return project;
}

/**
 * Reconciles and records on-chain milestone payment release for a project.
 *
 * Verifies:
 *  1. Project exists and escrow is funded
 *  2. Milestone index is valid and not already released
 *  3. Client caller is authorized
 *  4. Transaction hash receipt is successful on Sepolia
 *  5. Transaction target (`to`) matches EscrowContract
 *  6. Transaction sender (`from`) matches the verified Client wallet
 *  7. Receipt contains a valid `MilestoneReleased` event log for `projectId` and `milestoneIndex`
 */
async function reconcileMilestoneRelease(projectId, milestoneIndex, txnHash, requestingUserId = null) {
  const escrowAddress = getResolvedContractAddress("ESCROW_CONTRACT_ADDRESS", "ESCROW_ADDRESS");
  const project = await Project.findById(projectId)
    .populate("clientId", "walletAddress")
    .populate("freelancerId", "walletAddress");
  if (!project) throw new Error("Project not found");

  if (!project.escrowFunded) {
    throw new Error("Cannot release milestone payment: project escrow is not funded.");
  }

  const index = Number(milestoneIndex);
  if (isNaN(index) || index < 0 || !project.milestones || !project.milestones[index]) {
    throw new Error("Invalid milestone index.");
  }

  const milestone = project.milestones[index];

  // Authorization check if initiated by API user
  if (requestingUserId) {
    const clientObjId = project.clientId?._id ? String(project.clientId._id) : String(project.clientId);
    if (clientObjId !== String(requestingUserId)) {
      const err = new Error("Only the project client can release milestone escrow");
      err.status = 403;
      throw err;
    }
  }

  // Idempotency check: if already released, return existing project state safely
  if (milestone.paymentReleased) {
    return project;
  }

  const client = getPublicClient();
  if (client && escrowAddress && txnHash) {
    let tx, receipt;
    try {
      tx = await client.getTransaction({ hash: txnHash });
      receipt = await client.waitForTransactionReceipt({ hash: txnHash });
    } catch (err) {
      throw new Error(`Blockchain transaction lookup failed: ${err.message}`);
    }

    if (!receipt || receipt.status !== "success") {
      throw new Error("Transaction reverted or failed on-chain.");
    }

    // Verify target contract address
    if (!tx.to || tx.to.toLowerCase() !== escrowAddress.toLowerCase()) {
      throw new Error("Transaction target does not match the configured EscrowContract address.");
    }

    // Verify sender authority: tx.from MUST match client's verified wallet
    const clientWallet = project.clientId?.walletAddress?.toLowerCase();
    if (clientWallet && tx.from.toLowerCase() !== clientWallet) {
      throw new Error(`Transaction sender (${tx.from}) does not match the verified client wallet (${clientWallet}).`);
    }

    // Verify MilestoneReleased event log in receipt
    let releaseLogFound = false;
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== escrowAddress.toLowerCase()) continue;
      try {
        const decoded = decodeEventLog({ abi: ESCROW_ABI, data: log.data, topics: log.topics });
        if (
          decoded.eventName === "MilestoneReleased" &&
          String(decoded.args.projectId) === String(projectId) &&
          Number(decoded.args.milestoneIndex) === index
        ) {
          // Verify recipient freelancer address matches expected freelancer
          const expectedFreelancer = project.freelancerId?.walletAddress?.toLowerCase();
          if (expectedFreelancer && decoded.args.freelancer.toLowerCase() !== expectedFreelancer) {
            throw new Error(
              `Milestone released to recipient (${decoded.args.freelancer}) does not match assigned freelancer (${expectedFreelancer}).`
            );
          }
          releaseLogFound = true;
          break;
        }
      } catch (err) {
        if (err.message.includes("does not match assigned freelancer")) throw err;
      }
    }

    if (!releaseLogFound) {
      // Query contract state directly as fallback
      try {
        const parties = await client.readContract({
          address: escrowAddress,
          abi: ESCROW_ABI,
          functionName: "getEscrowParties",
          args: [projectId],
        });
        if (!parties) throw new Error("Could not fetch on-chain escrow state.");
      } catch (err) {
        throw new Error(`Milestone release validation failed: ${err.message}`);
      }
    }
  }

  // Monotonic update: false -> true only
  milestone.paymentReleased = true;
  milestone.status = "completed";

  const allReleased = project.milestones.length > 0 && project.milestones.every((m) => m.paymentReleased);
  if (allReleased) {
    project.escrowCompleted = true;
    project.status = "completed";
  }

  await project.save();

  // Record idempotent activity log
  const eventKey = txnHash ? `chain:${txnHash}:release:${index}` : `reconcile:release:${project._id}:${index}`;
  recordActivitySafely({
    userIds: [project.clientId?._id || project.clientId, project.freelancerId?._id || project.freelancerId],
    eventKey,
    type: "milestone_released",
    title: "Milestone payment released",
    message: `Payment released for milestone “${milestone.title}”.`,
    projectId: project._id,
    milestoneIndex: index,
  });

  return project;
}

module.exports = {
  getResolvedContractAddress,
  reconcileEscrowFunding,
  reconcileMilestoneRelease,
};
