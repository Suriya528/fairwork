const Message = require("../models/Message");
const Project = require("../models/Project");

/**
 * Centralized Helper: Reconciled Escrow Snapshot
 * Resolves lump-sum dispute/refund payouts correctly for workroom side-panel display.
 */
async function getProjectEscrowSnapshot(projectId) {
  const project = await Project.findById(projectId)
    .populate("clientId", "firstName lastName avatarUrl walletAddress")
    .populate("freelancerId", "firstName lastName avatarUrl walletAddress");

  if (!project) throw new Error("Project not found");

  const totalBudget = project.budget || 0;
  const milestones = project.milestones || [];

  const releasedAmount = milestones
    .filter((m) => m.paymentReleased)
    .reduce((sum, m) => sum + (m.amount || 0), 0);

  const pendingAmount = milestones
    .filter((m) => m.status === "completed" && !m.paymentReleased)
    .reduce((sum, m) => sum + (m.amount || 0), 0);

  const unreleasedAmount = milestones
    .filter((m) => !m.paymentReleased)
    .reduce((sum, m) => sum + (m.amount || 0), 0);

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
async function createSystemEventMessage({ projectId, senderId, title, message, systemEventKey }) {
  if (!systemEventKey) {
    throw new Error("systemEventKey is required for idempotent system events");
  }

  try {
    const existing = await Message.findOne({ systemEventKey });
    if (existing) {
      return existing; // Idempotent return existing
    }

    const sysMsg = await Message.create({
      projectId,
      senderId,
      content: `[SYSTEM_EVENT] ${title}: ${message}`,
      type: "SYSTEM_EVENT",
      systemEventKey,
    });

    return await sysMsg.populate("senderId", "firstName lastName avatarUrl");
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate key race condition caught cleanly
      return await Message.findOne({ systemEventKey }).populate("senderId", "firstName lastName avatarUrl");
    }
    throw err;
  }
}

exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ projectId: req.params.projectId })
      .populate("senderId", "firstName lastName avatarUrl")
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getEscrowSnapshotEndpoint = async (req, res) => {
  try {
    const snapshot = await getProjectEscrowSnapshot(req.params.projectId);
    res.json(snapshot);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch escrow snapshot." });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { projectId, content, fileUrl, fileMeta, type } = req.body;
    const message = await Message.create({
      projectId,
      senderId: req.user.id,
      content: content || "",
      fileUrl: fileUrl || "",
      fileMeta: fileMeta || {},
      type: type || (fileUrl ? "FILE" : "TEXT"),
    });
    const populated = await message.populate("senderId", "firstName lastName avatarUrl");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    const incomingReadAt = req.body.readAt ? new Date(req.body.readAt) : new Date();

    // Monotonic cursor update with $lt guard to prevent cursor regressions
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
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  ...exports,
  getProjectEscrowSnapshot,
  createSystemEventMessage,
};