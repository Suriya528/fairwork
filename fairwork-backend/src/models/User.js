const mongoose = require("mongoose");

const notificationPreferencesSchema = new mongoose.Schema({
  escrowDeposits: { type: Boolean, default: true },
  milestoneReleases: { type: Boolean, default: true },
  chatMessages: { type: Boolean, default: true },
  disputeAlerts: { type: Boolean, default: true },
  emailNotifications: { type: Boolean, default: true },
}, { _id: false });

const portfolioItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  imageUrl: { type: String, default: "" },
  projectUrl: { type: String, default: "" },
  githubUrl: { type: String, default: "" },
  tags: [String],
}, { _id: true });

const ratingCountsSchema = new mongoose.Schema({
  1: { type: Number, default: 0 },
  2: { type: Number, default: 0 },
  3: { type: Number, default: 0 },
  4: { type: Number, default: 0 },
  5: { type: Number, default: 0 },
}, { _id: false });

const userStatsSchema = new mongoose.Schema({
  totalEarnedUSDC: { type: Number, default: 0 },
  totalSpentUSDC: { type: Number, default: 0 },
  completedProjectsCount: { type: Number, default: 0 },
  completedMilestonesCount: { type: Number, default: 0 },
  ratingCounts: { type: ratingCountsSchema, default: () => ({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }) },
}, { _id: false });

const githubIdentitySchema = new mongoose.Schema({
  githubUserId: { type: String, default: undefined },
  username: { type: String, default: "" },
  avatarUrl: { type: String, default: "" },
  profileUrl: { type: String, default: "" },
  connectedAt: { type: Date, default: undefined },
  visibility: { type: String, enum: ["PUBLIC", "PRIVATE"], default: "PUBLIC" },
}, { _id: false });

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, default: "" },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: {
    type: String,
    required: function () {
      return this.authProvider === "local";
    },
  },
  authProvider: { type: String, enum: ["local", "google", "github"], default: "local" },
  googleId: { type: String, default: undefined },
  githubId: { type: String, default: undefined },
  isEmailVerified: {
    type: Boolean,
    default: function () {
      return this.authProvider === "google" || this.authProvider === "github";
    },
  },
  emailVerificationToken: { type: String, default: undefined },
  emailVerificationExpires: { type: Date, default: undefined },
  walletAddress: { type: String, trim: true, lowercase: true, default: undefined },
  role: { type: String, enum: ["client", "freelancer", "admin"], required: true },
  skills: [String],
  bio: { type: String, default: "" },
  tagline: { type: String, default: "" },
  hourlyRate: { type: Number, default: 0 },
  availability: { type: String, enum: ["available", "busy", "not_available"], default: "available" },
  avatarUrl: { type: String, default: "" },
  bannerUrl: { type: String, default: "" },
  githubUrl: { type: String, default: "" },
  linkedinUrl: { type: String, default: "" },
  portfolio: { type: String, default: "" },
  portfolioItems: {
    type: [portfolioItemSchema],
    validate: [val => !val || val.length <= 12, "{PATH} exceeds maximum allowed limit of 12 items"],
  },
  stats: { type: userStatsSchema, default: () => ({}) },
  notificationPreferences: { type: notificationPreferencesSchema, default: () => ({}) },
  reputationScore: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  githubIdentity: { type: githubIdentitySchema, default: null },
  isSuspended: { type: Boolean, default: false },
  suspendedAt: { type: Date },
  suspendedReason: { type: String, default: "" },
}, { timestamps: true });

userSchema.index({ walletAddress: 1 }, { unique: true, sparse: true });
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });
userSchema.index({ githubId: 1 }, { unique: true, sparse: true });
userSchema.index({ emailVerificationToken: 1 }, { sparse: true });

userSchema.pre("save", function normalizeWallet() {
  if (this.walletAddress) this.walletAddress = this.walletAddress.toLowerCase();
});

module.exports = mongoose.model("User", userSchema);
