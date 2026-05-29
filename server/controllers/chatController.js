const {
  createMessage,
  getOrCreateConversation,
  listConversations,
  listMessages,
  markConversationSeen,
  serializeConversation,
} = require("../services/chatService");
const EVENTS = require("../socket/events");
const { emitToConversation, emitToUser } = require("../socket/services/socketHub");

exports.getConversations = async (req, res, next) => {
  try {
    const conversations = await listConversations(req.userId);
    return res.status(200).json({ conversations });
  } catch (error) {
    return next(error);
  }
};

exports.openConversation = async (req, res, next) => {
  try {
    const conversation = await getOrCreateConversation(req.userId, req.body?.recipientId);
    const messages = await listMessages(req.userId, conversation._id, { limit: req.body?.limit });
    return res.status(200).json({
      conversation: serializeConversation(conversation),
      messages,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const messages = await listMessages(req.userId, req.params.conversationId, {
      before: req.query?.before,
      limit: req.query?.limit,
    });
    return res.status(200).json({ messages });
  } catch (error) {
    return next(error);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const result = await createMessage({
      sender: req.userId,
      recipient: req.body?.recipientId,
      conversationId: req.body?.conversationId,
      body: req.body?.body,
      clientMessageId: req.body?.clientMessageId,
    });

    emitToConversation(result.conversation._id, EVENTS.MESSAGE_CREATED, result);
    emitToUser(result.message.recipient, EVENTS.CONVERSATION_UPDATED, {
      conversation: result.conversation,
    });
    emitToUser(req.userId, EVENTS.CONVERSATION_UPDATED, {
      conversation: result.conversation,
    });

    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
};

exports.markSeen = async (req, res, next) => {
  try {
    const result = await markConversationSeen({
      userId: req.userId,
      conversationId: req.params.conversationId,
    });
    emitToConversation(req.params.conversationId, EVENTS.MESSAGE_SEEN, result);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};
