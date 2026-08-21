const Project = require("../models/Project");
const { verifyTransactionReceipt, verifyOnChainEscrowFunded } = require("../services/blockchainVerification");

exports.depositEscrow = async (req, res) => {
  try {
    const { projectId, txnHash } = req.body;
    if (!projectId) return res.status(400).json({ message: "projectId is required" });
    if (!txnHash) return res.status(400).json({ message: "Transaction hash (txnHash) is required" });

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (String(project.clientId) !== String(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only the project client can deposit escrow" });
    }

    // Verify transaction receipt on-chain
    const receiptCheck = await verifyTransactionReceipt(txnHash);
    if (!receiptCheck.verified) {
      return res.status(400).json({ message: `Escrow deposit verification failed: ${receiptCheck.error}` });
    }

    // Verify on-chain escrow contract state if configured
    const contractCheck = await verifyOnChainEscrowFunded(projectId);
    if (!contractCheck.verified) {
      return res.status(400).json({ message: `Escrow contract verification failed: ${contractCheck.error}` });
    }

    project.escrowTxnHash = txnHash;
    project.escrowFunded = true;
    await project.save();
    res.json({ message: "Escrow recorded successfully", project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.releaseEscrow = async (req, res) => {
  try {
    const { projectId, milestoneIndex, txnHash } = req.body;
    if (!projectId) return res.status(400).json({ message: "projectId is required" });

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (String(project.clientId) !== String(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only the project client can release milestone escrow" });
    }

    if (!project.escrowFunded) {
      return res.status(400).json({ message: "Cannot release milestone payment: project escrow is not funded." });
    }

    // Verify transaction receipt on-chain if hash was provided
    if (txnHash) {
      const receiptCheck = await verifyTransactionReceipt(txnHash);
      if (!receiptCheck.verified) {
        return res.status(400).json({ message: `Milestone release verification failed: ${receiptCheck.error}` });
      }
    }

    if (milestoneIndex !== undefined && project.milestones && project.milestones[milestoneIndex]) {
      project.milestones[milestoneIndex].paymentReleased = true;
      project.milestones[milestoneIndex].status = "completed";
    }

    const allReleased = (project.milestones || []).length > 0 && project.milestones.every((m) => m.paymentReleased);
    if (allReleased) {
      project.escrowCompleted = true;
      project.status = "completed";
    }

    await project.save();
    res.json({ message: "Escrow payment released successfully", project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};