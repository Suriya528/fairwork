const router = require("express").Router();
const auth = require("../middleware/auth");
const requireVerifiedEmail = require("../middleware/requireVerifiedEmail");
const { generateContract, getContract, signContract } = require("../controllers/contractController");

router.post("/generate", auth, requireVerifiedEmail, generateContract);
router.get("/:id", auth, getContract);
router.put("/:id/sign", auth, requireVerifiedEmail, signContract);

module.exports = router;