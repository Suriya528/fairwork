const router = require("express").Router();
const auth = require("../middleware/auth");
const { submitReview, getReviews } = require("../controllers/reviewController");

router.post("/", auth, submitReview);
router.get("/:userId", auth, getReviews);

module.exports = router;