const Dispute = require("../models/Dispute");
const Project = require("../models/Project");

exports.raiseDispute = async (req, res) => {
  try {
    const { projectId, reason } = req.body;
    const dispute = await Dispute.create({
      projectId,
      raisedBy: req.user.id,
      reason,
    });
    await Project.findByIdAndUpdate(projectId, { status: "disputed" });
    res.status(201).json(dispute);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.voteDispute = async (req, res) => {
  try {
    const { vote } = req.body;
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) return res.status(404).json({ message: "Dispute not found" });

    if (vote === "client") dispute.clientVotes += 1;
    else if (vote === "freelancer") dispute.freelancerVotes += 1;

    await dispute.save();
    res.json(dispute);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resolveDispute = async (req, res) => {
  try {
    const { winner } = req.body;
    const dispute = await Dispute.findByIdAndUpdate(
      req.params.id,
      { status: "resolved", winner },
      { new: true }
    );
    res.json(dispute);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDispute = async (req, res) => {
  try {
    const dispute = await Dispute.findOne({ projectId: req.params.projectId })
      .populate("raisedBy", "firstName lastName");
    res.json(dispute);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};