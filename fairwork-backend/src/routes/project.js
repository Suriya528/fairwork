const router = require("express").Router();
const auth = require("../middleware/auth");
const {
  createProject,
  getAllProjects,
  getProject,
  assignFreelancer,
  completeProject,
  getMyProjects,
} = require("../controllers/projectController");

router.post("/", auth, createProject);
router.get("/", auth, getAllProjects);
router.get("/mine", auth, getMyProjects);
router.get("/:id", auth, getProject);
router.put("/:id/assign", auth, assignFreelancer);
router.put("/:id/complete", auth, completeProject);

module.exports = router;