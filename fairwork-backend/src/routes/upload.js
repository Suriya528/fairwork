const router = require("express").Router();
const auth = require("../middleware/auth");
const requireVerifiedEmail = require("../middleware/requireVerifiedEmail");
const { uploadFile, getPresignedUrl } = require("../controllers/uploadController");
const upload = require("../middleware/fileUpload");

router.post("/", auth, requireVerifiedEmail, upload.single("file"), uploadFile);
router.post("/presigned-url", auth, requireVerifiedEmail, getPresignedUrl);

module.exports = router;
