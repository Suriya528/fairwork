const mongoose = require("mongoose");

const contractSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    aiGeneratedText: { type: String, required: true },
    blockchainHash: { type: String, default: "" },
    signedByClient: { type: Boolean, default: false },
    clientSignedAt: { type: Date },
    signedByFreelancer: { type: Boolean, default: false },
    freelancerSignedAt: { type: Date },
  },
  { timestamps: true }
);

contractSchema.index({ projectId: 1 });
contractSchema.index({ clientId: 1 });

module.exports = mongoose.model("Contract", contractSchema);