const router = require("express").Router();
const auth = require("../middleware/auth");
const requireVerifiedEmail = require("../middleware/requireVerifiedEmail");
const { submitReview, getReviews, getProjectReview } = require("../controllers/reviewController");

router.post("/", auth, requireVerifiedEmail, submitReview);
router.get("/project/:projectId", auth, getProjectReview);
router.get("/:userId", auth, getReviews);

module.exports = router;