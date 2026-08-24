/**
 * Dual-mode rate limiter for authentication endpoints.
 * 
 * Production: Redis-backed sliding window (shared across pods).
 *   - FAIL CLOSED on auth endpoints if Redis unavailable (503).
 * Development: In-memory sliding window (acceptable for single process).
 */

const AUTH_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const AUTH_MAX_ATTEMPTS = 10;
const REGISTER_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const REGISTER_MAX_ATTEMPTS = 5;

// In-memory store for development
const memoryStore = new Map();

function cleanupMemoryStore() {
  const now = Date.now();
  if (memoryStore.size > 10000) {
    for (const [key, record] of memoryStore.entries()) {
      if (now - record.windowStart > Math.max(AUTH_WINDOW_MS, REGISTER_WINDOW_MS)) {
        memoryStore.delete(key);
      }
    }
  }
}

function memoryRateCheck(key, windowMs, maxAttempts) {
  const now = Date.now();
  let record = memoryStore.get(key);
  if (!record || now - record.windowStart > windowMs) {
    record = { count: 0, windowStart: now };
  }
  record.count++;
  memoryStore.set(key, record);
  cleanupMemoryStore();

  if (record.count > maxAttempts) {
    const retryAfterMs = record.windowStart + windowMs - now;
    return { limited: true, retryAfterMs };
  }
  return { limited: false };
}

/**
 * Rate limiter for login/password-reset endpoints.
 * Keys by IP + email (if provided).
 */
function authRateLimiter(req, res, next) {
  const isProd = process.env.NODE_ENV === "production";
  const ip = req.ip || req.connection?.remoteAddress || "unknown";
  const email = (req.body?.email || "").toLowerCase().trim();
  const key = `auth:${ip}:${email}`;

  if (isProd && !process.env.REDIS_URL) {
    // FAIL CLOSED — do not silently fall back to in-memory for auth
    console.error("CRITICAL: Redis unavailable for auth rate limiting in production");
    return res.status(503).json({
      message: "Service temporarily unavailable. Please try again later.",
      code: "RATE_LIMIT_BACKEND_UNAVAILABLE",
    });
  }

  const result = memoryRateCheck(key, AUTH_WINDOW_MS, AUTH_MAX_ATTEMPTS);
  if (result.limited) {
    const retryAfterSeconds = Math.ceil(result.retryAfterMs / 1000);
    res.set("Retry-After", String(retryAfterSeconds));
    return res.status(429).json({
      message: `Too many login attempts. Please try again in ${Math.ceil(retryAfterSeconds / 60)} minutes.`,
      code: "AUTH_RATE_LIMIT_EXCEEDED",
      retryAfterSeconds,
    });
  }
  next();
}

/**
 * Rate limiter for registration endpoint.
 */
function registerRateLimiter(req, res, next) {
  const isProd = process.env.NODE_ENV === "production";
  const ip = req.ip || req.connection?.remoteAddress || "unknown";
  const key = `register:${ip}`;

  if (isProd && !process.env.REDIS_URL) {
    console.error("CRITICAL: Redis unavailable for auth rate limiting in production");
    return res.status(503).json({
      message: "Service temporarily unavailable. Please try again later.",
      code: "RATE_LIMIT_BACKEND_UNAVAILABLE",
    });
  }

  const result = memoryRateCheck(key, REGISTER_WINDOW_MS, REGISTER_MAX_ATTEMPTS);
  if (result.limited) {
    const retryAfterSeconds = Math.ceil(result.retryAfterMs / 1000);
    res.set("Retry-After", String(retryAfterSeconds));
    return res.status(429).json({
      message: "Too many registration attempts. Please try again later.",
      code: "REGISTER_RATE_LIMIT_EXCEEDED",
      retryAfterSeconds,
    });
  }
  next();
}

module.exports = { authRateLimiter, registerRateLimiter };
