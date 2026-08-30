const Project = require("../models/Project");
const Review = require("../models/Review");
const User = require("../models/User");

exports.getFreelancerAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    const projects = await Project.find({ freelancerId: userId });
    const completed = projects.filter(p => p.status === "completed");
    const disputed = projects.filter(p => p.status === "disputed");

    const totalEarnings = completed.reduce((sum, p) => sum + p.budget, 0);
    const successRate = projects.length > 0
      ? Math.round((completed.length / projects.length) * 100)
      : 0;

    const reviews = await Review.find({ revieweeId: userId });
    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

    // Monthly earnings last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await Project.aggregate([
      {
        $match: {
          freelancerId: userId,
          status: "completed",
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          earnings: { $sum: "$budget" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      totalProjects: projects.length,
      completedProjects: completed.length,
      disputedProjects: disputed.length,
      totalEarnings,
      successRate,
      avgRating,
      totalReviews: reviews.length,
      monthlyData,
    });
  } catch (err) {
    console.error("[AnalyticsController] error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getClientAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    const projects = await Project.find({ clientId: userId });
    const completed = projects.filter(p => p.status === "completed");

    const totalSpent = completed.reduce((sum, p) => sum + p.budget, 0);
    const successRate = projects.length > 0
      ? Math.round((completed.length / projects.length) * 100)
      : 0;

    const monthlyData = await Project.aggregate([
      {
        $match: {
          clientId: userId,
          status: "completed",
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          spent: { $sum: "$budget" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      totalProjects: projects.length,
      completedProjects: completed.length,
      totalSpent,
      successRate,
      monthlyData,
    });
  } catch (err) {
    console.error("[AnalyticsController] error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};