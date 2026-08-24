const mongoose = require("mongoose");

const outboxEventSchema = new mongoose.Schema({
  sourceEventKey: { type: String, required: true },
  eventType: { type: String, required: true },
  settlementEventId: { type: mongoose.Schema.Types.ObjectId, ref: "SettlementEvent", required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  content: { type: String, required: true },
  status: {
    type: String,
    enum: ["PENDING", "PROCESSING", "PROCESSED", "CANCELLED_REORG", "DEAD_LETTER"],
    default: "PENDING",
    required: true,
  },
  workerId: { type: String, default: null },
  claimToken: { type: String, default: null },
  lockedUntil: { type: Date, default: null },
  attempts: { type: Number, default: 0, min: 0 },
  maxAttempts: { type: Number, default: 5 },
  nextAttemptAt: { type: Date, default: null },
  processedAt: { type: Date, default: null },
  errorMessage: { type: String, default: null },
}, { timestamps: true });

outboxEventSchema.index(
  { sourceEventKey: 1, eventType: 1 },
  { unique: true }
);

outboxEventSchema.index({ status: 1, nextAttemptAt: 1 });
outboxEventSchema.index({ status: 1, lockedUntil: 1 });

module.exports = mongoose.models.OutboxEvent || mongoose.model("OutboxEvent", outboxEventSchema);
