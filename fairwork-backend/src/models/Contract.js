const mongoose = require("mongoose");

const contractSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  aiGeneratedText: { type: String, required: true },
  blockchainHash: { type: String, default: "" },
  signedByClient: { type: Boolean, default: false },
  signedByFreelancer: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Contract", contractSchema);