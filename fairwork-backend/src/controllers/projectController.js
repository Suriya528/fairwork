const Project = require("../models/Project");

exports.createProject = async (req, res) => {
  try {
    const { title, description, budget, milestones } = req.body;
    const project = await Project.create({
      title,
      description,
      budget,
      milestones,
      clientId: req.user.id,
    });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find({ status: "open" })
      .populate("clientId", "firstName lastName")
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("clientId", "firstName lastName walletAddress")
      .populate("freelancerId", "firstName lastName walletAddress");
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.assignFreelancer = async (req, res) => {
  try {
    const { freelancerId } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { freelancerId, status: "in_progress" },
      { new: true }
    );
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.completeProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { status: "completed" },
      { new: true }
    );
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ clientId: req.user.id }, { freelancerId: req.user.id }],
    })
      .populate("clientId", "firstName lastName")
      .populate("freelancerId", "firstName lastName")
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};