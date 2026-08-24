const mongoose = require("mongoose");

const quarantineEventSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: [
      "MALFORMED_EVENT",
      "UNSUPPORTED_EVENT",
      "SECURITY_VALIDATION_FAILURE",
      "BUSINESS_STATE_CONFLICT",
      "FRAUD_INDICATIVE_CONFLICT",
      "DATA_NOT_FOUND_RETRYABLE",
      "OPERATOR_REVIEW",
    ],
  },
  sourceEventKey: { type: String, default: null },
  chainId: { type: Number, default: null },
  contractAddress: { type: String, lowercase: true, trim: true, default: null },
  blockNumber: { type: Number, default: null },
  transactionHash: { type: String, lowercase: true, trim: true, default: null },
  logIndex: { type: Number, default: null },
  rawEventData: { type: mongoose.Schema.Types.Mixed, default: null },
  errorMessage: { type: String, required: true },
  stackTrace: { type: String, default: null },
  resolved: { type: Boolean, default: false },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  resolvedAt: { type: Date, default: null },
  replayResult: { type: String, default: null },
  resolution: { type: String, default: null },
}, { timestamps: true });

quarantineEventSchema.index({ category: 1, resolved: 1 });
quarantineEventSchema.index({ sourceEventKey: 1 });

module.exports = mongoose.models.QuarantineEvent || mongoose.model("QuarantineEvent", quarantineEventSchema);
