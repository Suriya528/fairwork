const Project = require("../models/Project.js");

/**
 * SINGLE CONTROLLED WRITE BOUNDARY FOR SETTLEMENT SNAPSHOTS
 * 
 * Invariant: All mutations to project.settlement.* MUST pass through this service.
 * Direct modification of settlement.* via arbitrary controllers or query updates is prohibited.
 * Every write relies strictly on MongoDB query predicate: { _id, "settlement.fundingLockedAt": null }.
 */

function assertSettlementSnapshotMutable(project) {
  if (project.settlement?.fundingLockedAt) {
    const err = new Error("SETTLEMENT_SNAPSHOT_IMMUTABLE: Cannot modify locked settlement snapshot");
    err.statusCode = 409;
    throw err;
  }
}

/**
 * Creates or updates an unfrozen settlement snapshot on a Project.
 * Uses atomic CAS predicate { _id: projectId, "settlement.fundingLockedAt": null }.
 */
async function createSettlementSnapshot(projectId, { tokenAddress, tokenDecimals = 6 }, session = null) {
  if (!tokenAddress || !/^0x[a-f0-9]{40}$/i.test(tokenAddress)) {
    throw new Error("INVALID_TOKEN_ADDRESS_FORMAT");
  }

  const project = await Project.findById(projectId);
  if (!project) {
    const err = new Error("PROJECT_NOT_FOUND");
    err.statusCode = 404;
    throw err;
  }

  assertSettlementSnapshotMutable(project);

  // USD to USDC 1:1 conversion calculation for milestones
  const expectedMilestoneUnits = project.milestones.map((m) => {
    const amtStr = m.amount ? m.amount.toString() : "0";
    const [wholeStr, fracStr = ""] = amtStr.split(".");
    const normalizedFrac = fracStr.padEnd(2, "0").slice(0, 2);
    const totalCents = BigInt(wholeStr) * 100n + BigInt(normalizedFrac);
    const multiplier = 10n ** BigInt(tokenDecimals - 2);
    return (totalCents * multiplier).toString();
  });

  const totalCents = project.milestones.reduce((acc, m) => {
    const amtStr = m.amount ? m.amount.toString() : "0";
    const [wholeStr, fracStr = ""] = amtStr.split(".");
    const normalizedFrac = fracStr.padEnd(2, "0").slice(0, 2);
    return acc + BigInt(wholeStr) * 100n + BigInt(normalizedFrac);
  }, 0n);

  const multiplier = 10n ** BigInt(tokenDecimals - 2);
  const expectedTotalUnits = (totalCents * multiplier).toString();

  const snapshotData = {
    tokenAddress: tokenAddress.toLowerCase(),
    tokenDecimals,
    expectedTotalUnits,
    expectedMilestoneUnits,
    fundingLockedAt: null,
  };

  const updateOpts = { returnDocument: "after" };
  if (session) updateOpts.session = session;

  const updated = await Project.findOneAndUpdate(
    { _id: projectId, "settlement.fundingLockedAt": null },
    { $set: { settlement: snapshotData } },
    updateOpts
  );

  if (!updated) {
    const err = new Error("SETTLEMENT_SNAPSHOT_IMMUTABLE: Cannot modify locked settlement snapshot");
    err.statusCode = 409;
    throw err;
  }

  return updated;
}

/**
 * Atomically locks the settlement snapshot when on-chain funding is verified.
 * Uses atomic CAS predicate { _id: projectId, "settlement.fundingLockedAt": null }.
 */
async function lockSettlementSnapshot(projectId, session = null) {
  const updateOpts = { returnDocument: "after" };
  if (session) updateOpts.session = session;

  const result = await Project.findOneAndUpdate(
    { _id: projectId, "settlement.fundingLockedAt": null },
    { $set: { "settlement.fundingLockedAt": new Date() } },
    updateOpts
  );

  if (!result) {
    const err = new Error("SNAPSHOT_ALREADY_LOCKED_OR_MISSING");
    err.statusCode = 409;
    throw err;
  }

  return result;
}

module.exports = {
  assertSettlementSnapshotMutable,
  createSettlementSnapshot,
  lockSettlementSnapshot,
};
