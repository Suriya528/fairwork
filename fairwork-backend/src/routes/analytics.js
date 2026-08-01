const router = require("express").Router();
const auth = require("../middleware/auth");
const { getFreelancerAnalytics, getClientAnalytics } = require("../controllers/analyticsController");

router.get("/freelancer", auth, getFreelancerAnalytics);
router.get("/client", auth, getClientAnalytics);

module.exports = router;