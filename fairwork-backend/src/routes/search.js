const router = require("express").Router();
const auth = require("../middleware/auth");
const { globalSearch } = require("../controllers/searchController");

router.get("/", auth, globalSearch);

module.exports = router;
