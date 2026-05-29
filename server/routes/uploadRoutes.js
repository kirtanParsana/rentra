const express = require("express");
const protect = require("../middleware/authMiddleware");
const { upload } = require("../middleware/uploadMiddleware");
const { uploadListingImages } = require("../controllers/uploadController");

const router = express.Router();

router.post("/listing-images", protect, upload.array("images", 8), uploadListingImages);

module.exports = router;

