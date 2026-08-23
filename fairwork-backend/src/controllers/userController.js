const User = require("../models/User");
const Project = require("../models/Project");
const Review = require("../models/Review");

/**
 * Strict https:// Protocol Sanitizer (Stored XSS Defense)
 */
function isValidHttpsUrl(urlStr) {
  if (!urlStr || typeof urlStr !== "string" || !urlStr.trim()) return true;
  try {
    const parsed = new URL(urlStr.trim());
    return parsed.protocol === "https:" && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * Host-Specific Social URL Validator (e.g., github.com, linkedin.com)
 */
function validateSocialUrl(urlStr, allowedHost) {
  if (!urlStr || typeof urlStr !== "string" || !urlStr.trim()) return true;
  try {
    const parsed = new URL(urlStr.trim());
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname === allowedHost || parsed.hostname.endsWith(`.${allowedHost}`))
    );
  } catch {
    return false;
  }
}

/**
 * Public User Profile DTO (Stripped of PII: email, password, internal fields)
 * Fast O(1) Read using pre-computed stats + Immutable Escrow Ledger Transaction Sourcing
 */
exports.getPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select(
      "firstName lastName role walletAddress bio tagline hourlyRate availability skills avatarUrl bannerUrl githubUrl linkedinUrl portfolio portfolioItems stats reputationScore totalReviews createdAt"
    );

    if (!user) {
      return res.status(404).json({ message: "User profile not found." });
    }

    // Immutable Ledger-Sourced Work History (Completed projects with escrowTxnHash)
    const completedProjects = await Project.find({
      $or: [{ clientId: id }, { freelancerId: id }],
      status: "completed",
    })
      .select("title category budget status escrowFunded escrowTxnHash milestones createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .limit(10);

    const reviews = await Review.find({ targetUserId: id })
      .populate("reviewerId", "firstName lastName avatarUrl")
      .select("rating comment createdAt")
      .sort({ createdAt: -1 })
      .limit(15);

    // Pre-computed O(1) stats fallback
    const stats = user.stats || {
      totalEarnedUSDC: 0,
      totalSpentUSDC: 0,
      completedProjectsCount: 0,
      completedMilestonesCount: 0,
      ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };

    const ratingCounts = stats.ratingCounts || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (!user.stats || Object.values(ratingCounts).reduce((a, b) => a + b, 0) === 0) {
      reviews.forEach((r) => {
        const score = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
        ratingCounts[score] = (ratingCounts[score] || 0) + 1;
      });
    }

    const workHistory = completedProjects.map((p) => ({
      id: p._id,
      title: p.title,
      category: p.category,
      budget: p.budget,
      milestonesCount: p.milestones ? p.milestones.length : 0,
      escrowTxnHash: p.escrowTxnHash || "",
      etherscanUrl: p.escrowTxnHash ? `https://sepolia.etherscan.io/tx/${p.escrowTxnHash}` : null,
      completedAt: p.updatedAt,
    }));

    res.json({
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        walletAddress: user.walletAddress,
        bio: user.bio,
        tagline: user.tagline || "",
        hourlyRate: user.hourlyRate || 0,
        availability: user.availability || "available",
        skills: user.skills || [],
        avatarUrl: user.avatarUrl,
        bannerUrl: user.bannerUrl || "",
        githubUrl: user.githubUrl,
        linkedinUrl: user.linkedinUrl,
        portfolio: user.portfolio,
        portfolioItems: user.portfolioItems || [],
        reputationScore: user.reputationScore,
        totalReviews: user.totalReviews,
        createdAt: user.createdAt,
      },
      stats: {
        totalEarnedUSDC: stats.totalEarnedUSDC || completedProjects.reduce((s, p) => s + (p.budget || 0), 0),
        totalSpentUSDC: stats.totalSpentUSDC || 0,
        completedProjectsCount: completedProjects.length,
        completedMilestonesCount: completedProjects.reduce((sum, p) => sum + (p.milestones ? p.milestones.length : 0), 0),
        ratingCounts,
      },
      workHistory,
      reviews,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch user profile." });
  }
};

/**
 * Authenticated Profile Update with Strict Host-Specific Sanitization & Array Ceilings
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      firstName,
      lastName,
      bio,
      tagline,
      hourlyRate,
      availability,
      skills,
      avatarUrl,
      bannerUrl,
      githubUrl,
      linkedinUrl,
      portfolio,
      portfolioItems,
    } = req.body;

    // Array Growth Ceiling (DoS Protection)
    if (Array.isArray(portfolioItems) && portfolioItems.length > 12) {
      return res.status(400).json({
        message: "Validation Error: portfolioItems array exceeds maximum allowed ceiling of 12 items.",
      });
    }

    // Host-Specific Social URL Validation
    if (githubUrl && !validateSocialUrl(githubUrl, "github.com")) {
      return res.status(400).json({
        message: "Validation Error: GitHub URL must strictly begin with 'https://' and belong to 'github.com'.",
      });
    }

    if (linkedinUrl && !validateSocialUrl(linkedinUrl, "linkedin.com")) {
      return res.status(400).json({
        message: "Validation Error: LinkedIn URL must strictly begin with 'https://' and belong to 'linkedin.com'.",
      });
    }

    // General URL Protocol Validation
    const genericUrls = [avatarUrl, bannerUrl, portfolio];
    if (Array.isArray(portfolioItems)) {
      portfolioItems.forEach((item) => {
        if (item) {
          genericUrls.push(item.imageUrl, item.projectUrl);
          if (item.githubUrl && !validateSocialUrl(item.githubUrl, "github.com")) {
            return res.status(400).json({
              message: "Validation Error: Portfolio GitHub URL must strictly belong to 'github.com'.",
            });
          }
        }
      });
    }

    for (const u of genericUrls) {
      if (u && !isValidHttpsUrl(u)) {
        return res.status(400).json({
          message: `Security Error: URL '${u}' must strictly begin with 'https://' and have a valid domain to prevent XSS.`,
        });
      }
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (req.body.email !== undefined) {
      const cleanEmail = String(req.body.email).toLowerCase().trim();
      if (cleanEmail && cleanEmail !== user.email) {
        const existing = await User.findOne({ email: cleanEmail, _id: { $ne: userId } });
        if (existing) {
          return res.status(409).json({ message: "Email address is already in use by another account." });
        }
        user.email = cleanEmail;
        user.isEmailVerified = user.authProvider === "google" || user.authProvider === "github";
      }
    }

    if (firstName !== undefined) user.firstName = String(firstName).trim();
    if (lastName !== undefined) user.lastName = String(lastName).trim();
    if (bio !== undefined) user.bio = String(bio).trim();
    if (tagline !== undefined) user.tagline = String(tagline).trim();
    if (hourlyRate !== undefined) user.hourlyRate = Math.max(0, Number(hourlyRate) || 0);
    if (availability !== undefined && ["available", "busy", "not_available"].includes(availability)) {
      user.availability = availability;
    }
    if (Array.isArray(skills)) user.skills = skills.map((s) => String(s).trim()).filter(Boolean);
    if (avatarUrl !== undefined) user.avatarUrl = String(avatarUrl).trim();
    if (bannerUrl !== undefined) user.bannerUrl = String(bannerUrl).trim();
    if (githubUrl !== undefined) user.githubUrl = String(githubUrl).trim();
    if (linkedinUrl !== undefined) user.linkedinUrl = String(linkedinUrl).trim();
    if (portfolio !== undefined) user.portfolio = String(portfolio).trim();

    if (Array.isArray(portfolioItems)) {
      user.portfolioItems = portfolioItems.slice(0, 12).map((item) => ({
        title: String(item.title || "").trim(),
        description: String(item.description || "").trim(),
        imageUrl: String(item.imageUrl || "").trim(),
        projectUrl: String(item.projectUrl || "").trim(),
        githubUrl: String(item.githubUrl || "").trim(),
        tags: Array.isArray(item.tags) ? item.tags.map((t) => String(t).trim()).filter(Boolean) : [],
      }));
    }

    await user.save();

    res.json({
      message: "Profile updated successfully.",
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
        bio: user.bio,
        tagline: user.tagline,
        hourlyRate: user.hourlyRate,
        availability: user.availability,
        skills: user.skills,
        avatarUrl: user.avatarUrl,
        bannerUrl: user.bannerUrl,
        githubUrl: user.githubUrl,
        linkedinUrl: user.linkedinUrl,
        portfolio: user.portfolio,
        portfolioItems: user.portfolioItems,
        stats: user.stats,
        notificationPreferences: user.notificationPreferences,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update profile." });
  }
};

/**
 * Authenticated Preferences Update
 */
exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationPreferences } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (notificationPreferences && typeof notificationPreferences === "object") {
      user.notificationPreferences = {
        ...user.notificationPreferences,
        ...notificationPreferences,
      };
    }

    await user.save();

    res.json({
      message: "Preferences updated successfully.",
      notificationPreferences: user.notificationPreferences,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update preferences." });
  }
};

/**
 * Streaming Account Data Export (GDPR / Web3 Compliance)
 */
exports.exportUserData = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });

    const projects = await Project.find({
      $or: [{ clientId: userId }, { freelancerId: userId }],
    });

    const exportData = {
      user,
      projectsCount: projects.length,
      projects,
      exportedAt: new Date().toISOString(),
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename=fairwork-user-${userId}-export.json`);
    res.json(exportData);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to export user data." });
  }
};
