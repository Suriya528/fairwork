const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", index: true },
  disputeId: { type: mongoose.Schema.Types.ObjectId, ref: "Dispute" },
  milestoneIndex: { type: Number, min: 0 },
  read: { type: Boolean, default: false },
  // A recipient-specific deterministic key makes listener retries harmless.
  eventKey: { type: String, unique: true, sparse: true },
}, { timestamps: true });

activitySchema.index({ userId: 1, createdAt: -1 });
module.exports = mongoose.model("Activity", activitySchema);
