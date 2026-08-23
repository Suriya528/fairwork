const router = require("express").Router();
const auth = require("../middleware/auth");
const requireVerifiedEmail = require("../middleware/requireVerifiedEmail");
const { raiseDispute, voteDispute, resolveDispute, getDispute } = require("../controllers/disputeController");

router.post("/", auth, requireVerifiedEmail, raiseDispute);
router.put("/:id/vote", auth, requireVerifiedEmail, voteDispute);
router.put("/:id/resolve", auth, requireVerifiedEmail, resolveDispute);
router.get("/:projectId", auth, getDispute);

module.exports = router;