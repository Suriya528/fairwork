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

// ── Redis client (lazy singleton) ──
let redisClient = null;
let redisReady = false;

function getRedisClient() {
  if (redisClient) return redisClient;
  if (!process.env.REDIS_URL) return null;

  try {
    const Redis = require("ioredis");
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      lazyConnect: false,
      enableReadyCheck: true,
    });

    redisClient.on("ready", () => { redisReady = true; });
    redisClient.on("error", (err) => {
      redisReady = false;
      console.error("Redis rate-limiter error:", err.message);
    });
    redisClient.on("close", () => { redisReady = false; });

    return redisClient;
  } catch (err) {
    console.error("Failed to initialize Redis for rate limiting:", err.message);
    return null;
  }
}

// ── Redis sliding-window rate check ──
async function redisRateCheck(key, windowMs, maxAttempts) {
  const client = getRedisClient();
  if (!client || !redisReady) return null; // Signal Redis unavailable

  const now = Date.now();
  const windowStart = now - windowMs;

  // Lua script for atomic sliding window: remove expired, add current, count
  const luaScript = `
    redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', ARGV[1])
    redis.call('ZADD', KEYS[1], ARGV[2], ARGV[3])
    local count = redis.call('ZCARD', KEYS[1])
    redis.call('PEXPIRE', KEYS[1], ARGV[4])
    return count
  `;

  try {
    const count = await client.eval(
      luaScript,
      1,
      `ratelimit:${key}`,
      String(windowStart),
      String(now),
      `${now}:${Math.random().toString(36).slice(2, 8)}`,
      String(windowMs)
    );

    if (count > maxAttempts) {
      // Estimate retry-after from the oldest entry still in window
      const oldest = await client.zrange(`ratelimit:${key}`, 0, 0, "WITHSCORES");
      const oldestTs = oldest.length >= 2 ? Number(oldest[1]) : now - windowMs;
      const retryAfterMs = Math.max(0, oldestTs + windowMs - now);
      return { limited: true, retryAfterMs };
    }
    return { limited: false };
  } catch (err) {
    console.error("Redis rate check error:", err.message);
    return null; // Signal Redis unavailable
  }
}

// ── In-memory store for development ──
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

// ── Unified rate check: Redis in production, in-memory in development ──
async function rateCheck(key, windowMs, maxAttempts) {
  const isProd = process.env.NODE_ENV === "production";

  if (isProd) {
    const redisResult = await redisRateCheck(key, windowMs, maxAttempts);
    if (redisResult !== null) return redisResult;
    // Redis unavailable in production → fail closed
    return null;
  }

  // Development: in-memory is acceptable
  return memoryRateCheck(key, windowMs, maxAttempts);
}

/**
 * Rate limiter for login/password-reset endpoints.
 * Keys by IP + email (if provided).
 */
async function authRateLimiter(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || "unknown";
  const email = (req.body?.email || "").toLowerCase().trim();
  const key = `auth:${ip}:${email}`;

  const result = await rateCheck(key, AUTH_WINDOW_MS, AUTH_MAX_ATTEMPTS);

  if (result === null) {
    // FAIL CLOSED — Redis unavailable in production
    console.error("CRITICAL: Redis unavailable for auth rate limiting in production");
    return res.status(503).json({
      message: "Service temporarily unavailable. Please try again later.",
      code: "RATE_LIMIT_BACKEND_UNAVAILABLE",
    });
  }

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
async function registerRateLimiter(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || "unknown";
  const key = `register:${ip}`;

  const result = await rateCheck(key, REGISTER_WINDOW_MS, REGISTER_MAX_ATTEMPTS);

  if (result === null) {
    console.error("CRITICAL: Redis unavailable for auth rate limiting in production");
    return res.status(503).json({
      message: "Service temporarily unavailable. Please try again later.",
      code: "RATE_LIMIT_BACKEND_UNAVAILABLE",
    });
  }

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
