const Project = require("../models/Project");

exports.depositEscrow = async (req, res) => {
  try {
    const { projectId, txnHash } = req.body;
    const project = await Project.findByIdAndUpdate(
      projectId,
      { escrowTxnHash: txnHash },
      { new: true }
    );
    res.json({ message: "Escrow recorded", project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.releaseEscrow = async (req, res) => {
  try {
    const { projectId } = req.body;
    const project = await Project.findByIdAndUpdate(
      projectId,
      { status: "completed" },
      { new: true }
    );
    res.json({ message: "Escrow released", project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};