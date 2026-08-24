const mongoose = require("mongoose");
const Message = require("../models/Message");
const Project = require("../models/Project");

/**
 * Validates user membership for a project's communication channel.
 * Admin users are permitted access ONLY during active dispute status.
 */
async function assertProjectMembership(projectId, userId, userRole) {
  if (!projectId || !mongoose.isValidObjectId(projectId)) {
    const err = new Error("Invalid project ID");
    err.statusCode = 400;
    throw err;
  }

  const project = await Project.findById(projectId).select("clientId freelancerId status title budget milestones escrowFunded escrowCompleted escrowDisputed escrowTxnHash");
  if (!project) {
    const err = new Error("Project not found");
    err.statusCode = 404;
    throw err;
  }

  const isClient = String(project.clientId) === String(userId);
  const isFreelancer = project.freelancerId && String(project.freelancerId) === String(userId);
  const isAdminDisputeAccess = userRole === "admin" && project.status === "disputed";

  if (!isClient && !isFreelancer && !isAdminDisputeAccess) {
    const err = new Error(
      userRole === "admin"
        ? "Admins can only access project communication during an active dispute."
        : "You are not a participant in this project."
    );
    err.statusCode = 403;
    throw err;
  }

  return project;
}

/**
 * Centralized Helper: Reconciled Escrow Snapshot
 * Resolves lump-sum dispute/refund payouts correctly for workroom side-panel display.
 */
async function getProjectEscrowSnapshot(projectId) {
  const project = await Project.findById(projectId)
    .populate("clientId", "firstName lastName avatarUrl walletAddress")
    .populate("freelancerId", "firstName lastName avatarUrl walletAddress");

  if (!project) throw new Error("Project not found");

  const totalBudget = project.budget ? parseFloat(project.budget.toString()) : 0;
  const milestones = project.milestones || [];

  const releasedAmount = milestones
    .filter((m) => m.paymentReleased)
    .reduce((sum, m) => sum + (m.amount ? parseFloat(m.amount.toString()) : 0), 0);

  const pendingAmount = milestones
    .filter((m) => m.status === "completed" && !m.paymentReleased)
    .reduce((sum, m) => sum + (m.amount ? parseFloat(m.amount.toString()) : 0), 0);

  const unreleasedAmount = milestones
    .filter((m) => !m.paymentReleased)
    .reduce((sum, m) => sum + (m.amount ? parseFloat(m.amount.toString()) : 0), 0);

  let settlementState = "ACTIVE";
  if (project.status === "completed" || project.escrowCompleted) {
    settlementState = "SETTLED_COMPLETED";
  } else if (project.status === "refunded") {
    settlementState = "SETTLED_REFUNDED";
  } else if (project.status === "disputed" || project.escrowDisputed) {
    settlementState = "DISPUTED";
  }

  return {
    projectId: project._id,
    title: project.title,
    status: project.status,
    settlementState,
    totalBudget,
    releasedAmount,
    pendingAmount,
    unreleasedAmount: project.status === "refunded" ? 0 : unreleasedAmount,
    escrowFunded: project.escrowFunded,
    escrowTxnHash: project.escrowTxnHash || "",
    client: project.clientId,
    freelancer: project.freelancerId,
    milestonesCount: milestones.length,
  };
}

/**
 * Idempotent System Milestone Event Bridge Creator
 */
async function createSystemEventMessage({ projectId, senderId, title, message, systemEventKey, settlementEventId }) {
  if (!systemEventKey) {
    throw new Error("systemEventKey is required for idempotent system events");
  }

  try {
    const existing = await Message.findOne({ projectId, systemEventKey });
    if (existing) {
      return existing;
    }

    const sysMsg = await Message.create({
      projectId,
      senderId: senderId || null,
      content: `[SYSTEM_EVENT] ${title}: ${message}`,
      type: "SYSTEM_EVENT",
      systemEventKey,
      eventStatus: "ACTIVE",
      settlementEventId: settlementEventId || null,
    });

    return await sysMsg.populate("senderId", "firstName lastName avatarUrl");
  } catch (err) {
    if (err.code === 11000) {
      return await Message.findOne({ projectId, systemEventKey }).populate("senderId", "firstName lastName avatarUrl");
    }
    throw err;
  }
}

exports.getMessages = async (req, res) => {
  try {
    await assertProjectMembership(req.params.projectId, req.user.id, req.user.role);

    const messages = await Message.find({
      projectId: req.params.projectId,
      eventStatus: { $ne: "ORPHANED_REORGED" },
    })
      .populate("senderId", "firstName lastName avatarUrl")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
};

/**
 * Reconnect Catch-Up API with Cursor Pagination
 * Returns messages created after the provided opaque cursor.
 */
exports.getCatchUpMessages = async (req, res) => {
  try {
    const { projectId } = req.params;
    await assertProjectMembership(projectId, req.user.id, req.user.role);

    const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 50), 100);
    const rawCursor = req.query.cursor;

    let cursorQuery = {};
    if (rawCursor) {
      let decoded = null;
      try {
        const jsonStr = Buffer.from(rawCursor, "base64url").toString("utf-8");
        decoded = JSON.parse(jsonStr);
      } catch {
        return res.status(400).json({ message: "Invalid cursor format", code: "INVALID_CURSOR" });
      }

      if (!decoded || !decoded.createdAt || !decoded._id) {
        return res.status(400).json({ message: "Malformed cursor payload", code: "INVALID_CURSOR" });
      }

      const cursorTs = new Date(decoded.createdAt);
      if (isNaN(cursorTs.getTime()) || !mongoose.isValidObjectId(decoded._id)) {
        return res.status(400).json({ message: "Invalid cursor values", code: "INVALID_CURSOR" });
      }

      // Verify referenced cursor message exists (retention window check)
      const cursorMessage = await Message.findById(decoded._id);
      if (!cursorMessage) {
        return res.status(410).json({
          code: "CURSOR_OUTSIDE_RETENTION_WINDOW",
          message: "The referenced message has been archived. Please reload the full conversation.",
        });
      }

      // Compound cursor condition for equal-timestamp tie-breaking
      cursorQuery = {
        $or: [
          { createdAt: { $gt: cursorTs } },
          { createdAt: cursorTs, _id: { $gt: decoded._id } },
        ],
      };
    }

    const query = {
      projectId,
      eventStatus: { $ne: "ORPHANED_REORGED" },
      ...cursorQuery,
    };

    const messages = await Message.find(query)
      .populate("senderId", "firstName lastName avatarUrl")
      .sort({ createdAt: 1, _id: 1 })
      .limit(limit + 1);

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;

    let nextCursor = null;
    if (items.length > 0 && hasMore) {
      const lastItem = items[items.length - 1];
      const cursorPayload = JSON.stringify({
        createdAt: lastItem.createdAt.toISOString(),
        _id: lastItem._id.toString(),
      });
      nextCursor = Buffer.from(cursorPayload).toString("base64url");
    }

    res.json({
      items,
      hasMore,
      nextCursor,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
};

exports.getEscrowSnapshotEndpoint = async (req, res) => {
  try {
    await assertProjectMembership(req.params.projectId, req.user.id, req.user.role);
    const snapshot = await getProjectEscrowSnapshot(req.params.projectId);
    res.json(snapshot);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message || "Failed to fetch escrow snapshot." });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { projectId, content, fileUrl, fileMeta, type } = req.body;
    const project = await assertProjectMembership(projectId, req.user.id, req.user.role);

    // Reject non-participant text message dispatch
    const isParticipant = String(project.clientId) === String(req.user.id) || (project.freelancerId && String(project.freelancerId) === String(req.user.id));
    if (!isParticipant && req.user.role === "admin" && project.status !== "disputed") {
      return res.status(403).json({ message: "Admins can only message during active dispute mediation." });
    }

    const messageType = type || (fileUrl ? "FILE" : "TEXT");
    if (messageType === "SYSTEM_EVENT") {
      return res.status(403).json({ message: "Clients cannot directly emit SYSTEM_EVENT messages." });
    }

    const message = await Message.create({
      projectId,
      senderId: req.user.id,
      content: content || "",
      fileUrl: fileUrl || "",
      fileMeta: fileMeta || {},
      type: messageType,
      eventStatus: undefined,
    });
    const populated = await message.populate("senderId", "firstName lastName avatarUrl");
    res.status(201).json(populated);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    await assertProjectMembership(req.params.projectId, req.user.id, req.user.role);
    const incomingReadAt = req.body.readAt ? new Date(req.body.readAt) : new Date();

    await Message.updateMany(
      {
        projectId: req.params.projectId,
        senderId: { $ne: req.user.id },
        $or: [{ readAt: { $exists: false } }, { readAt: { $lt: incomingReadAt } }],
      },
      {
        read: true,
        readAt: incomingReadAt,
      }
    );
    res.json({ message: "Marked as read", readAt: incomingReadAt.toISOString() });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
};

module.exports = {
  ...exports,
  getProjectEscrowSnapshot,
  createSystemEventMessage,
  assertProjectMembership,
};