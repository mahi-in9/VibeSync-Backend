import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    attachments: [
      {
        url: String,
        type: String, // e.g., "image", "video", "file"
      },
    ],
  },
  { timestamps: true }
);

messageSchema.index({ group: 1, createdAt: 1 });
messageSchema.index({ sender: 1 });

messageSchema.virtual("senderInfo", {
  ref: "User",
  localField: "sender",
  foreignField: "_id",
  justOne: true,
});

export default mongoose.model("Message", messageSchema);
