const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    proposalText: { type: String, required: true },
    proposedAmount: { type: Number, required: true },
    estimatedDelivery: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "withdrawn"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Compound index: A freelancer can have at most one active application per project
applicationSchema.index({ projectId: 1, freelancerId: 1 }, { unique: true });

module.exports = mongoose.model("Application", applicationSchema);
