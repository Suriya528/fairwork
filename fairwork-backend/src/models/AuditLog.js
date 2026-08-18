const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  adminName: { type: String, required: true },
  action: { type: String, required: true },
  targetType: { type: String, required: true },
  targetId: { type: String, required: true },
  reason: { type: String, default: "" },
  details: { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.model("AuditLog", auditLogSchema);
