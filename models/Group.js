import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  members: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      role: {
        type: String,
        enum: ["member", "admin"],
        default: "member",
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  events: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
    },
  ],
  privacy: {
    type: String,
    enum: ["public", "private", "secret"],
    default: "public",
  },
  tags: [
    {
      type: String,
      trim: true,
    },
  ],

  joinRequests: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to update updatedAt on save
groupSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

groupSchema.index({ owner: 1 });
groupSchema.index({ name: "text" });

groupSchema.pre("save", function (next) {
  const ownerInMembers = this.members.some(
    (m) => m.user.toString() === this.owner.toString()
  );
  if (!ownerInMembers) {
    this.members.push({ user: this.owner, role: "admin" });
  }
  next();
});

export default mongoose.model("Group", groupSchema);
