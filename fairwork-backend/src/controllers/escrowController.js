const Project = require("../models/Project");

exports.depositEscrow = async (req, res) => {
  try {
    const { projectId, txnHash } = req.body;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (String(project.clientId) !== String(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only the project client can deposit escrow" });
    }

    project.escrowTxnHash = txnHash || project.escrowTxnHash;
    project.escrowFunded = true;
    await project.save();
    res.json({ message: "Escrow recorded", project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.releaseEscrow = async (req, res) => {
  try {
    const { projectId, milestoneIndex } = req.body;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (String(project.clientId) !== String(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only the project client can release milestone escrow" });
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
    res.json({ message: "Escrow released", project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};