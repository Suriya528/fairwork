const router = require("express").Router();
const auth = require("../middleware/auth");
const { uploadFile, getPresignedUrl } = require("../controllers/uploadController");
const upload = require("../middleware/fileUpload");

router.post("/", auth, upload.single("file"), uploadFile);
router.post("/presigned-url", auth, getPresignedUrl);

module.exports = router;
