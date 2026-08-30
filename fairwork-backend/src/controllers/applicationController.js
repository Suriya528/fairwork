const Application = require("../models/Application");
const Project = require("../models/Project");
const User = require("../models/User");
const { recordActivitySafely } = require("../services/activityService");

// Freelancer submits an application/proposal for an open project
exports.createApplication = async (req, res) => {
  try {
    if (req.user.role !== "freelancer") {
      return res.status(403).json({ message: "Only freelancers can submit project applications" });
    }

    const { projectId, proposalText, proposedAmount, estimatedDelivery } = req.body;
    if (!projectId || !proposalText || proposedAmount === undefined || !estimatedDelivery) {
      return res.status(400).json({ message: "Missing required application fields" });
    }

    const numericAmount = Number(proposedAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: "Proposed amount must be a positive number" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.status !== "open") {
      return res.status(400).json({ message: "Applications are closed for this project" });
    }

    if (project.deadlineAt && new Date() > new Date(project.deadlineAt)) {
      return res.status(400).json({ message: "This project has passed its submission deadline and is no longer accepting applications" });
    }

    if (String(project.clientId) === String(req.user.id)) {
      return res.status(400).json({ message: "You cannot apply to your own project" });
    }

    // Check existing application
    const existing = await Application.findOne({ projectId, freelancerId: req.user.id });
    if (existing) {
      return res.status(409).json({ message: "You have already submitted an application for this project" });
    }

    const application = await Application.create({
      projectId,
      freelancerId: req.user.id,
      proposalText: String(proposalText).trim(),
      proposedAmount: numericAmount,
      estimatedDelivery: String(estimatedDelivery).trim(),
      status: "pending",
    });

    const populated = await application.populate([
      { path: "projectId", select: "title budget status category clientId" },
      { path: "freelancerId", select: "firstName lastName avatarUrl walletAddress rating reviewCount" },
    ]);

    recordActivitySafely({
      userIds: [project.clientId, req.user.id],
      eventKey: `application-submitted:${application._id}`,
      actorId: req.user.id,
      type: "application_submitted",
      title: "New Application Received",
      message: `A freelancer applied to “${project.title}”.`,
      projectId: project._id,
    });

    res.status(201).json(populated);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "You have already submitted an application for this project" });
    }
    console.error("[ApplicationController] error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Freelancer views their own submitted applications
exports.getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ freelancerId: req.user.id })
      .populate({
        path: "projectId",
        select: "title budget status category clientId",
        populate: { path: "clientId", select: "firstName lastName" },
      })
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (err) {
    console.error("[ApplicationController] error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Client views applications for a project they own
exports.getProjectApplications = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (String(project.clientId) !== String(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only the project client can view project applications" });
    }

    const applications = await Application.find({ projectId })
      .populate("freelancerId", "firstName lastName avatarUrl walletAddress rating reviewCount")
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (err) {
    console.error("[ApplicationController] error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Client hires a freelancer by accepting their application (Canonical Hiring Operation)
exports.acceptApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.status !== "pending") {
      return res.status(400).json({ message: `Cannot accept application with status '${application.status}'` });
    }

    const project = await Project.findById(application.projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (String(project.clientId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Only the project client can accept an application" });
    }

    // Atomic single-hire invariant check: update project ONLY if freelancerId is currently null & status is open
    const updatedProject = await Project.findOneAndUpdate(
      { _id: project._id, clientId: req.user.id, freelancerId: null, status: "open" },
      { freelancerId: application.freelancerId, status: "in_progress" },
      { returnDocument: "after" }
    );

    if (!updatedProject) {
      return res.status(409).json({ message: "Project has already been assigned to another freelancer" });
    }

    // Accept this target application
    application.status = "accepted";
    await application.save();

    // Reject all other pending applications for this project
    await Application.updateMany(
      { projectId: project._id, status: "pending", _id: { $ne: application._id } },
      { status: "rejected" }
    );

    recordActivitySafely({
      userIds: [project.clientId, application.freelancerId],
      eventKey: `application-accepted:${application._id}`,
      actorId: req.user.id,
      type: "application_accepted",
      title: "Freelancer Hired",
      message: `You accepted an application and hired a freelancer for “${updatedProject.title}”.`,
      projectId: updatedProject._id,
    });

    const populated = await application.populate([
      { path: "projectId", select: "title budget status category clientId freelancerId" },
      { path: "freelancerId", select: "firstName lastName avatarUrl walletAddress rating reviewCount" },
    ]);

    res.json({ application: populated, project: updatedProject });
  } catch (err) {
    console.error("[ApplicationController] error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Client rejects an application
exports.rejectApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const project = await Project.findById(application.projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (String(project.clientId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Only the project client can reject an application" });
    }

    if (application.status !== "pending") {
      return res.status(400).json({ message: `Cannot reject application with status '${application.status}'` });
    }

    application.status = "rejected";
    await application.save();

    res.json(application);
  } catch (err) {
    console.error("[ApplicationController] error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Freelancer withdraws their pending application
exports.withdrawApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (String(application.freelancerId) !== String(req.user.id)) {
      return res.status(403).json({ message: "You can only withdraw your own applications" });
    }

    if (application.status !== "pending") {
      return res.status(400).json({ message: `Cannot withdraw application with status '${application.status}'` });
    }

    application.status = "withdrawn";
    await application.save();

    res.json(application);
  } catch (err) {
    console.error("[ApplicationController] error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
