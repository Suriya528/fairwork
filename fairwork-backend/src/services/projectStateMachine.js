const Project = require("../models/Project.js");

const VALID_TRANSITIONS = {
  open:        ["in_progress"],
  in_progress: ["completed", "disputed", "cancelled"],
  disputed:    ["completed", "refunded"],
  completed:   [],
  cancelled:   [],
  refunded:    [],
};

/**
 * Atomically transitions a project's status using CAS (compare-and-set).
 * Prevents concurrent race conditions on status changes.
 * 
 * @param {string} projectId - The project ID
 * @param {string} fromStatus - Expected current status
 * @param {string} toStatus - Desired new status
 * @param {Object} additionalGuard - Extra query conditions (e.g., { clientId: userId })
 * @param {Object} session - Optional MongoDB session for transactions
 * @returns {Object} The updated project document
 * @throws {Error} INVALID_STATUS_TRANSITION or STATUS_TRANSITION_CONFLICT
 */
async function transitionStatus(projectId, fromStatus, toStatus, additionalGuard = {}, session = null) {
  if (!VALID_TRANSITIONS[fromStatus]?.includes(toStatus)) {
    const err = new Error(`INVALID_STATUS_TRANSITION: ${fromStatus} → ${toStatus}`);
    err.statusCode = 400;
    throw err;
  }

  const updateOpts = { returnDocument: "after" };
  if (session) updateOpts.session = session;

  const result = await Project.findOneAndUpdate(
    { _id: projectId, status: fromStatus, ...additionalGuard },
    { $set: { status: toStatus } },
    updateOpts
  );

  if (!result) {
    const err = new Error(`STATUS_TRANSITION_CONFLICT: expected status "${fromStatus}" but project was not found or status has changed`);
    err.statusCode = 409;
    throw err;
  }

  return result;
}

/**
 * Returns whether a given transition is valid.
 */
function isValidTransition(fromStatus, toStatus) {
  return VALID_TRANSITIONS[fromStatus]?.includes(toStatus) ?? false;
}

module.exports = {
  transitionStatus,
  isValidTransition,
  VALID_TRANSITIONS,
};
