const express = require("express");
const router = express.Router();
const applicationController = require("../controllers/applicationController");
const auth = require("../middleware/auth");

router.post("/", auth, applicationController.createApplication);
router.get("/mine", auth, applicationController.getMyApplications);
router.get("/project/:projectId", auth, applicationController.getProjectApplications);
router.post("/:id/accept", auth, applicationController.acceptApplication);
router.post("/:id/reject", auth, applicationController.rejectApplication);
router.post("/:id/withdraw", auth, applicationController.withdrawApplication);

module.exports = router;
