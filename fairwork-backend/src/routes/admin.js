const router = require("express").Router();
const authenticate = require("../middleware/auth");
const { requireAdmin } = require("../middleware/auth");
const admin = require("../controllers/adminController");

// All admin routes require authenticated JWT + admin role
router.use(authenticate, requireAdmin);

router.get("/overview", admin.overview);
router.get("/users", admin.users);
router.get("/users/:id", admin.userDetail);
router.post("/users/:id/suspend", admin.suspendUser);
router.post("/users/:id/unsuspend", admin.unsuspendUser);

router.get("/projects", admin.projects);
router.get("/projects/:id", admin.projectDetail);
router.post("/projects/:id/moderate", admin.moderateProject);

router.get("/applications", admin.applications);
router.get("/contracts", admin.contracts);
router.get("/escrows", admin.escrows);
router.get("/disputes", admin.disputes);
router.get("/arbitrators", admin.arbitrators);
router.get("/transactions", admin.transactions);

router.get("/reports", admin.reports);
router.patch("/reports/:id", admin.updateReport);

router.get("/analytics", admin.analytics);
router.get("/audit-logs", admin.auditLogs);
router.get("/system", admin.system);
router.get("/integrity", admin.integrity);
router.post("/quarantine/:id/replay", admin.replayQuarantineEvent);

module.exports = router;
