const mongoose = require("mongoose");

const settlementEventSchema = new mongoose.Schema(
  {
    sourceEventKey: { type: String, required: true, unique: true },
    chainId: { type: Number, required: true, min: 1 },
    contractAddress: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: /^0x[a-f0-9]{40}$/,
    },
    transactionHash: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: /^0x[a-f0-9]{64}$/,
    },
    logIndex: { type: Number, required: true, min: 0 },
    blockNumber: { type: Number, required: true, min: 0 },
    blockHash: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: /^0x[a-f0-9]{64}$/,
    },
    eventName: { type: String, required: true, enum: ["MilestoneReleased", "EscrowFunded"] },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    milestoneIndex: { type: Number, required: true, min: 0 },
    freelancerAddress: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: /^0x[a-f0-9]{40}$/,
    },
    tokenAddress: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: /^0x[a-f0-9]{40}$/,
    },
    amountUnits: {
      type: String,
      required: true,
      match: /^[0-9]+$/,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "ORPHANED_REORG"],
      default: "ACTIVE",
    },
    notificationClaimToken: { type: String, default: null },
  },
  { timestamps: true }
);

settlementEventSchema.index(
  { chainId: 1, contractAddress: 1, transactionHash: 1, logIndex: 1 },
  { unique: true }
);

settlementEventSchema.index(
  { chainId: 1, contractAddress: 1, projectId: 1, milestoneIndex: 1 },
  { unique: true, partialFilterExpression: { status: "ACTIVE" } }
);

module.exports = mongoose.models.SettlementEvent || mongoose.model("SettlementEvent", settlementEventSchema);
