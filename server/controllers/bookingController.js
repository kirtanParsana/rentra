const Booking = require("../models/Booking");
const Listing = require("../models/Listing");
const EVENTS = require("../socket/events");
const { emitToUser } = require("../socket/services/socketHub");
const { createNotification } = require("../services/notificationService");

const BLOCKING_STATUSES = new Set(["pending", "accepted", "active"]);

function parseDate(value) {
  const d = new Date(value);
  // eslint-disable-next-line no-restricted-globals
  if (isNaN(d.getTime())) return null;
  return d;
}

function normalizeRange(start, end) {
  // keep time component (supports hourly later) but ensure ordering
  if (start >= end) return null;
  return { start, end };
}

async function findConflictingBooking({ listingId, startDate, endDate, excludeBookingId }) {
  const query = {
    listing: listingId,
    status: { $in: Array.from(BLOCKING_STATUSES) },
    startDate: { $lt: endDate },
    endDate: { $gt: startDate },
  };

  if (excludeBookingId) query._id = { $ne: excludeBookingId };

  return Booking.findOne(query).select("_id status startDate endDate");
}

// POST /api/bookings (protected)
exports.createBooking = async (req, res, next) => {
  try {
    if (!req.userId) {
      const err = new Error("Not authorized");
      err.statusCode = 401;
      throw err;
    }

    const listingId = req.body?.listingId || req.body?.listing;
    const startDate = parseDate(req.body?.startDate);
    const endDate = parseDate(req.body?.endDate);

    if (!listingId || !startDate || !endDate) {
      return res.status(400).json({ message: "listingId, startDate, and endDate are required" });
    }

    const range = normalizeRange(startDate, endDate);
    if (!range) {
      return res.status(400).json({ message: "endDate must be after startDate" });
    }

    const now = new Date();
    if (startDate < new Date(now.getTime() - 5 * 60 * 1000)) {
      return res.status(400).json({ message: "startDate must be in the future" });
    }

    const listing = await Listing.findById(listingId).select("_id owner availability pricePerDay");
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    if (!listing.availability) return res.status(409).json({ message: "Listing is not available" });

    if (String(listing.owner) === String(req.userId)) {
      return res.status(400).json({ message: "You cannot book your own listing" });
    }

    const conflicting = await findConflictingBooking({
      listingId: listing._id,
      startDate,
      endDate,
    });
    if (conflicting) {
      return res.status(409).json({
        message: "Booking conflict for selected dates",
        conflict: conflicting,
      });
    }

    const booking = await Booking.create({
      listing: listing._id,
      renter: req.userId,
      owner: listing.owner,
      startDate,
      endDate,
      status: "pending",
    });

    const populated = await Booking.findById(booking._id)
      .populate("listing", "title pricePerDay images location owner")
      .populate("renter", "name email")
      .populate("owner", "name email");

    emitToUser(listing.owner, EVENTS.BOOKING_CREATED, { booking: populated });
    emitToUser(req.userId, EVENTS.BOOKING_CREATED, { booking: populated });
    await createNotification({
      recipient: listing.owner,
      actor: req.userId,
      type: "booking.update",
      title: "New booking request",
      body: populated?.listing?.title ? `New request for ${populated.listing.title}` : "You have a new booking request",
      entityType: "Booking",
      entityId: booking._id,
      data: { bookingId: booking._id, status: "pending" },
    });

    return res.status(201).json({ booking: populated });
  } catch (err) {
    return next(err);
  }
};

// GET /api/bookings/me (protected)
exports.getMyBookings = async (req, res, next) => {
  try {
    if (!req.userId) {
      const err = new Error("Not authorized");
      err.statusCode = 401;
      throw err;
    }

    const bookings = await Booking.find({ renter: req.userId })
      .sort({ createdAt: -1 })
      .populate("listing", "title pricePerDay images location owner")
      .populate("owner", "name email");

    return res.status(200).json({ count: bookings.length, bookings });
  } catch (err) {
    return next(err);
  }
};

// GET /api/bookings/owner (protected)
exports.getOwnerBookings = async (req, res, next) => {
  try {
    if (!req.userId) {
      const err = new Error("Not authorized");
      err.statusCode = 401;
      throw err;
    }

    const bookings = await Booking.find({ owner: req.userId })
      .sort({ createdAt: -1 })
      .populate("listing", "title pricePerDay images location owner")
      .populate("renter", "name email");

    return res.status(200).json({ count: bookings.length, bookings });
  } catch (err) {
    return next(err);
  }
};

// GET /api/bookings/listing/:listingId (public)
exports.getListingAvailability = async (req, res, next) => {
  try {
    const listingId = req.params.listingId;
    if (!listingId) return res.status(400).json({ message: "listingId is required" });

    const bookings = await Booking.find({
      listing: listingId,
      status: { $in: Array.from(BLOCKING_STATUSES) },
    })
      .sort({ startDate: 1 })
      .select("startDate endDate status");

    return res.status(200).json({ count: bookings.length, blocked: bookings });
  } catch (err) {
    return next(err);
  }
};

const STATUS_TRANSITIONS = {
  pending: new Set(["accepted", "rejected", "cancelled"]),
  accepted: new Set(["active", "cancelled"]),
  rejected: new Set([]),
  active: new Set(["completed", "cancelled"]),
  completed: new Set([]),
  cancelled: new Set([]),
};

function canTransition(from, to) {
  return Boolean(STATUS_TRANSITIONS[from]?.has(to));
}

// PATCH /api/bookings/:id/status (protected)
exports.updateBookingStatus = async (req, res, next) => {
  try {
    if (!req.userId) {
      const err = new Error("Not authorized");
      err.statusCode = 401;
      throw err;
    }

    const nextStatus = String(req.body?.status || "").trim();
    if (!Booking.BOOKING_STATUSES.includes(nextStatus)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const isOwner = String(booking.owner) === String(req.userId);
    const isRenter = String(booking.renter) === String(req.userId);
    if (!isOwner && !isRenter) return res.status(403).json({ message: "Forbidden" });

    // role constraints
    if (nextStatus === "accepted" || nextStatus === "rejected") {
      if (!isOwner) return res.status(403).json({ message: "Only owner can accept/reject" });
    }
    if (nextStatus === "cancelled") {
      // allow owner or renter
    }
    if (nextStatus === "active" || nextStatus === "completed") {
      if (!isOwner) return res.status(403).json({ message: "Only owner can update active/completed" });
    }

    if (!canTransition(booking.status, nextStatus)) {
      return res.status(409).json({ message: `Cannot transition from ${booking.status} to ${nextStatus}` });
    }

    // If moving into a blocking status, re-check conflicts
    const becomesBlocking = BLOCKING_STATUSES.has(nextStatus);
    if (becomesBlocking) {
      const conflict = await findConflictingBooking({
        listingId: booking.listing,
        startDate: booking.startDate,
        endDate: booking.endDate,
        excludeBookingId: booking._id,
      });
      if (conflict) {
        return res.status(409).json({ message: "Booking conflict", conflict });
      }
    }

    booking.status = nextStatus;
    await booking.save();

    const populated = await Booking.findById(booking._id)
      .populate("listing", "title pricePerDay images location owner")
      .populate("renter", "name email")
      .populate("owner", "name email");

    emitToUser(booking.owner, EVENTS.BOOKING_UPDATED, { booking: populated });
    emitToUser(booking.renter, EVENTS.BOOKING_UPDATED, { booking: populated });

    const notifyRecipient = isOwner ? booking.renter : booking.owner;
    await createNotification({
      recipient: notifyRecipient,
      actor: req.userId,
      type: "booking.update",
      title: "Booking updated",
      body: populated?.listing?.title
        ? `${populated.listing.title} is now ${nextStatus}`
        : `Booking status changed to ${nextStatus}`,
      entityType: "Booking",
      entityId: booking._id,
      data: { bookingId: booking._id, status: nextStatus },
    });

    return res.status(200).json({ booking: populated });
  } catch (err) {
    return next(err);
  }
};
