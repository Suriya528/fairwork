const router = require("express").Router();
const auth = require("../middleware/auth");
const { generateContract, getContract, signContract } = require("../controllers/contractController");

router.post("/generate", auth, generateContract);
router.get("/:id", auth, getContract);
router.put("/:id/sign", auth, signContract);

module.exports = router;