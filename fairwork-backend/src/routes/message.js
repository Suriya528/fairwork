const router = require("express").Router();
const auth = require("../middleware/auth");
const { getMessages, sendMessage, markRead } = require("../controllers/messageController");

router.get("/:projectId", auth, getMessages);
router.post("/", auth, sendMessage);
router.put("/:projectId/read", auth, markRead);

module.exports = router;