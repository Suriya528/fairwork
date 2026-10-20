/**
 * Real-time socket notification dispatcher.
 * Broadcasts project state changes instantly to both project-specific rooms
 * and participating user rooms so that all connected browsers update without
 * requiring a manual browser refresh.
 */

function toIdString(val) {
  if (!val) return null;
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    if (val._id) return String(val._id);
    if (val.id) return String(val.id);
  }
  const s = String(val);
  return s !== "[object Object]" ? s : null;
}

function notifyProjectUpdate(req, projectId, payload = {}, targetUserIds = []) {
  try {
    const io = req?.app?.get?.("io") || (req && typeof req.to === "function" ? req : null);
    if (!io) return;

    const normalizedProjectId = toIdString(projectId);
    const eventData = {
      projectId: normalizedProjectId,
      timestamp: new Date().toISOString(),
      ...payload,
    };

    if (normalizedProjectId) {
      io.to(`project:${normalizedProjectId}`).emit("project_updated", eventData);
    }

    const userIds = Array.isArray(targetUserIds)
      ? targetUserIds
      : targetUserIds
      ? [targetUserIds]
      : [];

    userIds.forEach((uId) => {
      const userStr = toIdString(uId);
      if (userStr) {
        io.to(`user:${userStr}`).emit("project_updated", eventData);
      }
    });
  } catch (err) {
    console.warn("[SocketNotifier] Failed to emit project update:", err.message);
  }
}

module.exports = {
  notifyProjectUpdate,
};
