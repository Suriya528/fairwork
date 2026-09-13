const router = require("express").Router();
const auth = require("../middleware/auth");
const requireVerifiedEmail = require("../middleware/requireVerifiedEmail");
const { depositEscrow, releaseEscrow } = require("../controllers/escrowController");

router.post("/deposit", auth({ bypassCache: true }), requireVerifiedEmail, depositEscrow);
router.post("/release", auth({ bypassCache: true }), requireVerifiedEmail, releaseEscrow);

module.exports = router;