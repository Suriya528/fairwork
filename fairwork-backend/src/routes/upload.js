const router = require("express").Router();
const auth = require("../middleware/auth");
const { uploadFile } = require("../controllers/uploadController");
const upload = require("../middleware/fileUpload");

router.post("/", auth, upload.single("file"), uploadFile);

module.exports = router;
