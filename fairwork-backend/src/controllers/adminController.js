const mongoose = require("mongoose");
const User = require("../models/User");
const Project = require("../models/Project");
const Dispute = require("../models/Dispute");
const SyncState = require("../models/BlockchainSyncState");

function pagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

function paginated(items, total, { page, limit }) {
  return { items, page, limit, total, pageCount: Math.ceil(total / limit) };
}

exports.overview = async (_req, res) => {
  try {
    const [totalUsers, totalClients, totalFreelancers, totalProjects, activeProjects, completedProjects, fundedEscrows, completedEscrows, openDisputes, resolvedDisputes] = await Promise.all([
      User.countDocuments(), User.countDocuments({ role: "client" }), User.countDocuments({ role: "freelancer" }),
      Project.countDocuments(), Project.countDocuments({ status: "in_progress" }), Project.countDocuments({ status: "completed" }),
      Project.countDocuments({ escrowFunded: true }), Project.countDocuments({ escrowCompleted: true }),
      Dispute.countDocuments({ status: "pending" }), Dispute.countDocuments({ status: "resolved" }),
    ]);
    // MongoDB retains only a token address and display-budget numbers. It has
    // neither the on-chain raw escrow amount nor token decimals, so a summed
    // platform volume would be financially misleading.
    res.json({ totalUsers, totalClients, totalFreelancers, totalProjects, activeProjects, completedProjects, fundedEscrows, completedEscrows, openDisputes, resolvedDisputes, platformEscrowVolume: null, platformEscrowVolumeUnit: null });
  } catch (err) { res.status(500).json({ message: "Unable to load admin overview" }); }
};

exports.users = async (req, res) => {
  try {
    const page = pagination(req.query);
    const [items, total] = await Promise.all([
      User.find({}, "firstName lastName email role walletAddress createdAt").sort({ createdAt: -1 }).skip(page.skip).limit(page.limit).lean(),
      User.countDocuments(),
    ]);
    res.json(paginated(items.map((user) => ({ id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, walletAddress: user.walletAddress || "", createdAt: user.createdAt })), total, page));
  } catch (err) { res.status(500).json({ message: "Unable to load users" }); }
};

exports.projects = async (req, res) => {
  try {
    const page = pagination(req.query);
    const [items, total] = await Promise.all([
      Project.find({}, "title budget status clientId freelancerId milestones escrowFunded escrowCompleted escrowDisputed escrowToken createdAt updatedAt").populate("clientId", "firstName lastName").populate("freelancerId", "firstName lastName").sort({ createdAt: -1 }).skip(page.skip).limit(page.limit).lean(),
      Project.countDocuments(),
    ]);
    res.json(paginated(items.map((project) => ({ id: project._id, title: project.title, budget: project.budget, status: project.status, client: project.clientId, freelancer: project.freelancerId, milestoneCount: project.milestones.length, releasedMilestoneCount: project.milestones.filter((milestone) => milestone.paymentReleased).length, escrowFunded: project.escrowFunded, escrowCompleted: project.escrowCompleted, escrowDisputed: project.escrowDisputed, escrowToken: project.escrowToken, createdAt: project.createdAt, updatedAt: project.updatedAt })), total, page));
  } catch (err) { res.status(500).json({ message: "Unable to load projects" }); }
};

exports.disputes = async (req, res) => {
  try {
    const page = pagination(req.query);
    const [items, total] = await Promise.all([
      Dispute.find({}, "projectId raisedBy status winner reason createdAt updatedAt").populate({ path: "projectId", select: "title clientId freelancerId", populate: [{ path: "clientId", select: "firstName lastName" }, { path: "freelancerId", select: "firstName lastName" }] }).populate("raisedBy", "firstName lastName").sort({ createdAt: -1 }).skip(page.skip).limit(page.limit).lean(),
      Dispute.countDocuments(),
    ]);
    res.json(paginated(items.map((dispute) => ({ id: dispute._id, project: dispute.projectId, raisedBy: dispute.raisedBy, status: dispute.status, winner: dispute.winner, reason: dispute.reason, createdAt: dispute.createdAt, updatedAt: dispute.updatedAt })), total, page));
  } catch (err) { res.status(500).json({ message: "Unable to load disputes" }); }
};

exports.system = async (_req, res) => {
  try {
    const sync = await SyncState.findOne({ key: "sepolia" }, "lastProcessedBlock updatedAt").lean();
    const contracts = Object.fromEntries(Object.entries({ escrow: process.env.ESCROW_CONTRACT_ADDRESS, dispute: process.env.DISPUTE_CONTRACT_ADDRESS, reputation: process.env.REPUTATION_CONTRACT_ADDRESS }).filter(([, address]) => typeof address === "string" && address.trim()));
    const listenerConfigured = Boolean(process.env.SEPOLIA_RPC_URL && contracts.escrow && contracts.dispute);
    res.json({ backend: "available", mongoState: mongoose.connection.readyState, chain: listenerConfigured ? "sepolia" : null, listenerConfigured, synchronization: sync ? { lastProcessedBlock: sync.lastProcessedBlock, updatedAt: sync.updatedAt } : null, contracts });
  } catch (err) { res.status(500).json({ message: "Unable to load system status" }); }
};
