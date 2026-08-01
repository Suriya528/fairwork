const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  walletAddress: { type: String, default: "" },
  role: { type: String, enum: ["client", "freelancer"], required: true },
  skills: [String],
  bio: { type: String, default: "" },
  avatarUrl: { type: String, default: "" },
  reputationScore: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);