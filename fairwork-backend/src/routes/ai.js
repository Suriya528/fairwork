const router = require("express").Router()
const auth = require("../middleware/auth")
const { aiRateLimiter } = require("../middleware/rateLimiter")
const { chatStream, generateProject, generateProposalDraft } = require("../controllers/aiController")

// Authenticated & rate-limited AI routes
router.get("/chat/stream", auth, aiRateLimiter, chatStream)
router.post("/chat/stream", auth, aiRateLimiter, chatStream)
router.post("/generate-project", auth, aiRateLimiter, generateProject)
router.post("/generate-proposal", auth, aiRateLimiter, generateProposalDraft)

module.exports = router
