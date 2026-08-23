const express = require("express");
const router = express.Router();
const applicationController = require("../controllers/applicationController");
const auth = require("../middleware/auth");
const requireVerifiedEmail = require("../middleware/requireVerifiedEmail");

router.post("/", auth, requireVerifiedEmail, applicationController.createApplication);
router.get("/mine", auth, applicationController.getMyApplications);
router.get("/project/:projectId", auth, applicationController.getProjectApplications);
router.post("/:id/accept", auth, requireVerifiedEmail, applicationController.acceptApplication);
router.post("/:id/reject", auth, requireVerifiedEmail, applicationController.rejectApplication);
router.post("/:id/withdraw", auth, requireVerifiedEmail, applicationController.withdrawApplication);

module.exports = router;
