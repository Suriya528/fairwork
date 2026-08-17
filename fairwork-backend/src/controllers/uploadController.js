const { uploadToCloudinary } = require("../services/cloudinaryUpload");

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const result = await uploadToCloudinary(req.file);

    res.json({
      url: result.secure_url,
      publicId: result.public_id,
      filename: req.file.originalname,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
