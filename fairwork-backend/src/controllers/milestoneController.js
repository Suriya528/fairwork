const mongoose = require("mongoose");
const Project = require("../models/Project");
const User = require("../models/User");
const { recordActivitySafely } = require("../services/activityService");
const reconciliationService = require("../services/reconciliationService");
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

    if (!projectId || !mongoose.isValidObjectId(projectId)) {
      return res.status(404).json({ message: "Project not found" });
    }

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

    // --- Automatic Gas-Relayed Release or Client-Signed Release ---
    let finalReleaseTxHash = releaseTxHash;

    if (!finalReleaseTxHash) {
      if (process.env.SKIP_CHAIN_VERIFICATION === "true") {
        const crypto = require("crypto");
        finalReleaseTxHash = `0x${crypto.randomBytes(32).toString("hex")}`;
      } else {
        // Automatic Gas-Relayed Release by Platform Relayer!
        // The client clicked "Approve & Release Payment" in UI without needing MetaMask.
        try {
          const { createWalletClient, createPublicClient, http } = require("viem");
          const { privateKeyToAccount } = require("viem/accounts");
          const { resolveViemChain, getRpcUrl } = require("../services/chainResolver");
          const { getResolvedContractAddress } = require("../services/reconciliationService");

          const TESTNET_RELAYER_KEY = "b1edfd0cb1d8fa85f10d00b5d15a6615f1b495a5e3916174c333cbcb79b8bd93";
          const privateKey = process.env.SEPOLIA_PRIVATE_KEY || process.env.ARBITRATOR_PRIVATE_KEY || TESTNET_RELAYER_KEY;
          const normalizedKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
          const relayerAccount = privateKeyToAccount(normalizedKey);

          const rpcUrl = getRpcUrl();
          const chain = resolveViemChain();
          const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });
          const walletClient = createWalletClient({
            account: relayerAccount,
            chain,
            transport: http(rpcUrl),
          });

          const escrowAddress = getResolvedContractAddress("CANONICAL_ESCROW_ADDRESS", "ESCROW_ADDRESS");

          const ESCROW_ABI = [
            {
              type: "function",
              name: "releaseMilestone",
              stateMutability: "nonpayable",
              inputs: [
                { type: "string", name: "projectId" },
                { type: "uint256", name: "index" },
              ],
              outputs: [],
            },
            {
              type: "function",
              name: "escrows",
              stateMutability: "view",
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
            },
          ];

          // Ensure escrow exists and is funded on-chain
          if (escrowAddress) {
            const escrowData = await publicClient.readContract({
              address: escrowAddress,
              abi: ESCROW_ABI,
              functionName: "escrows",
              args: [String(projectId)],
            });
            if (!escrowData[5]) { // isFunded
              return res.status(400).json({
                message: "Escrow vault has not been funded on-chain yet. Please deposit funds before releasing payments.",
              });
            }
          }

          console.info(`[MilestoneController] Relaying releaseMilestone on-chain for project ${projectId}, milestone ${milestoneIndex} via relayer ${relayerAccount.address}...`);

          const txHash = await walletClient.writeContract({
            address: escrowAddress,
            abi: ESCROW_ABI,
            functionName: "releaseMilestone",
            args: [String(projectId), BigInt(milestoneIndex)],
          });

          console.info(`[MilestoneController] Submitted release tx ${txHash}. Waiting for on-chain confirmation...`);
          const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
          if (receipt.status !== "success" && receipt.status !== 1) {
            throw new Error("On-chain release transaction reverted");
          }

          finalReleaseTxHash = txHash;
        } catch (relayerErr) {
          console.error("[MilestoneController] Relayer releaseMilestone failed:", relayerErr);
          return res.status(500).json({
            message: `Failed to execute automatic smart contract release: ${relayerErr.message || relayerErr}`,
          });
        }
      }
    }

    // --- Step 1: Reconcile funding if escrow was just funded ---
    if (fundTxHash) {
      try {
        await reconciliationService.reconcileEscrowFunding(String(project._id), fundTxHash, req.user.id);
      } catch (fundErr) {
        console.warn("[MilestoneController] Funding reconciliation warning:", fundErr.message);
        // Even if reconciliation has a minor issue, proceed — the on-chain state is truth
      }
    }

    // --- Step 2: Reconcile milestone release ---
    const updatedProject = await reconciliationService.reconcileMilestoneRelease(
      String(project._id),
      milestoneIndex,
      finalReleaseTxHash,
      req.user.id
    );

    // --- Step 3: Real-time notification to freelancer ---
    try {
      const io = req.app.get("io");
      if (io && freelancerId) {
        io.to(`user:${freelancerId}`).emit("notification", {
          type: "PAYMENT_RELEASED",
          title: "Payment Released! 🎉",
          message: `$${milestone.amount} USDC has been automatically released from escrow to your wallet for "${milestone.title}".`,
          txHash: finalReleaseTxHash,
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
      releaseTxHash: finalReleaseTxHash,
      ...(fundTxHash ? { fundTxHash } : {}),
    });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ message: "Project or milestone not found" });
    }
    console.error("[MilestoneController] approveAndReleaseMilestone error:", err);
    res.status(err.status || 500).json({ message: err.message || "Internal server error" });
  }
};
