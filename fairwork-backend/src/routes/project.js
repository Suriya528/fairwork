const router = require("express").Router();
const auth = require("../middleware/auth");
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

router.post("/", auth, createProject);
router.get("/", auth, getAllProjects);
router.get("/mine", auth, getMyProjects);
router.get("/:id/files", auth, getProjectDeliverables);
router.post("/:id/files", auth, upload.single("file"), uploadProjectDeliverable);
router.get("/:id/deliverables", auth, getProjectDeliverables);
router.post("/:id/deliverables", auth, upload.single("file"), uploadProjectDeliverable);
router.get("/:id/reference-files", auth, getProjectReferenceFiles);
router.post("/:id/reference-files", auth, upload.single("file"), uploadProjectReferenceFile);
router.post("/:id/milestones/:milestoneId/submit", auth, submitMilestone);
router.post("/:id/milestones/:milestoneId/request-revision", auth, requestMilestoneRevision);
router.post("/:id/milestones/:milestoneId/approve", auth, approveMilestone);
router.get("/:id", auth, getProject);
router.put("/:id/assign", auth, assignFreelancer);
router.put("/:id/complete", auth, completeProject);

module.exports = router;
