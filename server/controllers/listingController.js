const Listing = require("../models/Listing");
const EVENTS = require("../socket/events");
const { emitToUser } = require("../socket/services/socketHub");
const { createNotification } = require("../services/notificationService");

function toNumber(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return NaN;
}

function sanitizeImages(images) {
  if (!images) return [];
  if (Array.isArray(images)) return images.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof images === "string") return [images.trim()].filter(Boolean);
  return [];
}

// POST /api/listings (protected)
exports.createListing = async (req, res, next) => {
  try {
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    const description = typeof req.body?.description === "string" ? req.body.description.trim() : "";
    const category = typeof req.body?.category === "string" ? req.body.category.trim() : "";
    const location = typeof req.body?.location === "string" ? req.body.location.trim() : "";
    const pricePerDay = toNumber(req.body?.pricePerDay);
    const images = sanitizeImages(req.body?.images);
    const availability = typeof req.body?.availability === "boolean" ? req.body.availability : true;

    if (!req.userId) {
      const err = new Error("Not authorized");
      err.statusCode = 401;
      throw err;
    }

    if (!title || !description || !category || !location || Number.isNaN(pricePerDay)) {
      return res.status(400).json({
        message: "title, description, category, location, and pricePerDay are required",
      });
    }

    const listing = await Listing.create({
      title,
      description,
      category,
      pricePerDay,
      images,
      location,
      owner: req.userId,
      availability,
    });

    emitToUser(req.userId, EVENTS.LISTING_CREATED, { listing });
    await createNotification({
      recipient: req.userId,
      actor: req.userId,
      type: "listing.activity",
      title: "Listing created",
      body: `${listing.title} is now in your Rentra inventory`,
      entityType: "Listing",
      entityId: listing._id,
      data: { listingId: listing._id },
    });

    return res.status(201).json({ listing });
  } catch (err) {
    return next(err);
  }
};

// GET /api/listings (public)
exports.getListings = async (req, res, next) => {
  try {
    const availability =
      typeof req.query?.availability === "string"
        ? req.query.availability === "true"
        : undefined;

    const filter = {};
    if (typeof availability === "boolean") filter.availability = availability;

    const listings = await Listing.find(filter)
      .sort({ createdAt: -1 })
      .populate("owner", "name email");

    return res.status(200).json({ count: listings.length, listings });
  } catch (err) {
    return next(err);
  }
};

// GET /api/listings/:id (public)
exports.getListingById = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id).populate("owner", "name email");
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }
    return res.status(200).json({ listing });
  } catch (err) {
    return next(err);
  }
};

// PUT /api/listings/:id (protected, owner)
exports.updateListing = async (req, res, next) => {
  try {
    if (!req.userId) {
      const err = new Error("Not authorized");
      err.statusCode = 401;
      throw err;
    }

    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    if (String(listing.owner) !== String(req.userId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (typeof req.body?.title === "string") listing.title = req.body.title.trim();
    if (typeof req.body?.description === "string") listing.description = req.body.description.trim();
    if (typeof req.body?.category === "string") listing.category = req.body.category.trim();
    if (typeof req.body?.location === "string") listing.location = req.body.location.trim();
    if (req.body?.pricePerDay != null) {
      const pricePerDay = toNumber(req.body.pricePerDay);
      if (Number.isNaN(pricePerDay)) {
        return res.status(400).json({ message: "pricePerDay must be a number" });
      }
      listing.pricePerDay = pricePerDay;
    }
    if (req.body?.images != null) listing.images = sanitizeImages(req.body.images);
    if (typeof req.body?.availability === "boolean") listing.availability = req.body.availability;

    const updated = await listing.save();
    emitToUser(req.userId, EVENTS.LISTING_UPDATED, { listing: updated });
    return res.status(200).json({ listing: updated });
  } catch (err) {
    return next(err);
  }
};

// DELETE /api/listings/:id (protected, owner)
exports.deleteListing = async (req, res, next) => {
  try {
    if (!req.userId) {
      const err = new Error("Not authorized");
      err.statusCode = 401;
      throw err;
    }

    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    if (String(listing.owner) !== String(req.userId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await listing.deleteOne();
    emitToUser(req.userId, EVENTS.LISTING_DELETED, { listingId: listing._id });
    return res.status(200).json({ message: "Listing deleted" });
  } catch (err) {
    return next(err);
  }
};
