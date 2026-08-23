const Review = require("../models/Review");
const User = require("../models/User");

exports.submitReview = async (req, res) => {
  try {
    const { projectId, revieweeId, rating, comment } = req.body;

    const existing = await Review.findOne({ projectId, reviewerId: req.user.id });
    if (existing) return res.status(400).json({ message: "Already reviewed" });

    const review = await Review.create({
      projectId,
      reviewerId: req.user.id,
      revieweeId,
      rating,
      comment,
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
    res.status(500).json({ message: err.message });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ revieweeId: req.params.userId })
      .populate("reviewerId", "firstName lastName avatarUrl");
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};