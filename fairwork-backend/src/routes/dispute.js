const router = require("express").Router();
const auth = require("../middleware/auth");
const { raiseDispute, voteDispute, resolveDispute, getDispute } = require("../controllers/disputeController");

router.post("/", auth, raiseDispute);
router.put("/:id/vote", auth, voteDispute);
router.put("/:id/resolve", auth, resolveDispute);
router.get("/:projectId", auth, getDispute);

module.exports = router;