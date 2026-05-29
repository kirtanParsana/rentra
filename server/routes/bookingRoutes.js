const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  createBooking,
  getMyBookings,
  getOwnerBookings,
  getListingAvailability,
  updateBookingStatus,
} = require("../controllers/bookingController");

const router = express.Router();

// Public: availability visualization for a listing
router.get("/listing/:listingId", getListingAvailability);

// Protected: booking flows
router.post("/", protect, createBooking);
router.get("/me", protect, getMyBookings);
router.get("/owner", protect, getOwnerBookings);
router.patch("/:id/status", protect, updateBookingStatus);

module.exports = router;

