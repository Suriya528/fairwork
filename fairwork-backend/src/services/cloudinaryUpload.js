const cloudinary = require("../config/cloudinary");

/**
 * Uploads file to Cloudinary with automatic CDN WebP transcoding, deterministic key overwrite, and edge cache invalidation.
 */
async function uploadToCloudinary(file, type = "file", userId = null) {
  const b64 = Buffer.from(file.buffer).toString("base64");
  const dataURI = `data:${file.mimetype};base64,${b64}`;

  // Image Transcoding & Compression Options (LCP & Web Vitals Optimization)
  let transformation = [];

  if (type === "avatar") {
    transformation = [
      { width: 400, height: 400, crop: "fill", gravity: "face" },
      { fetch_format: "webp", quality: "auto:good" },
    ];
  } else if (type === "banner") {
    transformation = [
      { width: 1920, height: 480, crop: "fill" },
      { fetch_format: "webp", quality: "auto:good" },
    ];
  }

  const uploadOptions = {
    folder: "fairwork",
    resource_type: "auto",
    transformation,
  };

  // Deterministic Key Overwrite & CDN Invalidation to prevent orphaned assets and stale CDN caches
  if ((type === "avatar" || type === "banner") && userId) {
    uploadOptions.public_id = `${type}_${userId}`;
    uploadOptions.overwrite = true;
    uploadOptions.invalidate = true;
  }

  return cloudinary.uploader.upload(dataURI, uploadOptions);
}

module.exports = { uploadToCloudinary };
