const router = require("express").Router();
const { register, login, getMe, updateWallet, walletNonce, verifyWallet } = require("../controllers/authController");
const auth = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.get("/me", auth, getMe);
router.put("/wallet", auth, updateWallet);
router.post("/wallet/nonce", auth, walletNonce);
router.post("/wallet/verify", auth, verifyWallet);

module.exports = router;
