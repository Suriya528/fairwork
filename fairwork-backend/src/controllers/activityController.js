const Activity = require("../models/Activity");

exports.getActivities = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const [activities, total] = await Promise.all([
      Activity.find({ userId: req.user.id }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Activity.countDocuments({ userId: req.user.id }),
    ]);
    res.json({ activities, pagination: { page, limit, total, hasMore: page * limit < total } });
  } catch (err) {
    res.status(500).json({ message: "Unable to load activity" });
  }
};

exports.markRead = async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter((id) => typeof id === "string") : [];
    const filter = { userId: req.user.id, ...(ids.length ? { _id: { $in: ids } } : {}) };
    const result = await Activity.updateMany(filter, { $set: { read: true } });
    res.json({ updated: result.modifiedCount });
  } catch (err) {
    res.status(400).json({ message: "Unable to update activity" });
  }
};
