const Dispute = require("../models/Dispute");
const Project = require("../models/Project");
const { recordActivitySafely } = require("../services/activityService");

exports.raiseDispute = async (req, res) => {
  try {
    const { projectId, reason } = req.body;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const isClient = String(project.clientId) === String(req.user.id);
    const isFreelancer = String(project.freelancerId) === String(req.user.id);

    if (!isClient && !isFreelancer && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only project participants can raise a dispute" });
    }

    const existingDispute = await Dispute.findOne({ projectId, status: "pending" });
    if (existingDispute) {
      return res.status(409).json({ message: "A dispute is already pending for this project." });
    }

    const dispute = await Dispute.create({
      projectId,
      raisedBy: req.user.id,
      reason: String(reason || "Dispute raised").trim(),
    });

    project.status = "disputed";
    project.escrowDisputed = true;
    await project.save();

    recordActivitySafely({
      userIds: [project.clientId, project.freelancerId],
      eventKey: `dispute-raised:${dispute._id}`,
      actorId: req.user.id,
      type: "dispute_opened",
      title: "Dispute raised",
      message: `A dispute was raised on “${project.title}”.`,
      projectId: project._id,
      disputeId: dispute._id,
    });

    res.status(201).json(dispute);
  } catch (err) {
    console.error("[DisputeController] error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.voteDispute = async (req, res) => {
  try {
    const { vote } = req.body;
    if (!["client", "freelancer"].includes(vote)) {
      return res.status(400).json({ message: "Vote must be either 'client' or 'freelancer'." });
    }

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) return res.status(404).json({ message: "Dispute not found" });

    if (dispute.status !== "pending") {
      return res.status(400).json({ message: "Cannot vote on an already resolved dispute." });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required to cast a vote." });
    }

    dispute.voters = dispute.voters || [];
    if (dispute.voters.some((v) => String(v) === String(userId))) {
      return res.status(409).json({ message: "You have already cast your vote on this dispute." });
    }

    dispute.voters.push(userId);
    if (vote === "client") dispute.clientVotes += 1;
    else if (vote === "freelancer") dispute.freelancerVotes += 1;

    await dispute.save();
    res.json(dispute);
  } catch (err) {
    console.error("[DisputeController] error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.resolveDispute = async (req, res) => {
  try {
    const { winner } = req.body;
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only administrators can resolve disputes" });
    }

    const dispute = await Dispute.findByIdAndUpdate(
      req.params.id,
      { status: "resolved", winner },
      { returnDocument: "after" }
    );
    if (dispute) {
      const resolvedStatus = winner === "client" ? "refunded" : "completed";
      const project = await Project.findByIdAndUpdate(
        dispute.projectId,
        { status: resolvedStatus, escrowDisputed: false, escrowCompleted: true },
        { returnDocument: "after" }
      );
      if (project) {
        recordActivitySafely({
          userIds: [project.clientId, project.freelancerId],
          eventKey: `dispute-resolved:${dispute._id}`,
          actorId: req.user.id,
          type: "dispute_resolved",
          title: "Dispute resolved",
          message: `A dispute was resolved on “${project.title}”.`,
          projectId: project._id,
          disputeId: dispute._id,
        });
      }
    }
    res.json(dispute);
  } catch (err) {
    console.error("[DisputeController] error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getDispute = async (req, res) => {
  try {
    const dispute = await Dispute.findOne({ projectId: req.params.projectId })
      .populate("raisedBy", "firstName lastName");
    res.json(dispute);
  } catch (err) {
    console.error("[DisputeController] error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * AI-Assisted Dispute Evaluation
 * Analyzes contract scope, milestone status, and recent project chat to suggest a binary winner.
 */
exports.evaluateDisputeWithAI = async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) return res.status(404).json({ message: "Dispute not found" });

    if (dispute.status !== "pending") {
      return res.status(400).json({ message: "Can only evaluate pending disputes." });
    }

    const project = await Project.findById(dispute.projectId);
    if (!project) return res.status(404).json({ message: "Associated project not found" });

    const isClient = String(project.clientId) === String(req.user.id);
    const isFreelancer = String(project.freelancerId) === String(req.user.id);
    const isAdmin = req.user.role === "admin";

    if (!isClient && !isFreelancer && !isAdmin) {
      return res.status(403).json({ message: "Only dispute participants or admins can request AI evaluation." });
    }

    // Fetch latest chat messages for evidence
    const Message = require("../models/Message");
    const { evaluateDisputeEvidence } = require("../services/ai/aiService");

    const messages = await Message.find({ projectId: project._id })
      .sort({ createdAt: -1 })
      .limit(15)
      .populate("sender", "firstName lastName role");

    const chatExcerpts = messages.reverse().map((m) => ({
      sender: m.sender ? `${m.sender.firstName} (${m.sender.role})` : "User",
      content: m.content || "",
    }));

    const evidence = {
      projectTitle: project.title,
      projectDescription: project.description,
      disputeReason: dispute.reason,
      milestones: (project.milestones || []).map((m) => ({
        title: m.title,
        amount: m.amount,
        status: m.status,
      })),
      chatExcerpts,
    };

    const recommendation = await evaluateDisputeEvidence(evidence);

    dispute.aiRecommendation = {
      winner: recommendation.winner,
      rationale: recommendation.rationale,
      evaluatedAt: new Date(),
      clientAccepted: false,
      freelancerAccepted: false,
      expiresAt: new Date(Date.now() + 48 * 3600 * 1000), // 48-hour mutual window
    };

    await dispute.save();

    recordActivitySafely({
      userIds: [project.clientId, project.freelancerId],
      eventKey: `dispute-ai-evaluated:${dispute._id}`,
      actorId: req.user.id,
      type: "dispute_ai_evaluated",
      title: "AI Dispute Recommendation Ready",
      message: `Impartial AI assessment recommends favoring the ${recommendation.winner}.`,
      projectId: project._id,
      disputeId: dispute._id,
    });

    res.json(dispute);
  } catch (err) {
    console.error("[DisputeController] AI evaluation error:", err);
    res.status(500).json({ message: "Failed to evaluate dispute with AI." });
  }
};

/**
 * Dual-Acceptance for AI Dispute Recommendation
 * If both client and freelancer accept within 48h, triggers arbitrator on-chain settlement.
 */
exports.acceptAiRecommendation = async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) return res.status(404).json({ message: "Dispute not found" });

    if (dispute.status !== "pending") {
      return res.status(400).json({ message: "Dispute is already resolved." });
    }

    if (!dispute.aiRecommendation || !["client", "freelancer"].includes(dispute.aiRecommendation.winner)) {
      return res.status(400).json({ message: "No active AI recommendation found for this dispute." });
    }

    if (dispute.aiRecommendation.expiresAt && new Date() > new Date(dispute.aiRecommendation.expiresAt)) {
      return res.status(400).json({ message: "The 48-hour mutual acceptance window for this recommendation has expired." });
    }

    const project = await Project.findById(dispute.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const isClient = String(project.clientId) === String(req.user.id);
    const isFreelancer = String(project.freelancerId) === String(req.user.id);

    if (!isClient && !isFreelancer) {
      return res.status(403).json({ message: "Only project participants can accept the AI settlement." });
    }

    if (isClient) {
      dispute.aiRecommendation.clientAccepted = true;
      dispute.aiRecommendation.clientAcceptedAt = new Date();
    }
    if (isFreelancer) {
      dispute.aiRecommendation.freelancerAccepted = true;
      dispute.aiRecommendation.freelancerAcceptedAt = new Date();
    }

    // Check if BOTH have accepted -> Trigger automated resolution!
    let settled = false;
    if (dispute.aiRecommendation.clientAccepted && dispute.aiRecommendation.freelancerAccepted) {
      const winner = dispute.aiRecommendation.winner;
      dispute.status = "resolved";
      dispute.winner = winner;

      // Arbitrator On-Chain Relay
      const privateKey = process.env.ARBITRATOR_PRIVATE_KEY || process.env.SEPOLIA_PRIVATE_KEY;
      const disputeAddress = process.env.DISPUTE_CONTRACT_ADDRESS || process.env.DISPUTE_ADDRESS;
      const rpcUrl = process.env.SEPOLIA_RPC_URL;

      if (privateKey && disputeAddress && rpcUrl) {
        try {
          const { createWalletClient, http } = require("viem");
          const { privateKeyToAccount } = require("viem/accounts");
          const { sepolia } = require("viem/chains");
          const formattedKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
          const account = privateKeyToAccount(formattedKey);
          const client = createWalletClient({ account, chain: sepolia, transport: http(rpcUrl) });
          const winnerEnum = winner === "client" ? 1 : 2;
          const DISPUTE_ABI = [
            {
              type: "function",
              name: "resolveByArbitrator",
              stateMutability: "nonpayable",
              inputs: [{ type: "string", name: "projectId" }, { type: "uint8", name: "winner" }],
              outputs: [],
            },
          ];
          const txHash = await client.writeContract({
            address: disputeAddress,
            abi: DISPUTE_ABI,
            functionName: "resolveByArbitrator",
            args: [String(project._id), winnerEnum],
          });
          dispute.blockchainTxn = txHash;
        } catch (relayErr) {
          console.warn("[ArbitratorRelay] On-chain relay warning:", relayErr.message);
        }
      }

      const resolvedStatus = winner === "client" ? "refunded" : "completed";
      project.status = resolvedStatus;
      project.escrowDisputed = false;
      project.escrowCompleted = true;
      await project.save();

      recordActivitySafely({
        userIds: [project.clientId, project.freelancerId],
        eventKey: `dispute-mutual-ai-settled:${dispute._id}`,
        actorId: req.user.id,
        type: "dispute_resolved",
        title: "Mutual AI Settlement Finalized",
        message: `Both parties agreed to the AI recommendation. Funds released to ${winner}.`,
        projectId: project._id,
        disputeId: dispute._id,
      });

      settled = true;
    }

    await dispute.save();
    res.json({ dispute, settled });
  } catch (err) {
    console.error("[DisputeController] accept AI error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

