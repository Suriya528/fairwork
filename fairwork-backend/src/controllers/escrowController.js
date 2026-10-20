const mongoose = require("mongoose");
const { reconcileEscrowFunding, reconcileMilestoneRelease } = require("../services/reconciliationService");

/**
 * REST Endpoint for Client Escrow Deposit Reconciliation Request.
 *
 * This endpoint accepts a reconciliation request with a confirmed transaction hash.
 * It DOES NOT independently mutate financial state; it delegates to the single
 * authoritative reconciliation service which verifies on-chain facts (chain, contract,
 * sender wallet, event log, contract state) before recording financial truth.
 */
exports.depositEscrow = async (req, res) => {
  try {
    const { projectId, txnHash } = req.body;
    if (!projectId || !mongoose.isValidObjectId(projectId)) return res.status(400).json({ message: "Valid projectId is required" });
    if (!txnHash) return res.status(400).json({ message: "Transaction hash (txnHash) is required" });

    // Enforce mutual contract signature before escrow deposit reconciliation
    const Contract = require("../models/Contract");
    const contract = await Contract.findOne({ projectId });
    if (!contract || !contract.signedByClient || !contract.signedByFreelancer) {
      return res.status(400).json({
        message: "Both client and freelancer must digitally sign the contract agreement before escrow funds can be deposited.",
      });
    }

    const project = await reconcileEscrowFunding(projectId, txnHash, req.user.id);

    // Real-time notification to assigned freelancer confirming escrow deposit
    const freelancerId = project.freelancerId
      ? (typeof project.freelancerId === 'object' && project.freelancerId !== null ? project.freelancerId._id : project.freelancerId)
      : null;

    try {
      const io = req.app.get("io");
      if (io && freelancerId) {
        io.to(`user:${freelancerId}`).emit("notification", {
          type: "ESCROW_FUNDED",
          title: "Escrow Deposit Confirmed! 🛡️",
          message: `The client has securely funded the escrow for "${project.title}". Your payout is locked on-chain in the smart contract vault. You may now begin work and submit deliverables.`,
          txHash: txnHash,
          projectId: project._id,
        });
      }
    } catch (socketErr) {
      console.warn("[EscrowController] Socket notification skipped:", socketErr.message);
    }

    // Activity log notifications for mutual transparency & authenticity
    try {
      const { recordActivitySafely } = require("../services/activityService");
      recordActivitySafely({
        userIds: [req.user.id],
        eventKey: `escrow-funded-client:${project._id}:${txnHash}`,
        actorId: req.user.id,
        type: "escrow_funded",
        title: "Escrow Funded",
        message: `You deposited and locked escrow funds for "${project.title}".`,
        projectId: project._id,
      });
      if (freelancerId) {
        recordActivitySafely({
          userIds: [freelancerId],
          eventKey: `escrow-funded-freelancer:${project._id}:${txnHash}`,
          actorId: req.user.id,
          type: "escrow_funded",
          title: "Escrow Funds Locked & Guaranteed 🛡️",
          message: `The client has funded the escrow for "${project.title}". Your payout is secured in the smart contract vault. You can now submit deliverables.`,
          projectId: project._id,
        });
      }
    } catch (actErr) {
      console.warn("[EscrowController] Activity log skipped:", actErr.message);
    }

    res.json({ message: "Escrow recorded successfully", project });
  } catch (err) {
    const status = err.status || (err.message && /^[A-Z_]+/.test(err.message) ? 400 : 500);
    console.error("[EscrowController] depositEscrow error:", err);
    res.status(status).json({ message: status < 500 ? err.message : "Failed to reconcile escrow deposit." });
  }
};

/**
 * REST Endpoint for Client Milestone Escrow Release Reconciliation Request.
 *
 * This endpoint accepts a reconciliation request with a confirmed transaction hash.
 * It DOES NOT independently mutate financial state; it delegates to the single
 * authoritative reconciliation service which verifies on-chain facts (chain, contract,
 * sender wallet, recipient wallet, event log, contract state) before recording financial truth.
 */
exports.releaseEscrow = async (req, res) => {
  try {
    const { projectId, milestoneIndex, txnHash } = req.body;
    if (!projectId || !mongoose.isValidObjectId(projectId)) return res.status(400).json({ message: "Valid projectId is required" });
    if (milestoneIndex === undefined || milestoneIndex === null) return res.status(400).json({ message: "milestoneIndex is required" });
    if (!txnHash) return res.status(400).json({ message: "Transaction hash (txnHash) is required" });

    const project = await reconcileMilestoneRelease(projectId, Number(milestoneIndex), txnHash, req.user.id);
    res.json({ message: "Escrow payment released successfully", project });
  } catch (err) {
    const status = err.status || (err.message && /^[A-Z_]+/.test(err.message) ? 400 : 500);
    console.error("[EscrowController] releaseEscrow error:", err);
    res.status(status).json({ message: status < 500 ? err.message : "Failed to reconcile milestone release." });
  }
};