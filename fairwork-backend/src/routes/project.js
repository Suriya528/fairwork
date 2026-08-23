const router = require("express").Router();
const auth = require("../middleware/auth");
const requireVerifiedEmail = require("../middleware/requireVerifiedEmail");
const upload = require("../middleware/fileUpload");
const {
  createProject,
  getAllProjects,
  getProject,
  assignFreelancer,
  completeProject,
  getMyProjects,
  getProjectDeliverables,
  uploadProjectDeliverable,
  getProjectReferenceFiles,
  uploadProjectReferenceFile,
  submitMilestone,
  requestMilestoneRevision,
  approveMilestone,
} = require("../controllers/projectController");

router.post("/", auth, requireVerifiedEmail, createProject);
router.get("/", auth, getAllProjects);
router.get("/mine", auth, getMyProjects);
router.get("/:id/files", auth, getProjectDeliverables);
router.post("/:id/files", auth, requireVerifiedEmail, upload.single("file"), uploadProjectDeliverable);
router.get("/:id/deliverables", auth, getProjectDeliverables);
router.post("/:id/deliverables", auth, requireVerifiedEmail, upload.single("file"), uploadProjectDeliverable);
router.get("/:id/reference-files", auth, getProjectReferenceFiles);
router.post("/:id/reference-files", auth, requireVerifiedEmail, upload.single("file"), uploadProjectReferenceFile);
router.post("/:id/milestones/:milestoneId/submit", auth, requireVerifiedEmail, submitMilestone);
router.post("/:id/milestones/:milestoneId/request-revision", auth, requireVerifiedEmail, requestMilestoneRevision);
router.post("/:id/milestones/:milestoneId/approve", auth, requireVerifiedEmail, approveMilestone);
router.get("/:id", auth, getProject);
router.put("/:id/assign", auth, requireVerifiedEmail, assignFreelancer);
router.put("/:id/complete", auth, requireVerifiedEmail, completeProject);

module.exports = router;
