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
    if (!projectId) return res.status(400).json({ message: "projectId is required" });
    if (!txnHash) return res.status(400).json({ message: "Transaction hash (txnHash) is required" });

    const project = await reconcileEscrowFunding(projectId, txnHash, req.user.id);
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
    if (!projectId) return res.status(400).json({ message: "projectId is required" });

    const project = await reconcileMilestoneRelease(projectId, milestoneIndex, txnHash, req.user.id);
    res.json({ message: "Escrow payment released successfully", project });
  } catch (err) {
    const status = err.status || (err.message && /^[A-Z_]+/.test(err.message) ? 400 : 500);
    console.error("[EscrowController] releaseEscrow error:", err);
    res.status(status).json({ message: status < 500 ? err.message : "Failed to reconcile milestone release." });
  }
};