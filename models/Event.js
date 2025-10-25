import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    date: { type: Date, required: true },
    time: { type: String, required: true }, // e.g., "6:30 PM"
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], index: "2dsphere" }, // [lng, lat]
      address: String,
    },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    capacity: { type: Number, default: 50 },
    isCancelled: { type: Boolean, default: false },
    rsvp: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: {
          type: String,
          enum: ["pending", "going", "not_going", "maybe"],
          default: "pending",
        },
      },
    ],
    polls: [{ type: mongoose.Schema.Types.ObjectId, ref: "Poll" }],
    tags: [String],
    visibility: {
      type: String,
      enum: ["public", "group-only"],
      default: "group-only",
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// --- Virtual to count confirmed attendees ---
eventSchema.virtual("attendeeCount").get(function () {
  return this.rsvp.filter((r) => r.status === "going").length;
});

// --- Virtual for available spots ---
eventSchema.virtual("spotsLeft").get(function () {
  return Math.max(this.capacity - this.attendeeCount, 0);
});

// --- Pre-save hook to prevent overbooking ---
eventSchema.pre("save", function (next) {
  if (this.attendeeCount > this.capacity) {
    return next(new Error("Event capacity exceeded. Cannot save RSVP."));
  }
  next();
});

// --- Instance method: Add or update RSVP safely ---
eventSchema.methods.addOrUpdateRSVP = async function (userId, status) {
  const existing = this.rsvp.find(
    (r) => r.user.toString() === userId.toString()
  );

  // Calculate going count if changing status to 'going'
  const goingCount = this.attendeeCount;
  const isGoing = status === "going";
  const wasGoing = existing?.status === "going";

  if (isGoing && !wasGoing && goingCount + 1 > this.capacity) {
    throw new Error("Event capacity exceeded. Cannot RSVP 'going'.");
  }

  if (existing) {
    existing.status = status;
  } else {
    this.rsvp.push({ user: userId, status });
  }

  return this.save();
};

// --- Instance method: Remove RSVP ---
eventSchema.methods.removeRSVP = async function (userId) {
  this.rsvp = this.rsvp.filter((r) => r.user.toString() !== userId.toString());
  return this.save();
};

eventSchema.index({ group: 1, date: 1 });

eventSchema.pre("deleteOne", { document: true }, async function (next) {
  // Example: remove associated polls
  await mongoose.model("Poll").deleteMany({ relatedEvent: this._id });
  next();
});

export default mongoose.model("Event", eventSchema);
