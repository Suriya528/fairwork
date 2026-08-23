const mongoose = require("mongoose");

const githubActivityCacheSchema = new mongoose.Schema({
  githubUserId: { type: String, required: true, unique: true },
  contributionCalendar: { type: Object, required: true },
  topLanguages: [{ name: String, color: String, percentage: Number }],
  topRepositories: [{ name: String, description: String, stars: Number, forks: Number, url: String, language: String }],
  longestStreak: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  totalContributionsYear: { type: Number, default: 0 },
  fetchedAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true, index: true },
  retentionExpiresAt: { type: Date, required: true, index: { expires: 0 } },
  lastError: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.models.GithubActivityCache || mongoose.model("GithubActivityCache", githubActivityCacheSchema);
