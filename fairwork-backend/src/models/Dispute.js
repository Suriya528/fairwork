const mongoose = require("mongoose");

const disputeSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reason: { type: String, required: true },
  evidence: [{ type: String }],
  status: { type: String, enum: ["pending", "resolved"], default: "pending" },
  winner: { type: String, enum: ["client", "freelancer", "none"], default: "none" },
  clientVotes: { type: Number, default: 0 },
  freelancerVotes: { type: Number, default: 0 },
  blockchainTxn: { type: String, default: "" },
}, { timestamps: true });

disputeSchema.index({ projectId: 1, status: 1 });

module.exports = mongoose.model("Dispute", disputeSchema);