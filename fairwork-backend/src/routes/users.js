const router = require("express").Router();
const auth = require("../middleware/auth");
const { getPublicProfile, updateProfile, updatePreferences, exportUserData, claimMockUsdc } = require("../controllers/userController");

router.get("/profile/:id", getPublicProfile);
router.put("/profile", auth, updateProfile);
router.put("/preferences", auth, updatePreferences);
router.get("/export", auth, exportUserData);
router.post("/claim-mock-usdc", auth, claimMockUsdc);

module.exports = router;
