const cloudinary = require("../config/cloudinary");

async function uploadToCloudinary(file) {
  const b64 = Buffer.from(file.buffer).toString("base64");
  const dataURI = `data:${file.mimetype};base64,${b64}`;

  return cloudinary.uploader.upload(dataURI, {
    folder: "fairwork",
    resource_type: "auto",
  });
}

module.exports = { uploadToCloudinary };
