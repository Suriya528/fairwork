const mongoose = require("mongoose");

const blockCheckpointSchema = new mongoose.Schema({
  blockNumber: { type: Number, required: true, min: 0 },
  blockHash: { type: String, required: true, lowercase: true, trim: true, match: /^0x[a-f0-9]{64}$/ },
  parentHash: { type: String, required: true, lowercase: true, trim: true, match: /^0x[a-f0-9]{64}$/ },
  chainId: { type: Number, required: true, min: 1 },
  contractAddress: { type: String, required: true, lowercase: true, trim: true, match: /^0x[a-f0-9]{40}$/ },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

blockCheckpointSchema.index(
  { chainId: 1, contractAddress: 1, blockNumber: 1 },
  { unique: true }
);

blockCheckpointSchema.index({ chainId: 1, contractAddress: 1, blockNumber: -1 });

module.exports = mongoose.models.BlockCheckpoint || mongoose.model("BlockCheckpoint", blockCheckpointSchema);
