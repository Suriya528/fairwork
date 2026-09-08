const Review = require("../models/Review");
const User = require("../models/User");
const Project = require("../models/Project");

exports.submitReview = async (req, res) => {
  try {
    const { projectId, revieweeId, rating, comment } = req.body;

    if (!projectId || !revieweeId || rating === undefined) {
      return res.status(400).json({ message: "projectId, revieweeId, and rating are required." });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5." });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    if (project.status !== "completed") {
      return res.status(400).json({ message: "Reviews can only be submitted for completed projects." });
    }

    const isClient = String(project.clientId) === String(req.user.id);
    const isFreelancer = String(project.freelancerId) === String(req.user.id);

    if (!isClient && !isFreelancer) {
      return res.status(403).json({ message: "Only project participants can submit reviews." });
    }

    const expectedReviewee = isClient ? String(project.freelancerId) : String(project.clientId);
    if (String(revieweeId) !== expectedReviewee) {
      return res.status(400).json({ message: "You can only review your project counterparty." });
    }

    const existing = await Review.findOne({ projectId, reviewerId: req.user.id });
    if (existing) return res.status(400).json({ message: "Already reviewed" });

    const review = await Review.create({
      projectId,
      reviewerId: req.user.id,
      revieweeId,
      rating: Math.round(numRating),
      comment: String(comment || "").trim(),
    });

    const reviews = await Review.find({ revieweeId });
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const score = Math.min(5, Math.max(1, Math.round(rating || 5)));
    const incField = `stats.ratingCounts.${score}`;

    await User.findByIdAndUpdate(revieweeId, {
      reputationScore: Math.round(avg * 10) / 10,
      totalReviews: reviews.length,
      $inc: { [incField]: 1 },
    });

    res.status(201).json(review);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Already reviewed" });
    }
    console.error("[ReviewController] error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ revieweeId: req.params.userId })
      .populate("reviewerId", "firstName lastName avatarUrl");
    res.json(reviews);
  } catch (err) {
    console.error("[ReviewController] error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};