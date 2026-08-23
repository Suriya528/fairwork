const jwt = require("jsonwebtoken");

function verifyAuthToken(rawToken, config = {}) {
  const isProd = (config.nodeEnv || process.env.NODE_ENV) === "production";
  const jwtSecret = config.jwtSecret || process.env.JWT_SECRET;
  const expectedIssuer = config.jwtIssuer || process.env.JWT_ISSUER;
  const expectedAudience = config.jwtAudience || process.env.JWT_AUDIENCE;

  if (!jwtSecret) {
    throw new Error("FATAL_CONFIG_JWT_SECRET_REQUIRED");
  }
  if (isProd) {
    if (!expectedIssuer) throw new Error("FATAL_CONFIG_JWT_ISSUER_REQUIRED");
    if (!expectedAudience) throw new Error("FATAL_CONFIG_JWT_AUDIENCE_REQUIRED");
  }

  if (!rawToken || typeof rawToken !== "string") {
    throw new Error("AUTHENTICATION_REQUIRED");
  }

  const token = rawToken.replace(/^Bearer\s+/i, "").trim();
  const verifyOpts = { algorithms: ["HS256"] };

  if (expectedIssuer) verifyOpts.issuer = expectedIssuer;
  if (expectedAudience) verifyOpts.audience = expectedAudience;

  const decoded = jwt.verify(token, jwtSecret, verifyOpts);

  if (!decoded || typeof decoded !== "object") throw new Error("MALFORMED_AUTH_PAYLOAD");
  if (!decoded.id) throw new Error("MISSING_USER_ID_CLAIM");
  if (!decoded.exp) throw new Error("TOKEN_MISSING_EXPIRATION_CLAIM");
  if (typeof decoded.role !== "string" || !decoded.role.trim()) {
    throw new Error("MISSING_OR_INVALID_ROLE_CLAIM");
  }

  return {
    id: String(decoded.id),
    role: decoded.role.trim(),
    exp: decoded.exp,
  };
}

function expressAuthMiddleware(config = {}) {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      req.user = verifyAuthToken(authHeader, config);
      next();
    } catch (err) {
      res.status(401).json({ error: err.message || "UNAUTHORIZED" });
    }
  };
}

function socketAuthMiddleware(config = {}) {
  return (socket, next) => {
    try {
      const rawToken = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      socket.user = verifyAuthToken(rawToken, config);
      next();
    } catch (err) {
      next(new Error(err.message || "AUTHENTICATION_FAILED"));
    }
  };
}

module.exports = {
  verifyAuthToken,
  expressAuthMiddleware,
  socketAuthMiddleware,
};
