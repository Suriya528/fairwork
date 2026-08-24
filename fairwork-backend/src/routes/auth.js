const router = require("express").Router();
const {
  register,
  login,
  getMe,
  verifyEmail,
  resendVerificationEmail,
  updateWallet,
  walletNonce,
  verifyWallet,
} = require("../controllers/authController");
const {
  initiateGoogleAuth,
  handleGoogleCallback,
  initiateGithubAuth,
  handleGithubCallback,
  exchangeOAuthCode,
  completeOAuthRoleSelection,
} = require("../controllers/oauthController");
const auth = require("../middleware/auth");
const { authRateLimiter, registerRateLimiter } = require("../middleware/authRateLimiter");

router.post("/register", registerRateLimiter, register);
router.post("/login", authRateLimiter, login);
router.get("/me", auth, getMe);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);
router.put("/wallet", auth, updateWallet);
router.post("/wallet/nonce", auth, walletNonce);
router.post("/wallet/verify", auth, verifyWallet);

// Google & GitHub OAuth Routes
router.get("/google", initiateGoogleAuth);
router.get("/google/callback", handleGoogleCallback);
router.get("/github", initiateGithubAuth);
router.get("/github/callback", handleGithubCallback);
router.post("/oauth/exchange", exchangeOAuthCode);
router.post("/oauth/select-role", completeOAuthRoleSelection);

module.exports = router;
