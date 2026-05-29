const EVENTS = require("../events");
const { conversationRoom } = require("../rooms");
const {
  createMessage,
  getConversationForUser,
  getOrCreateConversation,
  listConversations,
  listMessages,
  markConversationSeen,
  serializeConversation,
} = require("../../services/chatService");
const { emitToUser } = require("../services/socketHub");

function emitError(socket, message, details = {}) {
  socket.emit(EVENTS.ERROR, { scope: "chat", message, ...details });
}

function registerChatHandler(io, socket) {
  socket.on(EVENTS.CONVERSATION_LIST, async (_payload = {}, ack) => {
    try {
      const conversations = await listConversations(socket.user.id);
      ack?.({ ok: true, conversations });
    } catch (error) {
      emitError(socket, error.message);
      ack?.({ ok: false, message: error.message });
    }
  });

  socket.on("conversation:open", async (payload = {}, ack) => {
    try {
      const conversation = payload.conversationId
        ? await getConversationForUser(payload.conversationId, socket.user.id)
        : await getOrCreateConversation(socket.user.id, payload.recipientId);

      socket.join(conversationRoom(conversation._id));
      const messages = await listMessages(socket.user.id, conversation._id, { limit: payload.limit });
      ack?.({
        ok: true,
        conversation: serializeConversation(conversation),
        messages,
      });
    } catch (error) {
      emitError(socket, error.message);
      ack?.({ ok: false, message: error.message });
    }
  });

  socket.on(EVENTS.CONVERSATION_JOIN, async (payload = {}, ack) => {
    try {
      const conversation = await getConversationForUser(payload.conversationId, socket.user.id);
      socket.join(conversationRoom(conversation._id));
      ack?.({ ok: true, conversation: serializeConversation(conversation) });
    } catch (error) {
      emitError(socket, error.message);
      ack?.({ ok: false, message: error.message });
    }
  });

  socket.on(EVENTS.CONVERSATION_LEAVE, (payload = {}, ack) => {
    if (payload.conversationId) socket.leave(conversationRoom(payload.conversationId));
    ack?.({ ok: true });
  });

  socket.on("message:list", async (payload = {}, ack) => {
    try {
      const messages = await listMessages(socket.user.id, payload.conversationId, {
        before: payload.before,
        limit: payload.limit,
      });
      ack?.({ ok: true, messages });
    } catch (error) {
      emitError(socket, error.message);
      ack?.({ ok: false, message: error.message });
    }
  });

  socket.on(EVENTS.MESSAGE_SEND, async (payload = {}, ack) => {
    try {
      const result = await createMessage({
        sender: socket.user.id,
        recipient: payload.recipientId,
        conversationId: payload.conversationId,
        body: payload.body,
        clientMessageId: payload.clientMessageId,
      });

      const room = conversationRoom(result.conversation._id);
      socket.join(room);
      io.to(room).emit(EVENTS.MESSAGE_CREATED, result);
      emitToUser(result.message.recipient, EVENTS.CONVERSATION_UPDATED, {
        conversation: result.conversation,
      });
      emitToUser(socket.user.id, EVENTS.CONVERSATION_UPDATED, {
        conversation: result.conversation,
      });

      ack?.({ ok: true, ...result });
    } catch (error) {
      emitError(socket, error.message, { clientMessageId: payload.clientMessageId });
      ack?.({ ok: false, message: error.message, clientMessageId: payload.clientMessageId });
    }
  });

  socket.on(EVENTS.MESSAGE_SEEN, async (payload = {}, ack) => {
    try {
      const result = await markConversationSeen({
        userId: socket.user.id,
        conversationId: payload.conversationId,
      });
      io.to(conversationRoom(payload.conversationId)).emit(EVENTS.MESSAGE_SEEN, result);
      ack?.({ ok: true, ...result });
    } catch (error) {
      emitError(socket, error.message);
      ack?.({ ok: false, message: error.message });
    }
  });

  socket.on(EVENTS.TYPING_START, async (payload = {}, ack) => {
    try {
      await getConversationForUser(payload.conversationId, socket.user.id);
      socket.to(conversationRoom(payload.conversationId)).emit(EVENTS.TYPING_START, {
        conversationId: payload.conversationId,
        userId: socket.user.id,
      });
      ack?.({ ok: true });
    } catch (error) {
      ack?.({ ok: false, message: error.message });
    }
  });

  socket.on(EVENTS.TYPING_STOP, async (payload = {}, ack) => {
    try {
      await getConversationForUser(payload.conversationId, socket.user.id);
      socket.to(conversationRoom(payload.conversationId)).emit(EVENTS.TYPING_STOP, {
        conversationId: payload.conversationId,
        userId: socket.user.id,
      });
      ack?.({ ok: true });
    } catch (error) {
      ack?.({ ok: false, message: error.message });
    }
  });
}

module.exports = registerChatHandler;
