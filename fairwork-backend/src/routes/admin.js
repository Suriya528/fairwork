const router = require("express").Router();
const authenticate = require("../middleware/auth");
const { requireAdmin } = require("../middleware/auth");
const admin = require("../controllers/adminController");

router.use(authenticate, requireAdmin);
router.get("/overview", admin.overview);
router.get("/users", admin.users);
router.get("/projects", admin.projects);
router.get("/disputes", admin.disputes);
router.get("/system", admin.system);

module.exports = router;
