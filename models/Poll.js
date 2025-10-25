import mongoose from "mongoose";

const { Schema, model } = mongoose;

// Options
const optionSchema = new Schema({
  text: { type: String, required: true },
  votes: [{ type: Schema.Types.ObjectId, ref: "User" }],
});

// Poll schema
const pollSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    options: [optionSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    relatedEvent: { type: Schema.Types.ObjectId, ref: "Event" },
    relatedGroup: { type: Schema.Types.ObjectId, ref: "Group" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

pollSchema.virtual("totalVotes").get(function () {
  return this.options.reduce((acc, option) => acc + option.votes.length, 0);
});

pollSchema.index({ relatedEvent: 1 });
pollSchema.index({ relatedGroup: 1 });

pollSchema.methods.vote = async function (userId, optionId) {
  const option = this.options.id(optionId);
  if (!option) throw new Error("Option not found.");

  // Prevent double voting
  this.options.forEach((opt) => {
    opt.votes = opt.votes.filter(
      (voterId) => voterId.toString() !== userId.toString()
    );
  });

  option.votes.push(userId);
  return this.save();
};

export default model("Poll", pollSchema);
