const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
} = require("../controllers/listingController");

const router = express.Router();

// Public
router.get("/", getListings);
router.get("/:id", getListingById);

// Protected + owner checks in controller
router.post("/", protect, createListing);
router.put("/:id", protect, updateListing);
router.delete("/:id", protect, deleteListing);

module.exports = router;

