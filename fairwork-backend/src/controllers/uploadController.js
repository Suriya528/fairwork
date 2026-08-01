const cloudinary = require("../config/cloudinary");

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    // Convert buffer to base64
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "fairwork",
      resource_type: "auto",
    });

    res.json({
      url: result.secure_url,
      publicId: result.public_id,
      filename: req.file.originalname,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};