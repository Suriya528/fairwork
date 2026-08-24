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
    const {
      title,
      description,
      category,
      customCategory,
      budget,
      milestones,
      deadlineMode,
      durationValue,
      durationUnit,
      deadlineAt: inputDeadlineAt,
    } = req.body;

    let computedDeadlineAt = null;
    let computedDurationDays = null;
    const mode = deadlineMode === "exact" ? "exact" : "duration";

    if (mode === "exact" && inputDeadlineAt) {
      const parsed = new Date(inputDeadlineAt);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ message: "Invalid exact deadline timestamp." });
      }
      if (parsed.getTime() <= Date.now()) {
        return res.status(400).json({ message: "Deadline must be strictly in the future." });
      }
      computedDeadlineAt = parsed;
      computedDurationDays = Math.max(0.1, Number(((parsed.getTime() - Date.now()) / (86400 * 1000)).toFixed(2)));
    } else {
      const val = Number(durationValue) > 0 ? Number(durationValue) : 1;
      const unit = durationUnit || "days";
      let ms = val * 86400 * 1000;
      if (unit === "hours") ms = val * 3600 * 1000;
      else if (unit === "weeks") ms = val * 7 * 86400 * 1000;
      else if (unit === "months") ms = val * 30 * 86400 * 1000;

      computedDeadlineAt = new Date(Date.now() + ms);
      computedDurationDays = Math.max(0.1, Number((ms / (86400 * 1000)).toFixed(2)));
    }

    const numBudget = Number(budget);
    if (isNaN(numBudget) || numBudget <= 0) {
      return res.status(400).json({ message: "Project budget must be a positive number." });
    }

    if (!milestones || !Array.isArray(milestones) || milestones.length === 0) {
      return res.status(400).json({ message: "Project must have at least one milestone." });
    }

    const formattedMilestones = (milestones || []).map((m) => {
      let mDueDate = m.dueDate ? new Date(m.dueDate) : null;
      if (mDueDate && isNaN(mDueDate.getTime())) mDueDate = null;
      if (mDueDate && computedDeadlineAt && mDueDate > computedDeadlineAt) {
        mDueDate = computedDeadlineAt;
      }
      return {
        title: m.title,
        amount: Number(m.amount) || 0,
        dueDate: mDueDate || computedDeadlineAt,
      };
    });

    const milestoneSum = formattedMilestones.reduce((acc, m) => acc + (Number(m.amount) || 0), 0);
    if (Math.abs(milestoneSum - numBudget) > 0.01) {
      return res.status(400).json({
        message: `Milestone amounts total (${milestoneSum}) must equal total project budget (${numBudget}).`,
      });
    }

    const project = await Project.create({
      title,
      description,
      category: category || "Web Development",
      customCategory: category === "Other" ? (customCategory ? String(customCategory).trim() : "") : "",
      budget,
      milestones: formattedMilestones,
      clientId: req.user.id,
      deadlineAt: computedDeadlineAt,
      durationDays: computedDurationDays,
      deadlineMode: mode,
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

const { transitionStatus } = require("../services/projectStateMachine");

exports.assignFreelancer = async (req, res) => {
  try {
    const { freelancerId } = req.body;
    const freelancer = await User.findById(freelancerId);
    if (!freelancer || freelancer.role !== "freelancer") {
      return res.status(400).json({ message: "Invalid freelancer" });
    }

    // Atomic CAS transition: open -> in_progress with freelancerId guard
    const project = await Project.findOneAndUpdate(
      {
        _id: req.params.id,
        clientId: req.user.id,
        status: "open",
        freelancerId: { $in: [null, undefined] },
      },
      {
        $set: {
          freelancerId: freelancer._id,
          freelancerWalletAddress: freelancer.walletAddress || undefined,
          status: "in_progress",
        },
      },
      { new: true }
    );

    if (!project) {
      const existing = await Project.findById(req.params.id);
      if (!existing) return res.status(404).json({ message: "Project not found" });
      if (String(existing.clientId) !== String(req.user.id)) {
        return res.status(403).json({ message: "Only the project client can assign a freelancer" });
      }
      if (existing.freelancerId) {
        return res.status(409).json({ message: "A freelancer is already assigned" });
      }
      return res.status(409).json({ message: "Project status conflict" });
    }

    recordActivitySafely({
      userIds: [project.clientId, freelancer._id],
      eventKey: `freelancer-assigned:${project._id}`,
      actorId: req.user.id,
      type: "freelancer_assigned",
      title: "Freelancer assigned",
      message: `A freelancer was assigned to “${project.title}”.`,
      projectId: project._id,
    });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.completeProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Ownership check: only client owner can mark project complete
    if (String(project.clientId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Only the project client owner can complete the project" });
    }

    // Settlement state eligibility check: all milestones must be settled
    const allSettled = project.milestones.length > 0 && project.milestones.every(
      (m) => m.paymentReleased === true && m.settlementEventId != null
    );

    if (!allSettled) {
      return res.status(409).json({
        message: "Cannot complete project: all milestones must have confirmed released settlement events.",
        code: "UNSETTLED_MILESTONES_REMAIN",
      });
    }

    // Atomic CAS transition: in_progress -> completed
    const updated = await transitionStatus(project._id, "in_progress", "completed", { clientId: req.user.id });
    res.json(updated);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
};

exports.getMyProjects = async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const userIdObj = mongoose.Types.ObjectId.isValid(req.user.id)
      ? new mongoose.Types.ObjectId(req.user.id)
      : req.user.id;

    const projects = await Project.find({
      $or: [
        { clientId: req.user.id },
        { clientId: userIdObj },
        { freelancerId: req.user.id },
        { freelancerId: userIdObj },
      ],
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
    const submissionNotes = req.body.submissionNotes || "";

    if (milestoneId) {
      const targetMilestone = project.milestones.id(milestoneId);
      if (!targetMilestone) {
        return res.status(400).json({ message: "Milestone does not belong to this project" });
      }
      targetMilestone.status = "submitted";
      targetMilestone.submittedAt = new Date();
      if (submissionNotes) {
        targetMilestone.submissionNotes = submissionNotes;
      }
    }

    const result = await uploadToCloudinary(req.file);
    project.deliverables.push({
      filename: req.file.originalname,
      url: result.secure_url,
      publicId: result.public_id,
      mimeType: req.file.mimetype,
      size: result.bytes || req.file.size,
      milestoneId,
      submissionNotes,
      uploadedBy: req.user.id,
    });

    await project.save();
    await project.populate("deliverables.uploadedBy", "firstName lastName");

    recordActivitySafely({
      userIds: [project.clientId, req.user.id],
      eventKey: `deliverable-uploaded:${project._id}:${req.file.originalname}`,
      actorId: req.user.id,
      type: "deliverable_uploaded",
      title: "Deliverable uploaded",
      message: `Work deliverable “${req.file.originalname}” was submitted for “${project.title}”.`,
      projectId: project._id,
    });

    res.status(201).json(project.deliverables[project.deliverables.length - 1]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.submitMilestone = async (req, res) => {
  try {
    const { project, error } = await projectForParty(req.params.id, req.user.id);
    if (error) return res.status(error.status).json({ message: error.message });

    if (!project.freelancerId || String(project.freelancerId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Only the assigned freelancer can submit milestones." });
    }

    const milestone = project.milestones.id(req.params.milestoneId);
    if (!milestone) return res.status(404).json({ message: "Milestone not found" });

    milestone.status = "submitted";
    milestone.submittedAt = new Date();
    if (req.body.submissionNotes) milestone.submissionNotes = req.body.submissionNotes;

    await project.save();

    recordActivitySafely({
      userIds: [project.clientId, req.user.id],
      eventKey: `milestone-submitted:${project._id}:${milestone._id}`,
      actorId: req.user.id,
      type: "milestone_submitted",
      title: "Milestone submitted",
      message: `Milestone “${milestone.title}” was submitted for review.`,
      projectId: project._id,
    });

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.requestMilestoneRevision = async (req, res) => {
  try {
    const { project, error } = await projectForParty(req.params.id, req.user.id);
    if (error) return res.status(error.status).json({ message: error.message });

    if (String(project.clientId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Only the project client can request revisions." });
    }

    const milestone = project.milestones.id(req.params.milestoneId);
    if (!milestone) return res.status(404).json({ message: "Milestone not found" });

    milestone.status = "revision_requested";
    milestone.revisionRequestedAt = new Date();
    milestone.revisionNotes = req.body.revisionNotes || "Revision requested by client.";

    await project.save();

    recordActivitySafely({
      userIds: [project.freelancerId, req.user.id],
      eventKey: `milestone-revision:${project._id}:${milestone._id}`,
      actorId: req.user.id,
      type: "milestone_revision_requested",
      title: "Revision requested",
      message: `Client requested a revision for milestone “${milestone.title}”.`,
      projectId: project._id,
    });

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.approveMilestone = async (req, res) => {
  try {
    const { project, error } = await projectForParty(req.params.id, req.user.id);
    if (error) return res.status(error.status).json({ message: error.message });

    if (String(project.clientId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Only the project client can approve milestones." });
    }

    const milestone = project.milestones.id(req.params.milestoneId);
    if (!milestone) return res.status(404).json({ message: "Milestone not found" });

    milestone.status = "completed";
    await project.save();

    recordActivitySafely({
      userIds: [project.freelancerId, req.user.id],
      eventKey: `milestone-approved:${project._id}:${milestone._id}`,
      actorId: req.user.id,
      type: "milestone_approved",
      title: "Milestone approved",
      message: `Client approved milestone “${milestone.title}”.`,
      projectId: project._id,
    });

    res.json(project);
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
