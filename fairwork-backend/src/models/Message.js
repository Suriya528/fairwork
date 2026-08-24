const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: function() { return this.type !== "SYSTEM_EVENT"; },
  },
  content: { type: String, default: "" },
  fileUrl: { type: String, default: "" },
  fileMeta: {
    filename: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    size: { type: Number, default: 0 },
  },
  type: { type: String, enum: ["TEXT", "FILE", "SYSTEM_EVENT"], default: "TEXT" },
  systemEventKey: { type: String, default: undefined },
  eventStatus: {
    type: String,
    enum: ["ACTIVE", "ORPHANED_REORGED"],
    default: undefined,
  },
  settlementEventId: { type: mongoose.Schema.Types.ObjectId, ref: "SettlementEvent", default: null },
  read: { type: Boolean, default: false },
  readAt: { type: Date },
}, { timestamps: true });

messageSchema.index(
  { projectId: 1, systemEventKey: 1 },
  { unique: true, partialFilterExpression: { systemEventKey: { $type: "string" } } }
);
messageSchema.index({ projectId: 1, createdAt: 1, _id: 1 });
messageSchema.index({ projectId: 1, senderId: 1, createdAt: -1 });

module.exports = mongoose.models.Message || mongoose.model("Message", messageSchema);