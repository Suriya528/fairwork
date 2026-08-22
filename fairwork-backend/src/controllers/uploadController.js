const { uploadToCloudinary } = require("../services/cloudinaryUpload");

/**
 * Standard File Upload Handler
 */
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const result = await uploadToCloudinary(req.file);

    res.json({
      url: result.secure_url,
      publicId: result.public_id,
      filename: req.file.originalname,
      size: req.file.size || 0,
      mimeType: req.file.mimetype || "",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Presigned Upload Protocol (Direct-to-Storage with 10MB & MIME-type checks)
 */
exports.getPresignedUrl = async (req, res) => {
  try {
    const { filename, mimeType, size } = req.body;
    if (!filename || !mimeType) {
      return res.status(400).json({ message: "Filename and mimeType are required." });
    }

    const maxSizeBytes = 10 * 1024 * 1024; // 10MB limit
    if (size && Number(size) > maxSizeBytes) {
      return res.status(400).json({ message: "File size exceeds maximum allowed limit of 10MB." });
    }

    const allowedMimePrefixes = ["image/", "application/pdf", "text/", "application/zip", "application/x-zip-compressed"];
    const isAllowed = allowedMimePrefixes.some((p) => mimeType.startsWith(p) || mimeType === p);

    if (!isAllowed) {
      return res.status(400).json({ message: `MIME type '${mimeType}' is not allowed.` });
    }

    const key = `user_${req.user.id}/${Date.now()}_${filename.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;

    res.json({
      presignedUrl: `${process.env.VITE_API_URL || "http://localhost:5000/api"}/upload/direct`,
      key,
      uploadFields: {
        key,
        "Content-Type": mimeType,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to generate presigned upload URL." });
  }
};
