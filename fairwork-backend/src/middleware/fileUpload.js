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
const dangerousExtensionsRegex = /\.(exe|bat|cmd|sh|php|pl|cgi|vbs|jar|msi|dll|scr|pif|com|reg|ps1|py|rb|js|mjs)$/i;

module.exports = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB safety limit
  fileFilter: (req, file, cb) => {
    if (dangerousExtensionsRegex.test(file.originalname)) {
      return cb(new Error("EXECUTABLE_UPLOAD_REJECTED: Executable files are strictly prohibited."));
    }
    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensionsRegex.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed. Please upload a valid document, image, design, archive, or video deliverable."));
    }
  },
});
