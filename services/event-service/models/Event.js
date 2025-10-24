import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    time: {
      type: String, // e.g. "6:30 PM"
      required: true,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        index: "2dsphere", // [longitude, latitude]
      },
      address: String,
    },

    attendees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    capacity: {
      type: Number,
      default: 50,
    },

    isCancelled: {
      type: Boolean,
      default: false,
    },

    tags: [String], // e.g., ["music", "food", "movie", "adventure"]

    visibility: {
      type: String,
      enum: ["public", "group-only"],
      default: "group-only",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);
