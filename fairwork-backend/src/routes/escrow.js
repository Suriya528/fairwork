const router = require("express").Router();
const auth = require("../middleware/auth");
const { depositEscrow, releaseEscrow } = require("../controllers/escrowController");

router.post("/deposit", auth, depositEscrow);
router.post("/release", auth, releaseEscrow);

module.exports = router;