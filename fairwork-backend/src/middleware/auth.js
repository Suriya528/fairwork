const User = require("../models/User");
const { verifyAuthToken } = require("../utils/authVerifier");

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "No authorization header provided", code: "AUTHENTICATION_REQUIRED" });
    }

    const claims = verifyAuthToken(authHeader);

    // DB lookup for current state — authorization is always derived from DB
    const dbUser = await User.findById(claims.id).select("isSuspended suspendedReason role email authProvider isEmailVerified").lean();
    
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

    // Merge token claims with current DB role
    req.user = {
      id: claims.id,
      role: dbUser.role,  // Always from DB, never from token
      exp: claims.exp,
    };

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
