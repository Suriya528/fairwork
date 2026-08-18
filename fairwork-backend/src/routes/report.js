const router = require("express").Router();
const authenticate = require("../middleware/auth");
const { createReport } = require("../controllers/adminController");

router.post("/", authenticate, createReport);

module.exports = router;
