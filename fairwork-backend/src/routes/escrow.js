const router = require("express").Router();
const auth = require("../middleware/auth");
const requireVerifiedEmail = require("../middleware/requireVerifiedEmail");
const { depositEscrow, releaseEscrow } = require("../controllers/escrowController");

router.post("/deposit", auth, requireVerifiedEmail, depositEscrow);
router.post("/release", auth, requireVerifiedEmail, releaseEscrow);

module.exports = router;