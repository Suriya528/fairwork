const mongoose = require("mongoose");

const milestoneSchema = new mongoose.Schema({
  title: String,
  amount: { type: mongoose.Schema.Types.Decimal128, required: true },
  status: {
    type: String,
    enum: ["pending", "in_progress", "submitted", "revision_requested", "completed"],
    default: "pending",
  },
  paymentReleased: { type: Boolean, default: false },
  settlementEventId: { type: mongoose.Schema.Types.ObjectId, ref: "SettlementEvent", default: null },
  submissionNotes: { type: String, default: "" },
  submittedAt: { type: Date },
  revisionNotes: { type: String, default: "" },
  revisionRequestedAt: { type: Date },
  dueDate: { type: Date },
});

const referenceFileSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  url: { type: String, required: true },
  publicId: { type: String, default: "" },
  mimeType: { type: String, default: "" },
  size: { type: Number, default: 0 },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  uploadedAt: { type: Date, default: Date.now },
}, { _id: true });

const deliverableSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  url: { type: String, required: true },
  publicId: { type: String, default: "" },
  mimeType: { type: String, default: "" },
  size: { type: Number, default: 0 },
  milestoneId: { type: mongoose.Schema.Types.ObjectId, default: null },
  submissionNotes: { type: String, default: "" },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  uploadedAt: { type: Date, default: Date.now },
}, { _id: true });

const settlementSnapshotSchema = new mongoose.Schema({
  tokenAddress: { type: String, trim: true, lowercase: true, default: undefined },
  tokenDecimals: { type: Number, default: undefined },
  fxRate: { type: mongoose.Schema.Types.Decimal128, default: undefined },
  fxRateSource: { type: String, default: undefined },
  fxRateTimestamp: { type: Date, default: undefined },
  fxRoundingPolicy: { type: String, enum: ["EXACT", "ROUND_DOWN"], default: "EXACT" },
  expectedTotalUnits: { type: String, default: undefined },
  expectedMilestoneUnits: [{ type: String }],
  fundingLockedAt: { type: Date, default: null },
}, { _id: false });

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, default: "Web Development" },
  customCategory: { type: String, default: "" },
  budget: { type: mongoose.Schema.Types.Decimal128, required: true },
  currency: { type: String, enum: ["USD", "INR"], required: true, default: "USD" },
  milestones: [milestoneSchema],
  settlement: { type: settlementSnapshotSchema, default: () => ({}) },
  referenceFiles: { type: [referenceFileSchema], default: [] },
  deliverables: { type: [deliverableSchema], default: [] },
  status: {
    type: String,
    enum: ["open", "in_progress", "completed", "disputed", "cancelled", "refunded"],
    default: "open",
  },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  clientWalletAddress: { type: String, trim: true, lowercase: true, default: undefined },
  freelancerWalletAddress: { type: String, trim: true, lowercase: true, default: undefined },
  escrowTxnHash: { type: String, default: "" },
  escrowFunded: { type: Boolean, default: false },
  escrowCompleted: { type: Boolean, default: false },
  escrowDisputed: { type: Boolean, default: false },
  escrowToken: { type: String, default: "" },
  contractId: { type: mongoose.Schema.Types.ObjectId, ref: "Contract" },
  deadlineAt: { type: Date },
  durationDays: { type: Number },
  deadlineMode: { type: String, enum: ["duration", "exact"], default: "duration" },
}, { timestamps: true });

projectSchema.index({ clientId: 1, status: 1 });
projectSchema.index({ freelancerId: 1, status: 1 });
projectSchema.index({ status: 1, createdAt: -1 });

// Pre-save hook for document.save(): defense-in-depth against direct .save() mutations
projectSchema.pre("save", function(next) {
  if (this.isModified("settlement") && !this.isNew) {
    if (this.settlement?.fundingLockedAt) {
      return next(new Error("SETTLEMENT_SNAPSHOT_IMMUTABLE: Cannot modify locked settlement snapshot"));
    }
  }
  next();
});

// Pre-update hooks for updateOne, findOneAndUpdate, updateMany query operations
function checkQuerySettlementImmutability(next) {
  const update = this.getUpdate();
  if (!update) return next();

  const isMutatingSettlement =
    (update.$set && (update.$set.settlement || Object.keys(update.$set).some((k) => k.startsWith("settlement.")))) ||
    (update.$unset && (update.$unset.settlement || Object.keys(update.$unset).some((k) => k.startsWith("settlement.")))) ||
    (update.$push && Object.keys(update.$push).some((k) => k.startsWith("settlement.")));

  // Exception: lockSettlementSnapshot explicitly sets settlement.fundingLockedAt when fundingLockedAt is null
  const isLockingOperation =
    update.$set &&
    Object.keys(update.$set).length === 1 &&
    update.$set["settlement.fundingLockedAt"] instanceof Date;

  if (isMutatingSettlement && !isLockingOperation) {
    // Inject guard condition into update query: only allow if fundingLockedAt is null
    this.where({ "settlement.fundingLockedAt": null });
  }

  next();
}

projectSchema.pre("updateOne", checkQuerySettlementImmutability);
projectSchema.pre("findOneAndUpdate", checkQuerySettlementImmutability);
projectSchema.pre("updateMany", checkQuerySettlementImmutability);

module.exports = mongoose.models.Project || mongoose.model("Project", projectSchema);
