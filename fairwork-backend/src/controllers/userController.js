const User = require("../models/User");
const Project = require("../models/Project");
const Review = require("../models/Review");

/**
 * Public User Profile DTO (Stripped of PII: email, password, internal fields)
 */
exports.getPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select(
      "firstName lastName role walletAddress bio skills avatarUrl githubUrl linkedinUrl portfolio reputationScore totalReviews createdAt"
    );

    if (!user) {
      return res.status(404).json({ message: "User profile not found." });
    }

    // Fetch user's completed projects for verified reputation
    const completedProjects = await Project.find({
      $or: [{ clientId: id }, { freelancerId: id }],
      status: "completed",
    })
      .select("title category budget createdAt updatedAt")
      .limit(10);

    const reviews = await Review.find({ targetUserId: id })
      .populate("reviewerId", "firstName lastName avatarUrl")
      .select("rating comment createdAt")
      .limit(10);

    res.json({
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        walletAddress: user.walletAddress,
        bio: user.bio,
        skills: user.skills,
        avatarUrl: user.avatarUrl,
        githubUrl: user.githubUrl,
        linkedinUrl: user.linkedinUrl,
        portfolio: user.portfolio,
        reputationScore: user.reputationScore,
        totalReviews: user.totalReviews,
        createdAt: user.createdAt,
      },
      completedProjectsCount: completedProjects.length,
      reviews,
      verifiedMilestonesCompleted: completedProjects.reduce(
        (sum, p) => sum + (p.milestones ? p.milestones.length : 0),
        0
      ),
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch user profile." });
  }
};

/**
 * Authenticated Profile Update
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, bio, skills, avatarUrl, githubUrl, linkedinUrl, portfolio } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (firstName !== undefined) user.firstName = String(firstName).trim();
    if (lastName !== undefined) user.lastName = String(lastName).trim();
    if (bio !== undefined) user.bio = String(bio).trim();
    if (Array.isArray(skills)) user.skills = skills.map((s) => String(s).trim());
    if (avatarUrl !== undefined) user.avatarUrl = String(avatarUrl).trim();
    if (githubUrl !== undefined) user.githubUrl = String(githubUrl).trim();
    if (linkedinUrl !== undefined) user.linkedinUrl = String(linkedinUrl).trim();
    if (portfolio !== undefined) user.portfolio = String(portfolio).trim();

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
        skills: user.skills,
        avatarUrl: user.avatarUrl,
        githubUrl: user.githubUrl,
        linkedinUrl: user.linkedinUrl,
        portfolio: user.portfolio,
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
