const mongoose = require("mongoose");

const unreadCountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    count: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      ],
      validate: {
        validator: (participants) => Array.isArray(participants) && participants.length === 2,
        message: "One-to-one conversations require exactly two participants",
      },
      required: true,
    },
    participantKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: null,
      index: true,
    },
    unreadCounts: {
      type: [unreadCountSchema],
      default: [],
    },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1, lastMessageAt: -1 });

conversationSchema.statics.buildParticipantKey = function buildParticipantKey(userIds) {
  return userIds.map(String).sort().join(":");
};

module.exports = mongoose.model("Conversation", conversationSchema);
