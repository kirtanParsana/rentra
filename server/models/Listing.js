const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: 3,
      maxlength: 120,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: 10,
      maxlength: 5000,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      maxlength: 48,
    },
    pricePerDay: {
      type: Number,
      required: [true, "pricePerDay is required"],
      min: [0, "pricePerDay must be >= 0"],
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length <= 12,
        message: "images can contain at most 12 items",
      },
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      maxlength: 180,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    availability: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Listing", listingSchema);

