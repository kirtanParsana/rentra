const express = require("express");
const protect = require("../middleware/authMiddleware");
const { getDashboardAnalytics } = require("../controllers/analyticsController");

const router = express.Router();

router.get("/dashboard", protect, getDashboardAnalytics);

module.exports = router;

