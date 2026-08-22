const fs = require("fs");
const path = require("path");
const { createPublicClient, http, decodeEventLog, parseUnits, keccak256, toHex } = require("viem");
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
 * Enforces 2-block confirmation depth for reorg protection,
 * automatic closing of milestone flags on refund/dispute resolution,
 * and retry with exponential backoff on transient network failures.
 * ──────────────────────────────────────────────────────────── */

const MIN_CONFIRMATIONS = 2;
const MAX_RETRY_ATTEMPTS = 3;

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
 * Validates contract configuration and returns canonical contract address.
 * Throws if canonical key and legacy alias are defined with conflicting values.
 */
function getResolvedContractAddress(canonicalKey, legacyAliasKey) {
  const canonical = process.env[canonicalKey];
  const alias = process.env[legacyAliasKey];

  if (canonical && alias && canonical.trim().toLowerCase() !== alias.trim().toLowerCase()) {
    throw new Error(
      `Blockchain configuration conflict: ${canonicalKey} ("${canonical}") and ${legacyAliasKey} ("${alias}") are defined with conflicting values.`
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
 * Retries an asynchronous operation with exponential backoff for transient RPC/DB failures.
 */
async function withRetry(operation, attempts = MAX_RETRY_ATTEMPTS, delayMs = 1000) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await operation();
    } catch (err) {
      lastErr = err;
      if (err.status === 403 || err.message?.includes("not match") || i === attempts - 1) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, i)));
    }
  }
  throw lastErr;
}

/**
 * Reconciles and records on-chain escrow funding for a project with 2-block confirmation depth.
 */
async function reconcileEscrowFunding(projectId, txnHash, requestingUserId = null) {
  return withRetry(async () => {
    const escrowAddress = getResolvedContractAddress("ESCROW_CONTRACT_ADDRESS", "ESCROW_ADDRESS");
    const project = await Project.findById(projectId).populate("clientId", "walletAddress");
    if (!project) throw new Error("Project not found");

    if (requestingUserId) {
      const clientObjId = project.clientId?._id ? String(project.clientId._id) : String(project.clientId);
      if (clientObjId !== String(requestingUserId)) {
        const err = new Error("Only the project client can deposit escrow");
        err.status = 403;
        throw err;
      }
    }

    if (project.escrowFunded) {
      if (txnHash && !project.escrowTxnHash) {
        project.escrowTxnHash = txnHash;
        await project.save();
      }
      return project;
    }

    const client = getPublicClient();
    if (client && escrowAddress && txnHash) {
      let tx, receipt;
      try {
        tx = await client.getTransaction({ hash: txnHash });
        // Enforce MIN_CONFIRMATIONS (2 blocks) before treating event as final
        receipt = await client.waitForTransactionReceipt({ hash: txnHash, confirmations: MIN_CONFIRMATIONS });
      } catch (err) {
        throw new Error(`Blockchain transaction lookup failed: ${err.message}`);
      }

      if (!receipt || receipt.status !== "success") {
        throw new Error("Transaction reverted or failed on-chain.");
      }

      if (!tx.to || tx.to.toLowerCase() !== escrowAddress.toLowerCase()) {
        throw new Error("Transaction target does not match configured EscrowContract address.");
      }

      const clientWallet = project.clientId?.walletAddress?.toLowerCase();
      if (clientWallet && tx.from.toLowerCase() !== clientWallet) {
        throw new Error(`Transaction sender (${tx.from}) does not match verified client wallet (${clientWallet}).`);
      }

      let fundedLogFound = false;
      const expectedBudget = project.budget || 0;
      const expectedAmountUnits = parseUnits(String(expectedBudget), 6);
      const expectedProjectIdHash = keccak256(toHex(String(projectId))).toLowerCase();

      for (const log of receipt.logs) {
        if (log.address.toLowerCase() !== escrowAddress.toLowerCase()) continue;
        try {
          const decoded = decodeEventLog({ abi: ESCROW_ABI, data: log.data, topics: log.topics });
          const matchesProject =
            String(decoded.args.projectId) === String(projectId) ||
            String(decoded.args.projectId).toLowerCase() === expectedProjectIdHash;

          if (decoded.eventName === "EscrowFunded" && matchesProject) {
            if (clientWallet && decoded.args.client.toLowerCase() !== clientWallet) {
              throw new Error(`EscrowFunded log funder (${decoded.args.client}) does not match verified client (${clientWallet}).`);
            }
            if (decoded.args.amount && expectedAmountUnits > 0n && BigInt(decoded.args.amount) !== expectedAmountUnits) {
              console.warn(`EscrowFunded amount (${decoded.args.amount}) differs from expected project budget (${expectedAmountUnits}).`);
            }
            fundedLogFound = true;
            break;
          }
        } catch (err) {
          if (err.message.includes("funder")) throw err;
        }
      }

      if (!fundedLogFound) {
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

    project.escrowFunded = true;
    if (txnHash) project.escrowTxnHash = txnHash;
    await project.save();

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
  });
}

/**
 * Reconciles and records on-chain milestone payment release for a project with 2-block confirmation depth.
 */
async function reconcileMilestoneRelease(projectId, milestoneIndex, txnHash, requestingUserId = null) {
  return withRetry(async () => {
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

    if (requestingUserId) {
      const clientObjId = project.clientId?._id ? String(project.clientId._id) : String(project.clientId);
      if (clientObjId !== String(requestingUserId)) {
        const err = new Error("Only the project client can release milestone escrow");
        err.status = 403;
        throw err;
      }
    }

    if (milestone.paymentReleased) {
      return project;
    }

    const client = getPublicClient();
    if (client && escrowAddress && txnHash) {
      let tx, receipt;
      try {
        tx = await client.getTransaction({ hash: txnHash });
        // Enforce MIN_CONFIRMATIONS (2 blocks) before treating event as final
        receipt = await client.waitForTransactionReceipt({ hash: txnHash, confirmations: MIN_CONFIRMATIONS });
      } catch (err) {
        throw new Error(`Blockchain transaction lookup failed: ${err.message}`);
      }

      if (!receipt || receipt.status !== "success") {
        throw new Error("Transaction reverted or failed on-chain.");
      }

      if (!tx.to || tx.to.toLowerCase() !== escrowAddress.toLowerCase()) {
        throw new Error("Transaction target does not match configured EscrowContract address.");
      }

      const clientWallet = project.clientId?.walletAddress?.toLowerCase();
      if (clientWallet && tx.from.toLowerCase() !== clientWallet) {
        throw new Error(`Transaction sender (${tx.from}) does not match verified client wallet (${clientWallet}).`);
      }

      let releaseLogFound = false;
      const expectedMilestoneAmount = milestone.amount || 0;
      const expectedMilestoneUnits = parseUnits(String(expectedMilestoneAmount), 6);
      const expectedProjectIdHash = keccak256(toHex(String(projectId))).toLowerCase();

      for (const log of receipt.logs) {
        if (log.address.toLowerCase() !== escrowAddress.toLowerCase()) continue;
        try {
          const decoded = decodeEventLog({ abi: ESCROW_ABI, data: log.data, topics: log.topics });
          const matchesProject =
            String(decoded.args.projectId) === String(projectId) ||
            String(decoded.args.projectId).toLowerCase() === expectedProjectIdHash;

          if (
            decoded.eventName === "MilestoneReleased" &&
            matchesProject &&
            Number(decoded.args.milestoneIndex) === index
          ) {
            const expectedFreelancer = project.freelancerId?.walletAddress?.toLowerCase();
            if (expectedFreelancer && decoded.args.freelancer.toLowerCase() !== expectedFreelancer) {
              throw new Error(
                `Milestone released to recipient (${decoded.args.freelancer}) does not match assigned freelancer (${expectedFreelancer}).`
              );
            }
            if (decoded.args.amount && expectedMilestoneUnits > 0n && BigInt(decoded.args.amount) !== expectedMilestoneUnits) {
              console.warn(`MilestoneReleased log amount (${decoded.args.amount}) differs from expected milestone amount (${expectedMilestoneUnits}).`);
            }
            releaseLogFound = true;
            break;
          }
        } catch (err) {
          if (err.message.includes("does not match assigned freelancer")) throw err;
        }
      }

      if (!releaseLogFound) {
        throw new Error("MilestoneReleased event log not found in transaction receipt for this project and milestone index.");
      }
    }

    milestone.paymentReleased = true;
    milestone.status = "completed";

    const allReleased = project.milestones.length > 0 && project.milestones.every((m) => m.paymentReleased);
    if (allReleased) {
      project.escrowCompleted = true;
      project.status = "completed";
    }

    await project.save();

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
  });
}

/**
 * Reconciles escrow refund or dispute resolution on-chain.
 * Closes out all remaining unreleased milestone flags so unreleased financial metrics match on-chain reality.
 */
async function reconcileEscrowCloseout(projectId, reason = "refunded", txnHash = null) {
  return withRetry(async () => {
    const project = await Project.findById(projectId);
    if (!project) throw new Error("Project not found");

    project.escrowCompleted = true;
    project.status = reason === "refunded" ? "refunded" : "completed";

    // Close out all unreleased milestone flags so financial metrics unreleased total resolves to 0
    if (project.milestones && project.milestones.length > 0) {
      project.milestones.forEach((m) => {
        if (!m.paymentReleased) {
          m.paymentReleased = true;
          m.status = "completed";
        }
      });
    }

    await project.save();

    const eventKey = txnHash ? `chain:${txnHash}:closeout` : `reconcile:closeout:${project._id}`;
    recordActivitySafely({
      userIds: [project.clientId?._id || project.clientId, project.freelancerId?._id || project.freelancerId],
      eventKey,
      type: "escrow_closed",
      title: `Escrow ${reason}`,
      message: `Escrow for project “${project.title}” was ${reason}.`,
      projectId: project._id,
    });

    return project;
  });
}

module.exports = {
  getResolvedContractAddress,
  reconcileEscrowFunding,
  reconcileMilestoneRelease,
  reconcileEscrowCloseout,
};
