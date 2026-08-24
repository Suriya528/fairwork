const mongoose = require("mongoose");

const blockchainSyncStateSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  lastProcessedBlock: { type: Number, required: true, default: 0 },
  lastProcessedBlockHash: { type: String, default: null },
  leaseOwner: { type: String, default: null },
  leaseGeneration: { type: Number, default: 0, min: 0 },
  leaseExpiresAt: { type: Date, default: () => new Date(0) },
  lastFenceGeneration: { type: Number, default: 0, min: 0 },
  chainId: { type: Number, default: null },
  contractAddress: { type: String, lowercase: true, trim: true, default: null },
}, { timestamps: true });

module.exports = mongoose.models.BlockchainSyncState || mongoose.model("BlockchainSyncState", blockchainSyncStateSchema);
