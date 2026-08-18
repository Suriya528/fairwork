const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Strict Enforcement: Block suspended users immediately across all protected API routes
    const dbUser = await User.findById(decoded.id).select("isSuspended suspendedReason role").lean();
    if (dbUser && dbUser.isSuspended && dbUser.role !== "admin") {
      return res.status(403).json({
        message: `Account is suspended. ${dbUser.suspendedReason ? "Reason: " + dbUser.suspendedReason : "Contact support for assistance."}`,
        isSuspended: true,
      });
    }

    if (dbUser) {
      req.user.role = dbUser.role;
    }

    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") return res.status(403).json({ message: "Admin access required" });
  next();
}

module.exports = authenticate;
module.exports.requireAdmin = requireAdmin;
