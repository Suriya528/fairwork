const mongoose = require("mongoose");

const oauthCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  nonce: { type: String, required: true },
  pendingOAuth: { type: Object, default: null },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });

module.exports = mongoose.models.OAuthCode || mongoose.model("OAuthCode", oauthCodeSchema);
