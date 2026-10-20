/**
 * Real-time socket notification dispatcher.
 * Broadcasts project state changes instantly to both project-specific rooms
 * and participating user rooms so that all connected browsers update without
 * requiring a manual browser refresh.
 */

function notifyProjectUpdate(req, projectId, payload = {}, targetUserIds = []) {
  try {
    const io = req?.app?.get?.("io");
    if (!io) return;

    const normalizedProjectId = projectId ? String(projectId) : null;
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
      if (uId) {
        io.to(`user:${String(uId)}`).emit("project_updated", eventData);
      }
    });
  } catch (err) {
    console.warn("[SocketNotifier] Failed to emit project update:", err.message);
  }
}

module.exports = {
  notifyProjectUpdate,
};
