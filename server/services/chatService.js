const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { createNotification } = require("./notificationService");

function serializeConversation(conversation) {
  if (!conversation) return null;
  const c = conversation.toObject ? conversation.toObject() : conversation;
  return {
    _id: c._id,
    participants: c.participants,
    participantKey: c.participantKey,
    lastMessage: c.lastMessage,
    lastMessageAt: c.lastMessageAt,
    unreadCounts: c.unreadCounts || [],
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

function serializeMessage(message) {
  if (!message) return null;
  const m = message.toObject ? message.toObject() : message;
  return {
    _id: m._id,
    conversation: m.conversation,
    sender: m.sender,
    recipient: m.recipient,
    body: m.body,
    clientMessageId: m.clientMessageId,
    status: m.status,
    seenAt: m.seenAt,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}

function assertObjectId(value, label) {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    const err = new Error(`${label} is invalid`);
    err.statusCode = 400;
    throw err;
  }
}

function assertParticipant(conversation, userId) {
  const ok = conversation.participants.some((id) => String(id._id || id) === String(userId));
  if (!ok) {
    const err = new Error("Forbidden");
    err.statusCode = 403;
    throw err;
  }
}

function getOtherParticipant(conversation, userId) {
  return conversation.participants.find((id) => String(id._id || id) !== String(userId));
}

function buildUnreadCounts(participants) {
  return participants.map((user) => ({ user, count: 0 }));
}

async function getOrCreateConversation(userA, userB) {
  assertObjectId(userA, "userA");
  assertObjectId(userB, "userB");
  if (String(userA) === String(userB)) {
    const err = new Error("Cannot create a conversation with yourself");
    err.statusCode = 400;
    throw err;
  }

  const participants = [userA, userB].map((id) => new mongoose.Types.ObjectId(id));
  const participantKey = Conversation.buildParticipantKey(participants);

  const conversation = await Conversation.findOneAndUpdate(
    { participantKey },
    {
      $setOnInsert: {
        participants,
        participantKey,
        unreadCounts: buildUnreadCounts(participants),
      },
    },
    { new: true, upsert: true }
  ).populate("participants", "name email");

  return conversation;
}

async function getConversationForUser(conversationId, userId) {
  assertObjectId(conversationId, "conversationId");
  const conversation = await Conversation.findById(conversationId).populate("participants", "name email");
  if (!conversation) {
    const err = new Error("Conversation not found");
    err.statusCode = 404;
    throw err;
  }
  assertParticipant(conversation, userId);
  return conversation;
}

async function listConversations(userId) {
  const conversations = await Conversation.find({ participants: userId })
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .populate("participants", "name email")
    .populate("lastMessage");

  return conversations.map(serializeConversation);
}

async function listMessages(userId, conversationId, { before, limit = 40 } = {}) {
  await getConversationForUser(conversationId, userId);
  const query = { conversation: conversationId };
  if (before && mongoose.Types.ObjectId.isValid(before)) query._id = { $lt: before };

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 40, 100));

  return messages.reverse().map(serializeMessage);
}

async function createMessage({ sender, recipient, conversationId, body, clientMessageId = "" }) {
  const conversation = conversationId
    ? await getConversationForUser(conversationId, sender)
    : await getOrCreateConversation(sender, recipient);

  const targetRecipient = recipient || getOtherParticipant(conversation, sender);
  if (!targetRecipient) {
    const err = new Error("Message recipient is required");
    err.statusCode = 400;
    throw err;
  }
  const targetRecipientId = String(targetRecipient._id || targetRecipient);

  const text = typeof body === "string" ? body.trim() : "";
  if (!text) {
    const err = new Error("Message body is required");
    err.statusCode = 400;
    throw err;
  }

  let message;
  try {
    message = await Message.create({
      conversation: conversation._id,
      sender,
      recipient: targetRecipientId,
      body: text,
      clientMessageId,
      status: "sent",
    });
  } catch (error) {
    if (error.code === 11000 && clientMessageId) {
      message = await Message.findOne({ sender, clientMessageId });
    } else {
      throw error;
    }
  }

  await Conversation.updateOne(
    { _id: conversation._id },
    {
      $set: {
        lastMessage: message._id,
        lastMessageAt: message.createdAt,
      },
      $inc: { "unreadCounts.$[recipient].count": 1 },
    },
    { arrayFilters: [{ "recipient.user": targetRecipientId }] }
  );

  const updatedConversation = await Conversation.findById(conversation._id)
    .populate("participants", "name email")
    .populate("lastMessage");

  await createNotification({
    recipient: targetRecipientId,
    actor: sender,
    type: "chat.message",
    title: "New message",
    body: text.slice(0, 140),
    entityType: "Conversation",
    entityId: conversation._id,
    data: { conversationId: conversation._id, messageId: message._id },
  });

  return {
    conversation: serializeConversation(updatedConversation),
    message: serializeMessage(message),
  };
}

async function markConversationSeen({ userId, conversationId }) {
  const conversation = await getConversationForUser(conversationId, userId);
  const now = new Date();

  await Message.updateMany(
    { conversation: conversation._id, recipient: userId, status: { $ne: "seen" } },
    { $set: { status: "seen", seenAt: now } }
  );

  await Conversation.updateOne(
    { _id: conversation._id },
    { $set: { "unreadCounts.$[viewer].count": 0 } },
    { arrayFilters: [{ "viewer.user": userId }] }
  );

  return {
    conversationId: String(conversation._id),
    userId: String(userId),
    seenAt: now,
  };
}

module.exports = {
  getOrCreateConversation,
  getConversationForUser,
  listConversations,
  listMessages,
  createMessage,
  markConversationSeen,
  serializeConversation,
  serializeMessage,
};
