const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Listing = require("../models/Listing");

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fmtDay(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// GET /api/analytics/dashboard (protected)
exports.getDashboardAnalytics = async (req, res, next) => {
  try {
    if (!req.userId) {
      const err = new Error("Not authorized");
      err.statusCode = 401;
      throw err;
    }

    const ownerId = new mongoose.Types.ObjectId(req.userId);
    const now = new Date();
    const from30 = startOfDay(new Date(now.getTime() - 29 * MS_PER_DAY));

    // Parallelize independent queries.
    const totalListingsPromise = Listing.countDocuments({ owner: ownerId });

    const activeBookingsPromise = Booking.countDocuments({
      owner: ownerId,
      status: { $in: ["accepted", "active"] },
    });

    const completedBookingsPromise = Booking.countDocuments({
      owner: ownerId,
      status: "completed",
    });

    // Earnings for completed bookings (last 30 days) = pricePerDay * days.
    const earningsSeriesPromise = Booking.aggregate([
      {
        $match: {
          owner: ownerId,
          status: "completed",
          updatedAt: { $gte: from30 },
        },
      },
      {
        $lookup: {
          from: "listings",
          localField: "listing",
          foreignField: "_id",
          as: "listingDoc",
        },
      },
      { $unwind: "$listingDoc" },
      {
        $project: {
          day: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
          pricePerDay: "$listingDoc.pricePerDay",
          startDate: 1,
          endDate: 1,
        },
      },
      {
        $addFields: {
          days: {
            $max: [
              1,
              {
                $ceil: {
                  $divide: [{ $subtract: ["$endDate", "$startDate"] }, MS_PER_DAY],
                },
              },
            ],
          },
        },
      },
      {
        $addFields: {
          earning: { $multiply: ["$pricePerDay", "$days"] },
        },
      },
      {
        $group: {
          _id: "$day",
          earnings: { $sum: "$earning" },
          completed: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Total earnings (all-time completed)
    const totalEarningsPromise = Booking.aggregate([
      { $match: { owner: ownerId, status: "completed" } },
      {
        $lookup: {
          from: "listings",
          localField: "listing",
          foreignField: "_id",
          as: "listingDoc",
        },
      },
      { $unwind: "$listingDoc" },
      {
        $project: {
          pricePerDay: "$listingDoc.pricePerDay",
          startDate: 1,
          endDate: 1,
        },
      },
      {
        $addFields: {
          days: {
            $max: [
              1,
              {
                $ceil: {
                  $divide: [{ $subtract: ["$endDate", "$startDate"] }, MS_PER_DAY],
                },
              },
            ],
          },
        },
      },
      { $addFields: { earning: { $multiply: ["$pricePerDay", "$days"] } } },
      { $group: { _id: null, earnings: { $sum: "$earning" } } },
    ]);

    const recentBookingsPromise = Booking.find({ owner: ownerId })
      .sort({ updatedAt: -1 })
      .limit(8)
      .populate("listing", "title images location pricePerDay")
      .populate("renter", "name email")
      .select("status startDate endDate updatedAt listing renter");

    const recentListingsPromise = Listing.find({ owner: ownerId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title category pricePerDay createdAt availability images location");

    const bookingsByStatusPromise = Booking.aggregate([
      { $match: { owner: ownerId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const [
      totalListings,
      activeBookings,
      completedBookings,
      earningsSeriesRaw,
      totalEarningsAgg,
      recentBookings,
      recentListings,
      bookingsByStatusRaw,
    ] = await Promise.all([
      totalListingsPromise,
      activeBookingsPromise,
      completedBookingsPromise,
      earningsSeriesPromise,
      totalEarningsPromise,
      recentBookingsPromise,
      recentListingsPromise,
      bookingsByStatusPromise,
    ]);

    const totalEarnings = totalEarningsAgg?.[0]?.earnings || 0;

    // Fill series for last 30 days (so charts don't look broken).
    const earningsMap = new Map(
      (earningsSeriesRaw || []).map((d) => [d._id, { earnings: d.earnings || 0, completed: d.completed || 0 }])
    );
    const earningsSeries = [];
    for (let i = 0; i < 30; i += 1) {
      const day = startOfDay(new Date(from30.getTime() + i * MS_PER_DAY));
      const key = fmtDay(day);
      const v = earningsMap.get(key) || { earnings: 0, completed: 0 };
      earningsSeries.push({ day: key, earnings: v.earnings, completed: v.completed });
    }

    const bookingsByStatus = (bookingsByStatusRaw || []).map((row) => ({
      status: row._id,
      count: row.count,
    }));

    return res.status(200).json({
      metrics: {
        totalListings,
        activeBookings,
        completedBookings,
        earnings: totalEarnings,
      },
      charts: {
        earningsLast30Days: earningsSeries,
        bookingsByStatus,
      },
      recentActivity: {
        recentBookings,
        recentListings,
      },
    });
  } catch (err) {
    return next(err);
  }
};

