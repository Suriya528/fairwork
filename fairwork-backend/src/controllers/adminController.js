const mongoose = require("mongoose");
const User = require("../models/User");
const Project = require("../models/Project");
const Application = require("../models/Application");
const Contract = require("../models/Contract");
const Dispute = require("../models/Dispute");
const Report = require("../models/Report");
const AuditLog = require("../models/AuditLog");
const SyncState = require("../models/BlockchainSyncState");
const { recordActivitySafely } = require("../services/activityService");

function pagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

function paginated(items, total, { page, limit }) {
  return { items, page, limit, total, pageCount: Math.ceil(total / limit) || 1 };
}

async function logAudit(req, { action, targetType, targetId, reason = "", details = {} }) {
  try {
    const adminUser = await User.findById(req.user.id).select("firstName lastName").lean();
    const adminName = adminUser ? `${adminUser.firstName} ${adminUser.lastName}` : "Admin";
    await AuditLog.create({
      admin: req.user.id,
      adminName,
      action,
      targetType,
      targetId: String(targetId),
      reason,
      details,
    });
  } catch (err) {
    console.error("Failed to log audit event:", err);
  }
}

// --- OVERVIEW -------------------------------------------------------------
exports.overview = async (_req, res) => {
  try {
    const [
      totalUsers,
      totalClients,
      totalFreelancers,
      totalAdmins,
      activeUsers,
      suspendedUsers,
      totalProjects,
      openProjects,
      activeProjects,
      completedProjects,
      cancelledProjects,
      totalApplications,
      pendingApplications,
      acceptedApplications,
      rejectedApplications,
      totalContracts,
      fundedEscrows,
      completedEscrows,
      disputedEscrows,
      openDisputes,
      resolvedDisputes,
      totalReports,
      openReports,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "client" }),
      User.countDocuments({ role: "freelancer" }),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ isSuspended: false }),
      User.countDocuments({ isSuspended: true }),
      Project.countDocuments(),
      Project.countDocuments({ status: "open" }),
      Project.countDocuments({ status: "in_progress" }),
      Project.countDocuments({ status: "completed" }),
      Project.countDocuments({ status: "cancelled" }),
      Application.countDocuments(),
      Application.countDocuments({ status: "pending" }),
      Application.countDocuments({ status: "accepted" }),
      Application.countDocuments({ status: "rejected" }),
      Contract.countDocuments(),
      Project.countDocuments({ escrowFunded: true, escrowCompleted: false, escrowDisputed: false }),
      Project.countDocuments({ escrowCompleted: true }),
      Project.countDocuments({ escrowDisputed: true }),
      Dispute.countDocuments({ status: "pending" }),
      Dispute.countDocuments({ status: "resolved" }),
      Report.countDocuments(),
      Report.countDocuments({ status: "open" }),
    ]);

    const conversionRate = totalApplications > 0 ? Math.round((acceptedApplications / totalApplications) * 100) : 0;

    res.json({
      totalUsers,
      totalClients,
      totalFreelancers,
      totalAdmins,
      activeUsers,
      suspendedUsers,
      totalProjects,
      openProjects,
      activeProjects,
      completedProjects,
      cancelledProjects,
      totalApplications,
      pendingApplications,
      acceptedApplications,
      rejectedApplications,
      applicationConversionRate: conversionRate,
      totalContracts,
      fundedEscrows,
      completedEscrows,
      disputedEscrows,
      openDisputes,
      resolvedDisputes,
      totalReports,
      openReports,
      platformEscrowVolume: null,
      platformEscrowVolumeUnit: null,
    });
  } catch (err) {
    res.status(500).json({ message: "Unable to load admin overview" });
  }
};

// --- USERS MANAGEMENT -----------------------------------------------------
exports.users = async (req, res) => {
  try {
    const page = pagination(req.query);
    const filter = {};

    if (req.query.role && ["client", "freelancer", "admin"].includes(req.query.role)) {
      filter.role = req.query.role;
    }

    if (req.query.status === "suspended") filter.isSuspended = true;
    else if (req.query.status === "active") filter.isSuspended = false;

    if (req.query.wallet === "verified") filter.walletAddress = { $exists: true, $ne: null, $ne: "" };
    else if (req.query.wallet === "unverified") {
      filter.$or = [{ walletAddress: { $exists: false } }, { walletAddress: null }, { walletAddress: "" }];
    }

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

    if (req.query.query && typeof req.query.query === "string" && req.query.query.trim()) {
      const q = req.query.query.trim();
      const escaped = escapeRegex(q);
      const regex = new RegExp(escaped, "i");
      filter.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { walletAddress: regex },
      ];
      if (mongoose.Types.ObjectId.isValid(q)) {
        filter.$or.push({ _id: q });
      }
    }

    const [items, total] = await Promise.all([
      User.find(filter, "firstName lastName email role walletAddress reputationScore totalReviews isSuspended suspendedAt suspendedReason createdAt")
        .sort({ createdAt: -1 })
        .skip(page.skip)
        .limit(page.limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    const userIds = items.map((u) => u._id);
    const [projectCounts, applicationCounts] = await Promise.all([
      Project.aggregate([
        { $match: { $or: [{ clientId: { $in: userIds } }, { freelancerId: { $in: userIds } }] } },
        { $group: { _id: "$clientId", clientProjects: { $sum: 1 } } },
      ]),
      Application.aggregate([
        { $match: { freelancerId: { $in: userIds } } },
        { $group: { _id: "$freelancerId", totalApps: { $sum: 1 } } },
      ]),
    ]);

    const projectMap = new Map(projectCounts.map((p) => [String(p._id), p.clientProjects]));
    const appMap = new Map(applicationCounts.map((a) => [String(a._id), a.totalApps]));

    const formatted = items.map((user) => ({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      walletAddress: user.walletAddress || "",
      reputationScore: user.reputationScore || 0,
      totalReviews: user.totalReviews || 0,
      isSuspended: Boolean(user.isSuspended),
      suspendedAt: user.suspendedAt || null,
      suspendedReason: user.suspendedReason || "",
      projectCount: projectMap.get(String(user._id)) || 0,
      applicationCount: appMap.get(String(user._id)) || 0,
      createdAt: user.createdAt,
    }));

    res.json(paginated(formatted, total, page));
  } catch (err) {
    res.status(500).json({ message: "Unable to load users" });
  }
};

exports.userDetail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password").lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const [projects, applications, contracts, disputes, reports, auditLogs] = await Promise.all([
      Project.find({ $or: [{ clientId: user._id }, { freelancerId: user._id }] }).sort({ createdAt: -1 }).lean(),
      Application.find({ freelancerId: user._id }).populate("projectId", "title budget status").sort({ createdAt: -1 }).lean(),
      Contract.find({ $or: [{ clientId: user._id }, { freelancerId: user._id }] }).populate("projectId", "title").sort({ createdAt: -1 }).lean(),
      Dispute.find({ raisedBy: user._id }).populate("projectId", "title").sort({ createdAt: -1 }).lean(),
      Report.find({ $or: [{ reporter: user._id }, { targetId: String(user._id) }] }).sort({ createdAt: -1 }).lean(),
      AuditLog.find({ targetId: String(user._id) }).sort({ createdAt: -1 }).lean(),
    ]);

    res.json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress || "",
        skills: user.skills || [],
        bio: user.bio || "",
        avatarUrl: user.avatarUrl || "",
        reputationScore: user.reputationScore || 0,
        totalReviews: user.totalReviews || 0,
        isSuspended: Boolean(user.isSuspended),
        suspendedAt: user.suspendedAt || null,
        suspendedReason: user.suspendedReason || "",
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      projects,
      applications,
      contracts,
      disputes,
      reports,
      auditLogs,
    });
  } catch (err) {
    res.status(500).json({ message: "Unable to load user details" });
  }
};

exports.suspendUser = async (req, res) => {
  try {
    const reasonText = (req.body && typeof req.body.reason === "string" && req.body.reason.trim())
      ? req.body.reason.trim()
      : "";

    if (!reasonText) {
      return res.status(400).json({ message: "Suspension reason is required." });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    if (targetUser.role === "admin") {
      return res.status(403).json({ message: "Administrators cannot be suspended." });
    }

    if (String(targetUser._id) === String(req.user.id)) {
      return res.status(400).json({ message: "You cannot suspend your own admin account." });
    }

    targetUser.isSuspended = true;
    targetUser.suspendedAt = new Date();
    targetUser.suspendedReason = reasonText;
    await targetUser.save();

    await logAudit(req, {
      action: "SUSPEND_USER",
      targetType: "User",
      targetId: targetUser._id,
      reason: reasonText,
      details: { email: targetUser.email, role: targetUser.role },
    });

    recordActivitySafely({
      userIds: [targetUser._id],
      eventKey: `user_suspended:${targetUser._id}:${Date.now()}`,
      actorId: req.user.id,
      type: "user_suspended",
      title: "Account Suspended",
      message: `Your account has been suspended by an administrator. Reason: ${reasonText}`,
    });

    res.json({
      message: `User ${targetUser.email} has been suspended.`,
      user: {
        id: targetUser._id,
        isSuspended: targetUser.isSuspended,
        suspendedAt: targetUser.suspendedAt,
        suspendedReason: targetUser.suspendedReason,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.unsuspendUser = async (req, res) => {
  try {
    const reasonText = (req.body && typeof req.body.reason === "string" && req.body.reason.trim())
      ? req.body.reason.trim()
      : "Admin unsuspended user account";

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    targetUser.isSuspended = false;
    targetUser.suspendedAt = undefined;
    targetUser.suspendedReason = "";
    await targetUser.save();

    await logAudit(req, {
      action: "UNSUSPEND_USER",
      targetType: "User",
      targetId: targetUser._id,
      reason: reasonText,
      details: { email: targetUser.email, role: targetUser.role },
    });

    recordActivitySafely({
      userIds: [targetUser._id],
      eventKey: `user_unsuspended:${targetUser._id}:${Date.now()}`,
      actorId: req.user.id,
      type: "user_unsuspended",
      title: "Account Restored",
      message: "Your FairWork account access has been fully restored by an administrator.",
    });

    res.json({
      message: `User ${targetUser.email} has been reinstated.`,
      user: {
        id: targetUser._id,
        isSuspended: targetUser.isSuspended,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- PROJECTS MANAGEMENT --------------------------------------------------
exports.projects = async (req, res) => {
  try {
    const page = pagination(req.query);
    const filter = {};

    if (req.query.status && ["open", "in_progress", "completed", "cancelled", "disputed"].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    if (req.query.escrowStatus === "funded") filter.escrowFunded = true;
    else if (req.query.escrowStatus === "completed") filter.escrowCompleted = true;
    else if (req.query.escrowStatus === "disputed") filter.escrowDisputed = true;

    if (req.query.query && typeof req.query.query === "string" && req.query.query.trim()) {
      const q = req.query.query.trim();
      const regex = new RegExp(q, "i");
      filter.$or = [{ title: regex }, { description: regex }];
      if (mongoose.Types.ObjectId.isValid(q)) {
        filter.$or.push({ _id: q });
      }
    }

    const [items, total] = await Promise.all([
      Project.find(filter)
        .populate("clientId", "firstName lastName email")
        .populate("freelancerId", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(page.skip)
        .limit(page.limit)
        .lean(),
      Project.countDocuments(filter),
    ]);

    const formatted = items.map((p) => ({
      id: p._id,
      title: p.title,
      description: p.description,
      budget: p.budget,
      status: p.status,
      client: p.clientId,
      freelancer: p.freelancerId,
      milestoneCount: p.milestones?.length || 0,
      releasedMilestoneCount: p.milestones?.filter((m) => m.paymentReleased).length || 0,
      escrowFunded: Boolean(p.escrowFunded),
      escrowCompleted: Boolean(p.escrowCompleted),
      escrowDisputed: Boolean(p.escrowDisputed),
      escrowTxnHash: p.escrowTxnHash || "",
      contractId: p.contractId || null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    res.json(paginated(formatted, total, page));
  } catch (err) {
    res.status(500).json({ message: "Unable to load projects" });
  }
};

exports.projectDetail = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("clientId", "firstName lastName email walletAddress")
      .populate("freelancerId", "firstName lastName email walletAddress")
      .populate("deliverables.uploadedBy", "firstName lastName email")
      .populate("referenceFiles.uploadedBy", "firstName lastName email")
      .lean();

    if (!project) return res.status(404).json({ message: "Project not found" });

    const [applications, contract, disputes] = await Promise.all([
      Application.find({ projectId: project._id }).populate("freelancerId", "firstName lastName email").lean(),
      Contract.findOne({ projectId: project._id }).lean(),
      Dispute.find({ projectId: project._id }).populate("raisedBy", "firstName lastName email").lean(),
    ]);

    res.json({ project, applications, contract, disputes });
  } catch (err) {
    res.status(500).json({ message: "Unable to load project details" });
  }
};

exports.moderateProject = async (req, res) => {
  try {
    const { isHidden, reason } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    project.isHidden = Boolean(isHidden);
    if (reason) project.moderationReason = String(reason).trim();
    await project.save();

    await logAudit(req, {
      action: "MODERATE_PROJECT",
      targetType: "Project",
      targetId: project._id,
      reason: (reason || "Admin moderated project").trim(),
      details: { isHidden: project.isHidden, title: project.title },
    });

    res.json({ message: `Project status updated.`, project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- APPLICATIONS MONITORING ----------------------------------------------
exports.applications = async (req, res) => {
  try {
    const page = pagination(req.query);
    const filter = {};
    if (req.query.status && ["pending", "accepted", "rejected", "withdrawn"].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const [items, total] = await Promise.all([
      Application.find(filter)
        .populate("projectId", "title budget status clientId")
        .populate("freelancerId", "firstName lastName email walletAddress")
        .sort({ createdAt: -1 })
        .skip(page.skip)
        .limit(page.limit)
        .lean(),
      Application.countDocuments(filter),
    ]);

    res.json(paginated(items, total, page));
  } catch (err) {
    res.status(500).json({ message: "Unable to load applications" });
  }
};

// --- CONTRACTS MONITORING -------------------------------------------------
exports.contracts = async (req, res) => {
  try {
    const page = pagination(req.query);
    const [items, total] = await Promise.all([
      Contract.find({})
        .populate("projectId", "title budget status escrowFunded escrowCompleted escrowTxnHash")
        .populate("clientId", "firstName lastName email")
        .populate("freelancerId", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(page.skip)
        .limit(page.limit)
        .lean(),
      Contract.countDocuments({}),
    ]);

    res.json(paginated(items, total, page));
  } catch (err) {
    res.status(500).json({ message: "Unable to load contracts" });
  }
};

// --- ESCROWS MONITORING ---------------------------------------------------
exports.escrows = async (req, res) => {
  try {
    const page = pagination(req.query);
    const filter = {};
    if (req.query.status === "funded") filter.escrowFunded = true;
    else if (req.query.status === "completed") filter.escrowCompleted = true;
    else if (req.query.status === "disputed") filter.escrowDisputed = true;

    const [items, total] = await Promise.all([
      Project.find(filter, "title budget status clientId freelancerId escrowFunded escrowCompleted escrowDisputed escrowTxnHash escrowToken createdAt")
        .populate("clientId", "firstName lastName walletAddress")
        .populate("freelancerId", "firstName lastName walletAddress")
        .sort({ createdAt: -1 })
        .skip(page.skip)
        .limit(page.limit)
        .lean(),
      Project.countDocuments(filter),
    ]);

    const escrows = items.map((p) => ({
      id: p._id,
      projectTitle: p.title,
      budget: p.budget,
      projectStatus: p.status,
      client: p.clientId,
      freelancer: p.freelancerId,
      escrowState: p.escrowDisputed ? "disputed" : p.escrowCompleted ? "completed" : p.escrowFunded ? "funded" : "awaiting_funding",
      onChainConfirmed: Boolean(p.escrowTxnHash),
      escrowTxnHash: p.escrowTxnHash || "",
      escrowToken: p.escrowToken || process.env.ESCROW_TOKEN_ADDRESS || "ERC-20",
      createdAt: p.createdAt,
    }));

    res.json(paginated(escrows, total, page));
  } catch (err) {
    res.status(500).json({ message: "Unable to load escrows" });
  }
};

// --- DISPUTES MONITORING --------------------------------------------------
exports.disputes = async (req, res) => {
  try {
    const page = pagination(req.query);
    const filter = {};
    if (req.query.status && ["pending", "resolved"].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const [items, total] = await Promise.all([
      Dispute.find(filter)
        .populate({
          path: "projectId",
          select: "title budget clientId freelancerId escrowTxnHash",
          populate: [
            { path: "clientId", select: "firstName lastName email walletAddress" },
            { path: "freelancerId", select: "firstName lastName email walletAddress" },
          ],
        })
        .populate("raisedBy", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(page.skip)
        .limit(page.limit)
        .lean(),
      Dispute.countDocuments(filter),
    ]);

    const formatted = items.map((d) => ({
      id: d._id,
      project: d.projectId,
      raisedBy: d.raisedBy,
      reason: d.reason,
      status: d.status,
      winner: d.winner,
      evidenceCount: d.evidence?.length || 0,
      blockchainTxn: d.blockchainTxn || "",
      arbitratorAddress: process.env.ARBITRATOR_ADDRESS || "Dispute Smart Contract Arbitrator Authority",
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));

    res.json(paginated(formatted, total, page));
  } catch (err) {
    res.status(500).json({ message: "Unable to load disputes" });
  }
};

exports.arbitrators = async (_req, res) => {
  try {
    const disputeContractAddress = process.env.DISPUTE_CONTRACT_ADDRESS || "";
    const arbitratorAddress = process.env.ARBITRATOR_ADDRESS || "";
    const [pendingDisputes, resolvedDisputes] = await Promise.all([
      Dispute.countDocuments({ status: "pending" }),
      Dispute.countDocuments({ status: "resolved" }),
    ]);

    res.json({
      arbitratorAddress,
      disputeContractAddress,
      authorityModel: "On-Chain Smart Contract Arbitrator Authority",
      activeStatus: Boolean(disputeContractAddress),
      assignedDisputes: pendingDisputes,
      resolvedDisputes: resolvedDisputes,
    });
  } catch (err) {
    res.status(500).json({ message: "Unable to load arbitrator information" });
  }
};

// --- TRANSACTIONS & BLOCKCHAIN MONITORING --------------------------------
exports.transactions = async (req, res) => {
  try {
    const page = pagination(req.query);

    const [projectsWithTx, disputesWithTx] = await Promise.all([
      Project.find({ escrowTxnHash: { $exists: true, $ne: "" } }, "title escrowTxnHash escrowFunded escrowCompleted createdAt updatedAt")
        .populate("clientId", "firstName lastName walletAddress")
        .sort({ updatedAt: -1 })
        .lean(),
      Dispute.find({ blockchainTxn: { $exists: true, $ne: "" } }, "reason winner status blockchainTxn createdAt updatedAt")
        .populate("projectId", "title")
        .sort({ updatedAt: -1 })
        .lean(),
    ]);

    const txs = [
      ...projectsWithTx.map((p) => ({
        id: `tx-escrow-${p._id}`,
        hash: p.escrowTxnHash,
        type: p.escrowCompleted ? "ESCROW_RELEASED" : "ESCROW_FUNDED",
        projectTitle: p.title,
        status: "CONFIRMED",
        chain: process.env.SEPOLIA_RPC_URL ? "Sepolia Testnet" : "Local Hardhat EVM",
        contractAddress: process.env.ESCROW_CONTRACT_ADDRESS || "",
        timestamp: p.updatedAt || p.createdAt,
      })),
      ...disputesWithTx.map((d) => ({
        id: `tx-dispute-${d._id}`,
        hash: d.blockchainTxn,
        type: "DISPUTE_RESOLVED",
        projectTitle: d.projectId?.title || "Disputed Project",
        status: "CONFIRMED",
        chain: process.env.SEPOLIA_RPC_URL ? "Sepolia Testnet" : "Local Hardhat EVM",
        contractAddress: process.env.DISPUTE_CONTRACT_ADDRESS || "",
        timestamp: d.updatedAt || d.createdAt,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const total = txs.length;
    const paginatedTxs = txs.slice(page.skip, page.skip + page.limit);

    res.json(paginated(paginatedTxs, total, page));
  } catch (err) {
    res.status(500).json({ message: "Unable to load transactions" });
  }
};

// --- REPORTS / TRUST & SAFETY ---------------------------------------------
exports.createReport = async (req, res) => {
  try {
    const { targetType, targetId, category, description } = req.body;
    if (!targetType || !targetId || !category || !description) {
      return res.status(400).json({ message: "targetType, targetId, category, and description are required." });
    }

    const report = await Report.create({
      reporter: req.user.id,
      targetType,
      targetId: String(targetId),
      category,
      description,
      status: "open",
    });

    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.reports = async (req, res) => {
  try {
    const page = pagination(req.query);
    const filter = {};
    if (req.query.status && ["open", "under_review", "resolved", "dismissed"].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const [items, total] = await Promise.all([
      Report.find(filter)
        .populate("reporter", "firstName lastName email")
        .populate("resolvedBy", "firstName lastName")
        .sort({ createdAt: -1 })
        .skip(page.skip)
        .limit(page.limit)
        .lean(),
      Report.countDocuments(filter),
    ]);

    res.json(paginated(items, total, page));
  } catch (err) {
    res.status(500).json({ message: "Unable to load reports" });
  }
};

exports.updateReport = async (req, res) => {
  try {
    const { status, resolutionNotes } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    if (status && ["open", "under_review", "resolved", "dismissed"].includes(status)) {
      report.status = status;
    }
    if (resolutionNotes !== undefined) {
      report.resolutionNotes = String(resolutionNotes).trim();
    }
    report.resolvedBy = req.user.id;
    await report.save();

    await logAudit(req, {
      action: "UPDATE_REPORT",
      targetType: "Report",
      targetId: report._id,
      reason: (resolutionNotes || `Updated report status to ${status}`).trim(),
      details: { status: report.status },
    });

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- ANALYTICS ------------------------------------------------------------
exports.analytics = async (_req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [userGrowth, projectDistribution, applicationStats] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Project.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Application.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      userGrowth: userGrowth.map((g) => ({ date: g._id, users: g.count })),
      projectDistribution: projectDistribution.map((p) => ({ status: p._id, count: p.count })),
      applicationStats: applicationStats.map((a) => ({ status: a._id, count: a.count })),
    });
  } catch (err) {
    res.status(500).json({ message: "Unable to load analytics" });
  }
};

// --- AUDIT LOGS -----------------------------------------------------------
exports.auditLogs = async (req, res) => {
  try {
    const page = pagination(req.query);
    const filter = {};
    if (req.query.action) filter.action = req.query.action;
    if (req.query.targetType) filter.targetType = req.query.targetType;

    const [items, total] = await Promise.all([
      AuditLog.find(filter)
        .populate("admin", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(page.skip)
        .limit(page.limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.json(paginated(items, total, page));
  } catch (err) {
    res.status(500).json({ message: "Unable to load audit logs" });
  }
};

// --- SYSTEM HEALTH --------------------------------------------------------
exports.system = async (_req, res) => {
  try {
    const sync = await SyncState.findOne({ key: "sepolia" }, "lastProcessedBlock updatedAt").lean();
    const contracts = Object.fromEntries(
      Object.entries({
        escrow: process.env.ESCROW_CONTRACT_ADDRESS,
        dispute: process.env.DISPUTE_CONTRACT_ADDRESS,
        reputation: process.env.REPUTATION_CONTRACT_ADDRESS,
      }).filter(([, address]) => typeof address === "string" && address.trim())
    );
    const listenerConfigured = Boolean(process.env.SEPOLIA_RPC_URL && contracts.escrow && contracts.dispute);

    res.json({
      backend: "available",
      mongoState: mongoose.connection.readyState,
      chain: listenerConfigured ? "sepolia" : "local_evm",
      listenerConfigured,
      synchronization: sync ? { lastProcessedBlock: sync.lastProcessedBlock, updatedAt: sync.updatedAt } : null,
      contracts,
    });
  } catch (err) {
    res.status(500).json({ message: "Unable to load system status" });
  }
};

// --- DATA INTEGRITY SCANNER -----------------------------------------------
exports.integrity = async (_req, res) => {
  try {
    const anomalies = [];

    // 1. Projects with freelancerId assigned but user document does not exist
    const assignedProjects = await Project.find({ freelancerId: { $ne: null } }, "_id title freelancerId").lean();
    const freelancerIds = [...new Set(assignedProjects.map((p) => String(p.freelancerId)))];
    const existingUsers = await User.find({ _id: { $in: freelancerIds } }, "_id").lean();
    const existingSet = new Set(existingUsers.map((u) => String(u._id)));

    for (const project of assignedProjects) {
      if (!existingSet.has(String(project.freelancerId))) {
        anomalies.push({
          type: "ORPHANED_FREELANCER_ASSIGNMENT",
          severity: "HIGH",
          entityType: "Project",
          entityId: String(project._id),
          message: `Project "${project.title}" references missing freelancer ID ${project.freelancerId}.`,
        });
      }
    }

    // 2. Escrows marked funded without transaction hash
    const fundedNoTx = await Project.find({ escrowFunded: true, $or: [{ escrowTxnHash: { $exists: false } }, { escrowTxnHash: "" }, { escrowTxnHash: null }] }, "_id title").lean();
    for (const project of fundedNoTx) {
      anomalies.push({
        type: "ESCROW_FUNDED_WITHOUT_TX_HASH",
        severity: "WARNING",
        entityType: "Project",
        entityId: String(project._id),
        message: `Project "${project.title}" has escrow marked as funded in DB, but lacks an on-chain transaction hash.`,
      });
    }

    // 3. Contracts with missing project
    const contracts = await Contract.find({}, "_id projectId").lean();
    const contractProjectIds = [...new Set(contracts.map((c) => String(c.projectId)))];
    const existingProjects = await Project.find({ _id: { $in: contractProjectIds } }, "_id").lean();
    const existingProjectSet = new Set(existingProjects.map((p) => String(p._id)));

    for (const contract of contracts) {
      if (!existingProjectSet.has(String(contract.projectId))) {
        anomalies.push({
          type: "ORPHANED_CONTRACT",
          severity: "MEDIUM",
          entityType: "Contract",
          entityId: String(contract._id),
          message: `Contract ${contract._id} references missing project ID ${contract.projectId}.`,
        });
      }
    }

    res.json({
      scanTimestamp: new Date(),
      totalAnomalies: anomalies.length,
      anomalies,
    });
  } catch (err) {
    res.status(500).json({ message: "Unable to run data integrity scan" });
  }
};

exports.replayQuarantineEvent = async (req, res) => {
  const QuarantineEvent = require("../models/QuarantineEvent");
  const { reconcileVerifiedBlockchainEvent } = require("../services/reconciliationService");

  try {
    const { id } = req.params;
    const { reason = "Manual administrative replay" } = req.body || {};

    const quarantineEvent = await QuarantineEvent.findById(id);
    if (!quarantineEvent) {
      return res.status(404).json({ message: "Quarantine event not found" });
    }

    if (quarantineEvent.resolved) {
      return res.status(409).json({
        message: "Quarantine event has already been resolved",
        resolvedAt: quarantineEvent.resolvedAt,
        resolvedBy: quarantineEvent.resolvedBy,
        replayResult: quarantineEvent.replayResult,
      });
    }

    let replayResult = "SUCCESS";
    if (quarantineEvent.rawEventData) {
      const outcome = await reconcileVerifiedBlockchainEvent({
        verifiedEvent: quarantineEvent.rawEventData,
        onChainEscrowState: quarantineEvent.rawEventData.onChainEscrowState,
        expectedTokenAddress: process.env.CANONICAL_TOKEN_ADDRESS || quarantineEvent.rawEventData.tokenAddress,
      });
      replayResult = outcome;
    }

    quarantineEvent.resolved = true;
    quarantineEvent.resolvedBy = req.user.id;
    quarantineEvent.resolvedAt = new Date();
    quarantineEvent.replayResult = replayResult;
    quarantineEvent.resolution = reason;
    await quarantineEvent.save();

    await logAudit(req, {
      action: "QUARANTINE_EVENT_REPLAY",
      targetType: "QuarantineEvent",
      targetId: id,
      reason,
      details: {
        category: quarantineEvent.category,
        sourceEventKey: quarantineEvent.sourceEventKey,
        replayResult,
      },
    });

    res.json({
      message: "Quarantine event replayed successfully",
      quarantineEvent,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to replay quarantine event" });
  }
};

