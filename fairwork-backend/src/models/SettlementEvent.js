const mongoose = require("mongoose");

const settlementEventSchema = new mongoose.Schema(
  {
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
  },
  { timestamps: true }
);

settlementEventSchema.index(
  { chainId: 1, contractAddress: 1, transactionHash: 1, logIndex: 1 },
  { unique: true }
);

module.exports = mongoose.models.SettlementEvent || mongoose.model("SettlementEvent", settlementEventSchema);
