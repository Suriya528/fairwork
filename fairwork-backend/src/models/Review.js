const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  revieweeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: "" },
  blockchainTxn: { type: String, default: "" },
}, { timestamps: true });

// Database-level compound unique index to prevent duplicate reviews
reviewSchema.index({ projectId: 1, reviewerId: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);