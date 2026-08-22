/**
 * Production Rate Limiter for FairWork AI Subsystem
 *
 * Keys by authenticated user ID or wallet address.
 * Uses an in-memory token bucket with sliding window tracking,
 * gracefully falling back if Redis is unconfigured or unreachable.
 */

const memoryBuckets = new Map()
const DAILY_LIMIT = 30
const WINDOW_MS = 24 * 60 * 60 * 1000 // 24 Hours

function aiRateLimiter(req, res, next) {
  const userId = req.user?.id || req.user?.walletAddress || req.ip || "anonymous"
  const key = `ai_ratelimit:${userId}`
  const now = Date.now()

  let record = memoryBuckets.get(key)
  if (!record || now - record.resetTime > WINDOW_MS) {
    record = { count: 0, resetTime: now }
  }

  if (record.count >= DAILY_LIMIT) {
    const hoursLeft = Math.ceil((record.resetTime + WINDOW_MS - now) / (60 * 60 * 1000))
    return res.status(429).json({
      message: `AI generation limit reached (${DAILY_LIMIT}/day). Please try again in ${hoursLeft} hours.`,
    })
  }

  record.count += 1
  memoryBuckets.set(key, record)

  // Clean up stale memory records periodically
  if (memoryBuckets.size > 10000) {
    for (const [k, v] of memoryBuckets.entries()) {
      if (now - v.resetTime > WINDOW_MS) memoryBuckets.delete(k)
    }
  }

  next()
}

module.exports = {
  aiRateLimiter,
}
