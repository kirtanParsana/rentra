const mongoose = require("mongoose");

const MESSAGE_STATUSES = ["sent", "delivered", "seen"];

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
    },
    clientMessageId: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
    },
    status: {
      type: String,
      enum: MESSAGE_STATUSES,
      default: "sent",
      index: true,
    },
    seenAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index(
  { sender: 1, clientMessageId: 1 },
  { unique: true, partialFilterExpression: { clientMessageId: { $type: "string", $gt: "" } } }
);

messageSchema.statics.MESSAGE_STATUSES = MESSAGE_STATUSES;

module.exports = mongoose.model("Message", messageSchema);
