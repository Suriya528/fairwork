const Project = require("../models/Project");
const User = require("../models/User");
const { recordActivitySafely } = require("../services/activityService");
const { uploadToCloudinary } = require("../services/cloudinaryUpload");
const { canAccessProject } = require("../services/projectAccess");

async function projectForParty(projectId, userId) {
  const project = await Project.findById(projectId);
  if (!project) return { error: { status: 404, message: "Project not found" } };
  if (!await canAccessProject(project, userId)) return { error: { status: 403, message: "You do not have access to this project's files" } };
  return { project };
}

exports.createProject = async (req, res) => {
  try {
    const { title, description, category, customCategory, budget, milestones } = req.body;
    const project = await Project.create({
      title,
      description,
      category: category || "Web Development",
      customCategory: category === "Other" ? (customCategory ? String(customCategory).trim() : "") : "",
      budget,
      milestones,
      clientId: req.user.id,
    });
    recordActivitySafely({ userIds: [req.user.id], eventKey: `project-created:${project._id}`, actorId: req.user.id, type: "project_created", title: "Project created", message: `You created “${project.title}”.`, projectId: project._id });
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
    const current = await Project.findById(req.params.id);
    if (!current) return res.status(404).json({ message: "Project not found" });
    if (String(current.clientId) !== String(req.user.id)) return res.status(403).json({ message: "Only the project client can assign a freelancer" });
    if (current.freelancerId) return res.status(409).json({ message: "A freelancer is already assigned" });
    const freelancer = await User.findById(freelancerId);
    if (!freelancer || freelancer.role !== "freelancer") return res.status(400).json({ message: "Invalid freelancer" });
    const project = await Project.findByIdAndUpdate(req.params.id, { freelancerId, status: "in_progress" }, { new: true });
    recordActivitySafely({ userIds: [current.clientId, freelancer._id], eventKey: `freelancer-assigned:${project._id}`, actorId: req.user.id, type: "freelancer_assigned", title: "Freelancer assigned", message: `A freelancer was assigned to “${project.title}”.`, projectId: project._id });
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

exports.getProjectDeliverables = async (req, res) => {
  try {
    const { project, error } = await projectForParty(req.params.id, req.user.id);
    if (error) return res.status(error.status).json({ message: error.message });

    await project.populate("deliverables.uploadedBy", "firstName lastName");
    res.json(project.deliverables);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.uploadProjectDeliverable = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const { project, error } = await projectForParty(req.params.id, req.user.id);
    if (error) return res.status(error.status).json({ message: error.message });

    // Strict Authorization: Only assigned freelancer can upload work deliverables
    if (!project.freelancerId || String(project.freelancerId) !== String(req.user.id)) {
      return res.status(403).json({
        message: "Only the assigned freelancer can upload work deliverables for this project."
      });
    }

    const milestoneId = req.body.milestoneId || null;
    if (milestoneId && !project.milestones.id(milestoneId)) {
      return res.status(400).json({ message: "Milestone does not belong to this project" });
    }

    const result = await uploadToCloudinary(req.file);
    project.deliverables.push({
      filename: req.file.originalname,
      url: result.secure_url,
      publicId: result.public_id,
      mimeType: req.file.mimetype,
      size: result.bytes || req.file.size,
      milestoneId,
      uploadedBy: req.user.id,
    });
    await project.save();
    await project.populate("deliverables.uploadedBy", "firstName lastName");
    res.status(201).json(project.deliverables[project.deliverables.length - 1]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProjectReferenceFiles = async (req, res) => {
  try {
    const { project, error } = await projectForParty(req.params.id, req.user.id);
    if (error) return res.status(error.status).json({ message: error.message });

    await project.populate("referenceFiles.uploadedBy", "firstName lastName");
    res.json(project.referenceFiles || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.uploadProjectReferenceFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const { project, error } = await projectForParty(req.params.id, req.user.id);
    if (error) return res.status(error.status).json({ message: error.message });

    // Strict Authorization: Only the project client owner can upload project reference files
    if (String(project.clientId) !== String(req.user.id)) {
      return res.status(403).json({
        message: "Only the project client can upload reference files and requirements."
      });
    }

    const result = await uploadToCloudinary(req.file);
    project.referenceFiles = project.referenceFiles || [];
    project.referenceFiles.push({
      filename: req.file.originalname,
      url: result.secure_url,
      publicId: result.public_id,
      mimeType: req.file.mimetype,
      size: result.bytes || req.file.size,
      uploadedBy: req.user.id,
    });
    await project.save();
    await project.populate("referenceFiles.uploadedBy", "firstName lastName");
    res.status(201).json(project.referenceFiles[project.referenceFiles.length - 1]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
