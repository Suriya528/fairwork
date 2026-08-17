const Contract = require("../models/Contract");

function idsMatch(left, right) {
  return left != null && String(left) === String(right);
}

async function canAccessProject(project, userId) {
  if (idsMatch(project.clientId, userId) || idsMatch(project.freelancerId, userId)) {
    return true;
  }

  // Older projects can have a generated contract that records the assigned
  // freelancer while the Project.freelancerId field was left unset. Honor
  // only that project-linked contract as a compatibility path; it does not
  // grant access to an unrelated freelancer or override an explicit project
  // assignment.
  if (project.freelancerId || !project.contractId) return false;

  return Boolean(await Contract.exists({
    _id: project.contractId,
    projectId: project._id,
    freelancerId: userId,
  }));
}

module.exports = { canAccessProject };
