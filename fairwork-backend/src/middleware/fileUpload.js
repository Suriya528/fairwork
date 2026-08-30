const multer = require("multer");

const allowedMimeTypes = [
  // Images
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/svg+xml",
  "image/webp",
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "application/json",
  // Spreadsheets & Data
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  // Archives & Binaries
  "application/zip",
  "application/x-zip-compressed",
  "application/x-tar",
  "application/gzip",
  "application/x-7z-compressed",
  "application/x-rar-compressed",
  // Media
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "audio/mpeg",
  "audio/wav",
];

const allowedExtensionsRegex = /\.(zip|tar|gz|7z|rar|pdf|docx?|xlsx?|csv|png|jpe?g|webp|gif|svg|mp4|mov|webm|txt|md|json|apk|aab|fig|psd|ai|step|stl|obj|fbx)$/i;

module.exports = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensionsRegex.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed. Please upload a valid document, image, design, archive, or video deliverable."));
    }
  },
});
