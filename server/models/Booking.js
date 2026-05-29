const mongoose = require("mongoose");

const BOOKING_STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "active",
  "completed",
  "cancelled",
];

const bookingSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
      index: true,
    },
    renter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: BOOKING_STATUSES,
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

bookingSchema.index({ listing: 1, startDate: 1, endDate: 1, status: 1 });

bookingSchema.statics.BOOKING_STATUSES = BOOKING_STATUSES;

module.exports = mongoose.model("Booking", bookingSchema);

