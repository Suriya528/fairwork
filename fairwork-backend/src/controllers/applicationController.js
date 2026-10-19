const mongoose = require("mongoose");
const Application = require("../models/Application");
const Project = require("../models/Project");
const User = require("../models/User");
const Contract = require("../models/Contract");
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

    if (!mongoose.isValidObjectId(projectId)) {
      return res.status(404).json({ message: "Project not found" });
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
      { path: "freelancerId", select: "firstName lastName avatarUrl walletAddress reputationScore totalReviews" },
    ]);

    const applicantName = req.user.firstName ? `${req.user.firstName} ${req.user.lastName || ""}`.trim() : "A freelancer";

    // Client notification: Freelancer applied to project
    recordActivitySafely({
      userIds: [project.clientId],
      eventKey: `application-submitted-client:${application._id}`,
      actorId: req.user.id,
      type: "application_submitted",
      title: "New Application Received",
      message: `${applicantName} submitted a proposal for “${project.title}”.`,
      projectId: project._id,
    });

    // Freelancer notification: You submitted proposal
    recordActivitySafely({
      userIds: [req.user.id],
      eventKey: `application-submitted-freelancer:${application._id}`,
      actorId: req.user.id,
      type: "application_submitted",
      title: "Proposal Submitted",
      message: `You submitted a proposal for “${project.title}”.`,
      projectId: project._id,
    });

    res.status(201).json(populated);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ message: "Project not found" });
    }
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
    if (!projectId || !mongoose.isValidObjectId(projectId)) {
      return res.status(404).json({ message: "Project not found" });
    }
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (String(project.clientId) !== String(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only the project client can view project applications" });
    }

    const applications = await Application.find({ projectId })
      .populate("freelancerId", "firstName lastName avatarUrl walletAddress reputationScore totalReviews rating reviewCount createdAt bio tagline skills githubUrl githubIdentity hourlyRate availability")
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ message: "Project not found" });
    }
    console.error("[ApplicationController] error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Client hires a freelancer by accepting their application (Canonical Hiring Operation)
exports.acceptApplication = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Application not found" });
    }
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

    // Fetch freelancer's wallet address to ensure on-chain escrow can be created
    const freelancerUser = await User.findById(application.freelancerId).select("walletAddress");

    // Atomic single-hire invariant check: update project ONLY if freelancerId is currently null & status is open
    const updatedProject = await Project.findOneAndUpdate(
      { _id: project._id, clientId: req.user.id, freelancerId: null, status: "open" },
      {
        freelancerId: application.freelancerId,
        freelancerWalletAddress: freelancerUser?.walletAddress || undefined,
        status: "in_progress",
      },
      { returnDocument: "after" }
    );

    if (!updatedProject) {
      return res.status(409).json({ message: "Project has already been assigned to another freelancer" });
    }

    // Auto-create contract agreement on hire if not already created
    try {
      let contract = await Contract.findOne({ projectId: project._id });
      if (!contract) {
        const defaultAgreement = `FREELANCE SERVICES AGREEMENT

1. PROJECT SCOPE
Project Title: ${updatedProject.title}
Description: ${updatedProject.description || "Project deliverables as agreed."}

2. PAYMENT TERMS
Total Project Budget: $${updatedProject.budget} USDC
Payment Model: Escrow-protected milestone payouts upon client review and approval.

3. MILESTONES & DELIVERABLES
${(updatedProject.milestones || []).map((m, idx) => `Milestone ${idx + 1}: ${m.title || "Deliverable"} - $${m.amount || 0}`).join("\n") || "Deliverables as defined in project scope."}

4. INTELLECTUAL PROPERTY & TERMINATION
All deliverables and intellectual property belong strictly to the Client upon milestone payment release.
Either party may initiate dispute resolution or contract termination through the FairWork Escrow Protocol.`;

        contract = await Contract.create({
          projectId: updatedProject._id,
          clientId: project.clientId,
          freelancerId: application.freelancerId,
          aiGeneratedText: defaultAgreement,
        });

        await Project.findByIdAndUpdate(updatedProject._id, { contractId: contract._id });
        updatedProject.contractId = contract._id;
      }
    } catch (contractErr) {
      console.warn("[ApplicationController] Auto-contract generation warning:", contractErr.message);
    }

    // Accept this target application
    application.status = "accepted";
    await application.save();

    // Reject all other pending applications for this project
    await Application.updateMany(
      { projectId: project._id, status: "pending", _id: { $ne: application._id } },
      { status: "rejected" }
    );

    // Client notification: You hired a freelancer
    recordActivitySafely({
      userIds: [project.clientId],
      eventKey: `application-accepted-client:${application._id}`,
      actorId: req.user.id,
      type: "application_accepted",
      title: "Freelancer Hired",
      message: `You accepted an application and hired a freelancer for “${updatedProject.title}”.`,
      projectId: updatedProject._id,
    });

    // Freelancer notification: You have been hired
    recordActivitySafely({
      userIds: [application.freelancerId],
      eventKey: `application-accepted-freelancer:${application._id}`,
      actorId: req.user.id,
      type: "application_accepted",
      title: "Application Accepted!",
      message: `Congratulations! Your proposal for “${updatedProject.title}” was accepted. You are hired!`,
      projectId: updatedProject._id,
    });

    const populated = await application.populate([
      { path: "projectId", select: "title budget status category clientId freelancerId contractId" },
      { path: "freelancerId", select: "firstName lastName avatarUrl walletAddress reputationScore totalReviews rating reviewCount createdAt bio tagline skills githubUrl githubIdentity" },
    ]);

    res.json({ application: populated, project: updatedProject });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ message: "Application not found" });
    }
    console.error("[ApplicationController] error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Client rejects an application
exports.rejectApplication = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Application not found" });
    }
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

    // Freelancer notification: Application was not selected
    recordActivitySafely({
      userIds: [application.freelancerId],
      eventKey: `application-rejected:${application._id}`,
      actorId: req.user.id,
      type: "application_rejected",
      title: "Proposal Status Update",
      message: `Your application for “${project.title}” was not selected.`,
      projectId: project._id,
    });

    res.json(application);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ message: "Application not found" });
    }
    console.error("[ApplicationController] error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Freelancer withdraws their pending application
exports.withdrawApplication = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Application not found" });
    }
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
    if (err.name === "CastError") {
      return res.status(404).json({ message: "Application not found" });
    }
    console.error("[ApplicationController] error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
