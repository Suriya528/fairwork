const User = require("../models/User");
const { verifyAuthToken } = require("../utils/authVerifier");
const { logger } = require("../utils/logger");

/**
 * H-1R: Two-tier auth caching.
 * - Normal routes: check Redis cache (5s TTL) for isSuspended + tokenVersion
 * - Financial routes (bypassCache: true): always query MongoDB directly
 *
 * Usage:
 *   router.get("/projects", authenticate, handler);           // cached
 *   router.post("/escrow/deposit", authenticate({ bypassCache: true }), handler); // always fresh
 */

let redisClient = null;
const AUTH_CACHE_TTL = 5; // seconds

function getRedisClient() {
  if (redisClient !== null) return redisClient;
  try {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) { redisClient = false; return false; }
    const Redis = require("ioredis");
    redisClient = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 });
    redisClient.connect().catch(() => { redisClient = false; });
    return redisClient;
  } catch {
    redisClient = false;
    return false;
  }
}

async function getCachedAuthState(userId) {
  const client = getRedisClient();
  if (!client) return null;
  try {
    const cached = await client.get(`auth:${userId}`);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

async function setCachedAuthState(userId, state) {
  const client = getRedisClient();
  if (!client) return;
  try {
    await client.set(`auth:${userId}`, JSON.stringify(state), "EX", AUTH_CACHE_TTL);
  } catch {
    // Non-fatal — cache write failure shouldn't block auth
  }
}

function authenticate(optionsOrReq, maybeRes, maybeNext) {
  // Support both authenticate and authenticate({ bypassCache: true }) usage
  if (optionsOrReq && typeof optionsOrReq === "object" && !optionsOrReq.headers) {
    const options = optionsOrReq;
    return function authMiddleware(req, res, next) {
      return doAuthenticate(req, res, next, options);
    };
  }
  return doAuthenticate(optionsOrReq, maybeRes, maybeNext, {});
}

async function doAuthenticate(req, res, next, options = {}) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "No authorization header provided", code: "AUTHENTICATION_REQUIRED" });
    }

    const claims = verifyAuthToken(authHeader);
    const bypassCache = options.bypassCache === true;

    let dbUser;

    if (!bypassCache) {
      // Try Redis cache first
      const cached = await getCachedAuthState(claims.id);
      if (cached) {
        dbUser = cached;
      }
    }

    if (!dbUser) {
      // DB lookup for current state
      dbUser = await User.findById(claims.id).select("isSuspended suspendedReason role email authProvider isEmailVerified tokenVersion").lean();

      // Cache the result for non-bypass routes
      if (dbUser && !bypassCache) {
        setCachedAuthState(claims.id, dbUser); // fire-and-forget
      }
    }

    // Deleted-user guard
    if (!dbUser) {
      return res.status(401).json({ message: "Account no longer exists", code: "ACCOUNT_DELETED" });
    }

    // Suspension check (admins exempt)
    if (dbUser.isSuspended && dbUser.role !== "admin") {
      return res.status(403).json({
        message: `Account is suspended. ${dbUser.suspendedReason ? "Reason: " + dbUser.suspendedReason : "Contact support for assistance."}`,
        code: "ACCOUNT_SUSPENDED",
        isSuspended: true,
        suspendedReason: dbUser.suspendedReason || "",
      });
    }

    // Token version check: invalidate sessions issued before password change
    const currentVersion = dbUser.tokenVersion || 0;
    const tokenVersion = claims.tokenVersion;
    if (tokenVersion === undefined ? currentVersion > 0 : tokenVersion < currentVersion) {
      return res.status(401).json({ message: "Session expired. Please sign in again.", code: "SESSION_EXPIRED" });
    }

    // Merge token claims with current DB role
    req.user = {
      id: claims.id,
      role: dbUser.role,  // Always from DB, never from token
      sessionId: claims.sessionId,
      tokenVersion: currentVersion,
      exp: claims.exp,
    };

    // Populate correlation context with userId
    const { asyncStore } = require("../utils/logger");
    const store = asyncStore.getStore();
    if (store) store.userId = claims.id;

    next();
  } catch (err) {
    const message = err.message === "AUTHENTICATION_REQUIRED" ? "No token provided" :
                    err.message === "TOKEN_MISSING_EXPIRATION_CLAIM" ? "Token missing expiration" :
                    "Invalid or expired token";
    res.status(401).json({ message, code: err.message || "UNAUTHORIZED" });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") return res.status(403).json({ message: "Admin access required" });
  next();
}

module.exports = authenticate;
module.exports.authenticate = authenticate;
module.exports.authenticateToken = authenticate;
module.exports.requireAdmin = requireAdmin;
