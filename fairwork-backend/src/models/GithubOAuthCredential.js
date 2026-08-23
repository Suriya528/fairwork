const mongoose = require("mongoose");

const githubOAuthCredentialSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  githubUserId: { type: String, required: true, unique: true },
  encryptedAccessToken: {
    version: { type: Number, default: 1 },
    keyId: { type: String, default: "hkdf-sha256-v1" },
    iv: { type: String, required: true },
    ciphertext: { type: String, required: true },
    authTag: { type: String, required: true },
  },
  scopes: [String],
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.models.GithubOAuthCredential || mongoose.model("GithubOAuthCredential", githubOAuthCredentialSchema);
