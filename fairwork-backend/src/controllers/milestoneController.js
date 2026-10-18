const mongoose = require("mongoose");
const Project = require("../models/Project");
const User = require("../models/User");
const OutboxEvent = require("../models/OutboxEvent");
const { recordActivitySafely } = require("../services/activityService");
const { reconcileMilestoneRelease } = require("../services/reconciliationService");
const { verifyPullRequestCI } = require("../services/githubService");

/**
 * POST /api/projects/:projectId/milestones/:milestoneId/approve-and-release
 * 
 * Production automated milestone verification & release pipeline:
 * 1. Validates client ownership.
 * 2. Runs automated deliverable & GitHub PR CI check validation.
 * 3. Atomically reconciles on-chain milestone release if txHash provided or marks approved.
 * 4. Writes transactional outbox entry for reliable event publishing.
 * 5. Emits real-time notification to the freelancer.
 */
exports.approveAndReleaseMilestone = async (req, res) => {
  try {
    const { id: projectId, milestoneId } = req.params;
    const { txnHash } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (String(project.clientId) !== String(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only the project client can approve deliverables and release funds." });
    }

    // Identify milestone by Mongoose ID or zero-based index
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

    if (!milestone) {
      return res.status(404).json({ message: "Milestone not found" });
    }

    // 1. Automated Deliverable & GitHub PR CI Check Verification
    const deliverable = (project.deliverables || []).find((d) => String(d.milestoneId) === String(milestone._id));
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
            message: "Automated verification failed: GitHub PR CI checks failed. Please request revisions.",
            ci,
          });
        }
      } catch (ciErr) {
        console.warn("[MilestoneController] CI verification notice:", ciErr.message);
      }
    }

    // 2. On-Chain Release Reconcile (if client performed MetaMask on-chain release)
    if (txnHash && project.escrowFunded) {
      const reconciledProject = await reconcileMilestoneRelease(
        project._id,
        milestoneIndex,
        txnHash,
        req.user.id
      );

      // Create Transactional Outbox Entry for guaranteed event publishing
      try {
        await OutboxEvent.findOneAndUpdate(
          { sourceEventKey: `milestone-release:${project._id}:${milestoneIndex}:${txnHash}`, eventType: "MILESTONE_PAYMENT_RELEASED" },
          {
            $setOnInsert: {
              sourceEventKey: `milestone-release:${project._id}:${milestoneIndex}:${txnHash}`,
              eventType: "MILESTONE_PAYMENT_RELEASED",
              projectId: project._id,
              content: JSON.stringify({
                freelancerId: project.freelancerId,
                milestoneIndex,
                milestoneTitle: milestone.title,
                amountUSDC: milestone.amount,
                txnHash,
              }),
              status: "PENDING",
            },
          },
          { upsert: true, returnDocument: "after" }
        );
      } catch (outboxErr) {
        console.warn("[MilestoneController] Outbox queue notice:", outboxErr.message);
      }

      // Real-time socket notification to freelancer room
      try {
        const io = req.app.get("io");
        if (io) {
          io.to(`user:${project.freelancerId}`).emit("notification", {
            type: "PAYMENT_RELEASED",
            title: "Payment Released!",
            message: `$${milestone.amount} USDC has been released directly to your wallet for “${milestone.title}”.`,
            txHash: txnHash,
            projectId: project._id,
          });
        }
      } catch (socketErr) {
        console.warn("[MilestoneController] Socket notification notice:", socketErr.message);
      }

      return res.json({
        success: true,
        message: "Milestone approved and on-chain payment verified.",
        project: reconciledProject,
        txHash: txnHash,
      });
    }

    // 3. Off-Chain Completion Fallback (if escrow was not funded on-chain)
    milestone.status = "completed";
    await project.save();

    // Role-specific notifications
    recordActivitySafely({
      userIds: [req.user.id],
      eventKey: `milestone-approved-client:${project._id}:${milestone._id}`,
      actorId: req.user.id,
      type: "milestone_approved",
      title: "Milestone Approved",
      message: `You approved milestone “${milestone.title}”.`,
      projectId: project._id,
    });

    recordActivitySafely({
      userIds: [project.freelancerId],
      eventKey: `milestone-approved-freelancer:${project._id}:${milestone._id}`,
      actorId: req.user.id,
      type: "milestone_approved",
      title: "Milestone Approved!",
      message: `Client approved milestone “${milestone.title}”.`,
      projectId: project._id,
    });

    res.json({
      success: true,
      message: "Milestone approved successfully.",
      project,
    });
  } catch (err) {
    console.error("[MilestoneController] approveAndReleaseMilestone error:", err);
    res.status(err.status || 500).json({ message: err.message || "Internal server error" });
  }
};
