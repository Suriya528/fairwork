const mongoose = require("mongoose");
const Message = require("../models/Message");
const Project = require("../models/Project");
const { sendErrorResponse } = require("../utils/errorResponse");

// Display-only helper — NOT used for financial settlement calculations.
// Settlement uses exact BigInt arithmetic in reconciliationService.js.
function decimalToNumber(d) { return d ? Number(d.toString()) : 0; }

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

  const totalBudget = decimalToNumber(project.budget);
  const milestones = project.milestones || [];

  const releasedAmount = milestones
    .filter((m) => m.paymentReleased)
    .reduce((sum, m) => sum + decimalToNumber(m.amount), 0);

  const pendingAmount = milestones
    .filter((m) => m.status === "completed" && !m.paymentReleased)
    .reduce((sum, m) => sum + decimalToNumber(m.amount), 0);

  const unreleasedAmount = milestones
    .filter((m) => !m.paymentReleased)
    .reduce((sum, m) => sum + decimalToNumber(m.amount), 0);

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
    sendErrorResponse(res, err, "MessageController");
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
    sendErrorResponse(res, err, "MessageController");
  }
};

exports.getEscrowSnapshotEndpoint = async (req, res) => {
  try {
    await assertProjectMembership(req.params.projectId, req.user.id, req.user.role);
    const snapshot = await getProjectEscrowSnapshot(req.params.projectId);
    res.json(snapshot);
  } catch (err) {
    sendErrorResponse(res, err, "MessageController");
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

    // Real-time broadcast if socket gateway is available on express app
    const io = req.app.get("io");
    if (io) {
      io.to(`project:${projectId}`).emit("receive_message", populated);
      const recipientId = String(project.clientId) === String(req.user.id)
        ? (project.freelancerId ? String(project.freelancerId) : null)
        : String(project.clientId);
      if (recipientId) {
        io.to(`user:${recipientId}`).emit("chat_notification", {
          projectId,
          projectTitle: project.title,
          message: populated,
        });
      }
    }

    res.status(201).json(populated);
  } catch (err) {
    sendErrorResponse(res, err, "MessageController");
  }
};

exports.markRead = async (req, res) => {
  try {
    const project = await assertProjectMembership(req.params.projectId, req.user.id, req.user.role);
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

    const io = req.app.get("io");
    if (io) {
      const recipientId = String(project.clientId) === String(req.user.id)
        ? (project.freelancerId ? String(project.freelancerId) : null)
        : String(project.clientId);
      if (recipientId) {
        io.to(`user:${recipientId}`).emit("messages_read", {
          projectId: req.params.projectId,
          readAt: incomingReadAt.toISOString(),
        });
      }
    }

    res.json({ message: "Marked as read", readAt: incomingReadAt.toISOString() });
  } catch (err) {
    sendErrorResponse(res, err, "MessageController");
  }
};

/**
 * Returns total unread messages count and summary of active workroom threads for the authenticated user.
 */
exports.getChatSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const projects = await Project.find({
      $or: [{ clientId: userId }, { freelancerId: userId }],
    })
      .select("title clientId freelancerId status")
      .populate("clientId", "firstName lastName avatarUrl")
      .populate("freelancerId", "firstName lastName avatarUrl")
      .lean();

    if (!projects.length) {
      return res.json({ totalUnread: 0, threads: [] });
    }

    const projectIds = projects.map((p) => p._id);

    const userObjId = mongoose.isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : null;
    const matchSender = userObjId ? { $ne: userObjId } : { $ne: userId };

    const unreadCounts = await Message.aggregate([
      {
        $match: {
          projectId: { $in: projectIds },
          senderId: matchSender,
          read: false,
          eventStatus: { $ne: "ORPHANED_REORGED" },
        },
      },
      {
        $group: {
          _id: "$projectId",
          count: { $sum: 1 },
        },
      },
    ]);

    const unreadMap = {};
    let totalUnread = 0;
    unreadCounts.forEach((u) => {
      const pid = u._id.toString();
      unreadMap[pid] = u.count;
      totalUnread += u.count;
    });

    const latestMessages = await Message.aggregate([
      {
        $match: {
          projectId: { $in: projectIds },
          eventStatus: { $ne: "ORPHANED_REORGED" },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$projectId",
          latestId: { $first: "$_id" },
          content: { $first: "$content" },
          type: { $first: "$type" },
          fileUrl: { $first: "$fileUrl" },
          senderId: { $first: "$senderId" },
          createdAt: { $first: "$createdAt" },
        },
      },
    ]);

    const latestMap = {};
    latestMessages.forEach((m) => {
      latestMap[m._id.toString()] = m;
    });

    const threads = projects
      .filter((p) => p.freelancerId)
      .map((p) => {
        const isClient = String(p.clientId?._id || p.clientId) === userId;
        const counterpartyObj = isClient ? p.freelancerId : p.clientId;
        const counterpartyName = counterpartyObj
          ? `${counterpartyObj.firstName || ""} ${counterpartyObj.lastName || ""}`.trim() || (isClient ? "Freelancer" : "Client")
          : isClient ? "Freelancer" : "Client";
        const counterpartyAvatar = counterpartyObj?.avatarUrl || "";

        const pid = p._id.toString();
        const latest = latestMap[pid];

        return {
          projectId: pid,
          projectTitle: p.title,
          status: p.status,
          counterparty: {
            id: counterpartyObj?._id ? counterpartyObj._id.toString() : "",
            name: counterpartyName,
            avatarUrl: counterpartyAvatar,
            role: isClient ? "freelancer" : "client",
          },
          lastMessage: latest
            ? {
                content: latest.type === "FILE" ? "Sent a file attachment" : latest.content,
                createdAt: latest.createdAt,
                senderId: latest.senderId ? latest.senderId.toString() : "",
              }
            : null,
          unreadCount: unreadMap[pid] || 0,
        };
      })
      .sort((a, b) => {
        if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
        if (b.unreadCount > 0 && a.unreadCount === 0) return 1;
        const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return timeB - timeA;
      });

    res.json({ totalUnread, threads });
  } catch (err) {
    sendErrorResponse(res, err, "MessageController");
  }
};

module.exports = {
  ...exports,
  getProjectEscrowSnapshot,
  createSystemEventMessage,
  assertProjectMembership,
};


