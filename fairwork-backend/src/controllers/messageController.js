const Message = require("../models/Message");

exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ projectId: req.params.projectId })
      .populate("senderId", "firstName lastName avatarUrl")
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { projectId, content, fileUrl } = req.body;
    const message = await Message.create({
      projectId,
      senderId: req.user.id,
      content,
      fileUrl,
    });
    const populated = await message.populate("senderId", "firstName lastName avatarUrl");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    await Message.updateMany(
      { projectId: req.params.projectId, senderId: { $ne: req.user.id } },
      { read: true }
    );
    res.json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};