const mongoose = require("mongoose");
const Project = require("../models/Project");
const User = require("../models/User");
const { recordActivitySafely } = require("../services/activityService");
const { reconcileEscrowFunding, reconcileMilestoneRelease } = require("../services/reconciliationService");
const { verifyPullRequestCI } = require("../services/githubService");

/**
 * POST /api/projects/:id/milestones/:milestoneId/approve-and-release
 *
 * Unified milestone approval + payment release endpoint.
 *
 * Accepts:
 *   { releaseTxHash }              — escrow was already funded; just reconcile release
 *   { fundTxHash, releaseTxHash }  — escrow was just funded AND released in one go
 *
 * Both cases:
 *   1. Validate client ownership
 *   2. Optionally run GitHub PR CI verification
 *   3. Reconcile funding state in DB (if fundTxHash provided)
 *   4. Reconcile release state in DB
 *   5. Emit real-time socket notification to freelancer
 */
exports.approveAndReleaseMilestone = async (req, res) => {
  try {
    const { id: projectId, milestoneId } = req.params;
    const { releaseTxHash, fundTxHash } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (String(project.clientId) !== String(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only the project client can approve deliverables and release funds." });
    }

    // Identify milestone by Mongoose ObjectId or numeric index
    let milestone = project.milestones.id(milestoneId);
    let milestoneIndex = -1;

    if (milestone) {
      milestoneIndex = project.milestones.findIndex((m) => String(m._id) === String(milestone._id));
    } else {
      const parsedIdx = Number.parseInt(milestoneId, 10);
      if (!Number.isNaN(parsedIdx) && project.milestones[parsedIdx]) {
        milestone = project.milestones[parsedIdx];
        milestoneIndex = parsedIdx;
      }
    }

    if (!milestone) return res.status(404).json({ message: "Milestone not found" });

    const freelancerId = project.freelancerId?._id
      ? String(project.freelancerId._id)
      : String(project.freelancerId || "");

    // --- GitHub PR CI Verification (non-blocking) ---
    const deliverable = (project.deliverables || []).find(
      (d) => String(d.milestoneId) === String(milestone._id)
    );
    if (deliverable && deliverable.githubPrUrl) {
      try {
        const freelancer = await User.findById(project.freelancerId);
        const ci = await verifyPullRequestCI(deliverable.githubPrUrl, freelancer?.githubUsername || "");
        deliverable.githubCiStatus = ci.status;
        deliverable.githubCiDetails = {
          totalChecks: ci.totalChecks || 0,
          passedChecks: ci.passedChecks || 0,
          verifiedAuthor: ci.verifiedAuthor || "",
          checkedAt: new Date(),
        };
        await project.save();
        if (ci.status === "failed") {
          return res.status(400).json({
            message: "Automated CI verification failed. Please request revisions from the freelancer.",
            ci,
          });
        }
      } catch (ciErr) {
        console.warn("[MilestoneController] CI check skipped:", ciErr.message);
      }
    }

    // --- Require an on-chain release transaction hash ---
    if (!releaseTxHash) {
      return res.status(400).json({
        message: "releaseTxHash is required. The client must sign the on-chain releaseMilestone transaction.",
      });
    }

    // --- Step 1: Reconcile funding if escrow was just funded ---
    if (fundTxHash) {
      try {
        await reconcileEscrowFunding(String(project._id), fundTxHash, req.user.id);
      } catch (fundErr) {
        console.warn("[MilestoneController] Funding reconciliation warning:", fundErr.message);
        // Even if reconciliation has a minor issue, proceed — the on-chain state is truth
      }
    }

    // --- Step 2: Reconcile milestone release ---
    const updatedProject = await reconcileMilestoneRelease(
      String(project._id),
      milestoneIndex,
      releaseTxHash,
      req.user.id
    );

    // --- Step 3: Real-time notification to freelancer ---
    try {
      const io = req.app.get("io");
      if (io && freelancerId) {
        io.to(`user:${freelancerId}`).emit("notification", {
          type: "PAYMENT_RELEASED",
          title: "Payment Released! 🎉",
          message: `$${milestone.amount} USDC has been sent directly to your wallet for "${milestone.title}".`,
          txHash: releaseTxHash,
          projectId: project._id,
        });
      }
    } catch (socketErr) {
      console.warn("[MilestoneController] Socket notification skipped:", socketErr.message);
    }

    // --- Step 4: Activity log notifications ---
    recordActivitySafely({
      userIds: [req.user.id],
      eventKey: `milestone-released-client:${project._id}:${milestone._id}`,
      actorId: req.user.id,
      type: "payment_released",
      title: "Payment Released",
      message: `You approved and released payment for "${milestone.title}".`,
      projectId: project._id,
    });
    if (freelancerId) {
      recordActivitySafely({
        userIds: [freelancerId],
        eventKey: `milestone-released-freelancer:${project._id}:${milestone._id}`,
        actorId: req.user.id,
        type: "payment_released",
        title: "Payment Received!",
        message: `$${milestone.amount} USDC was sent to your wallet for "${milestone.title}".`,
        projectId: project._id,
      });
    }

    return res.json({
      success: true,
      message: "Milestone approved. Payment released to freelancer wallet on-chain.",
      project: updatedProject,
      releaseTxHash,
      ...(fundTxHash ? { fundTxHash } : {}),
    });
  } catch (err) {
    console.error("[MilestoneController] approveAndReleaseMilestone error:", err);
    res.status(err.status || 500).json({ message: err.message || "Internal server error" });
  }
};
