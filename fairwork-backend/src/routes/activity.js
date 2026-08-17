const router = require("express").Router();
const auth = require("../middleware/auth");
const { getActivities, markRead } = require("../controllers/activityController");

router.get("/", auth, getActivities);
router.patch("/read", auth, markRead);
module.exports = router;
