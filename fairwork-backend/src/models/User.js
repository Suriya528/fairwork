const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  walletAddress: { type: String, trim: true, lowercase: true, default: undefined },
  role: { type: String, enum: ["client", "freelancer", "admin"], required: true },
  skills: [String],
  bio: { type: String, default: "" },
  avatarUrl: { type: String, default: "" },
  reputationScore: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  isSuspended: { type: Boolean, default: false },
  suspendedAt: { type: Date },
  suspendedReason: { type: String, default: "" },
}, { timestamps: true });

userSchema.index({ walletAddress: 1 }, { unique: true, sparse: true });
userSchema.pre("save", function normalizeWallet() {
  if (this.walletAddress) this.walletAddress = this.walletAddress.toLowerCase();
});

module.exports = mongoose.model("User", userSchema);
