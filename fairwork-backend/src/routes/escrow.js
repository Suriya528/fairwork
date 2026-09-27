const router = require("express").Router();
const auth = require("../middleware/auth");
const requireVerifiedEmail = require("../middleware/requireVerifiedEmail");
const { escrowRateLimiter } = require("../middleware/authRateLimiter");
const { depositEscrow, releaseEscrow } = require("../controllers/escrowController");

router.post("/deposit", auth({ bypassCache: true }), requireVerifiedEmail, escrowRateLimiter, depositEscrow);
router.post("/release", auth({ bypassCache: true }), requireVerifiedEmail, escrowRateLimiter, releaseEscrow);

module.exports = router;