const mongoose = require("mongoose");
const schema = new mongoose.Schema({ key: { type: String, unique: true }, lastProcessedBlock: { type: Number, required: true } }, { timestamps: true });
module.exports = mongoose.model("BlockchainSyncState", schema);
