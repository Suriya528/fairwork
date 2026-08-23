const router = require("express").Router();
const auth = require("../middleware/auth");
const requireVerifiedEmail = require("../middleware/requireVerifiedEmail");
const { getMessages, sendMessage, markRead, getEscrowSnapshotEndpoint } = require("../controllers/messageController");

router.get("/:projectId", auth, getMessages);
router.get("/:projectId/snapshot", auth, getEscrowSnapshotEndpoint);
router.post("/", auth, requireVerifiedEmail, sendMessage);
router.put("/:projectId/read", auth, markRead);

module.exports = router;