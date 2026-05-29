import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchConversations,
  fetchMessages,
  markConversationSeen as markSeenApi,
  openConversation as openConversationApi,
  sendMessage as sendMessageApi,
} from "../api/chat";
import { getApiErrorMessage } from "../api/client";
import { useAuth } from "../providers/AuthProvider";
import { useSocket } from "../providers/SocketProvider";
import { EVENTS } from "../realtime/events";
import { useSocketEvent } from "./useSocketEvent";

function upsertById(list, item) {
  if (!item?._id) return list;
  const exists = list.some((x) => x._id === item._id);
  const next = exists ? list.map((x) => (x._id === item._id ? item : x)) : [item, ...list];
  return next.sort((a, b) => new Date(b.lastMessageAt || b.updatedAt || 0) - new Date(a.lastMessageAt || a.updatedAt || 0));
}

function uniqueMessages(messages) {
  const byKey = new Map();
  messages.forEach((message) => {
    const key = message.clientMessageId || message._id;
    if (key) byKey.set(key, message);
  });
  return Array.from(byKey.values()).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

export function useChat() {
  const { user } = useAuth();
  const { emitWithAck, isConnected } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchConversations();
      setConversations(Array.isArray(data?.conversations) ? data.conversations : []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (isConnected) loadConversations();
  }, [isConnected, loadConversations]);

  const openConversation = useCallback(async (recipientId, conversation = null) => {
    setError("");
    try {
      const data = conversation
        ? { conversation, messages: (await fetchMessages(conversation._id))?.messages || [] }
        : await openConversationApi(recipientId);
      setActiveConversation(data.conversation);
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      setConversations((prev) => upsertById(prev, data.conversation));
      if (isConnected) {
        emitWithAck(EVENTS.CONVERSATION_JOIN, { conversationId: data.conversation._id }).catch(() => {});
      }
      return data.conversation;
    } catch (err) {
      const msg = getApiErrorMessage(err);
      setError(msg);
      throw new Error(msg);
    }
  }, [emitWithAck, isConnected]);

  const sendMessage = useCallback(async ({ body, recipientId }) => {
    const text = String(body || "").trim();
    if (!text) return null;

    const clientMessageId = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    const optimistic = {
      _id: clientMessageId,
      clientMessageId,
      conversation: activeConversation?._id,
      sender: user?.id || user?._id,
      recipient: recipientId,
      body: text,
      status: "sending",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => uniqueMessages([...prev, optimistic]));

    const payload = {
      conversationId: activeConversation?._id,
      recipientId,
      body: text,
      clientMessageId,
    };

    try {
      const data = isConnected
        ? await emitWithAck(EVENTS.MESSAGE_SEND, payload)
        : await sendMessageApi(payload);
      setMessages((prev) => uniqueMessages(prev.map((m) => (m.clientMessageId === clientMessageId ? data.message : m))));
      if (data.conversation) {
        setActiveConversation(data.conversation);
        setConversations((prev) => upsertById(prev, data.conversation));
      }
      return data.message;
    } catch (err) {
      setMessages((prev) => prev.map((m) => (m.clientMessageId === clientMessageId ? { ...m, status: "failed" } : m)));
      const msg = getApiErrorMessage(err);
      setError(msg);
      throw new Error(msg);
    }
  }, [activeConversation, emitWithAck, isConnected, user]);

  const markSeen = useCallback(async (conversationId = activeConversation?._id) => {
    if (!conversationId) return;
    try {
      if (isConnected) {
        await emitWithAck(EVENTS.MESSAGE_SEEN, { conversationId });
      } else {
        await markSeenApi(conversationId);
      }
    } catch {
      // Seen is best-effort; HTTP reload handles recovery.
    }
  }, [activeConversation?._id, emitWithAck, isConnected]);

  const sendTyping = useCallback((event) => {
    if (!activeConversation?._id || !isConnected) return;
    emitWithAck(event, { conversationId: activeConversation._id }, 3000).catch(() => {});
  }, [activeConversation?._id, emitWithAck, isConnected]);

  useSocketEvent(EVENTS.MESSAGE_CREATED, ({ conversation, message }) => {
    if (conversation) setConversations((prev) => upsertById(prev, conversation));
    if (activeConversation?._id === conversation?._id) {
      setMessages((prev) => uniqueMessages([...prev, message]));
      markSeen(conversation._id);
    }
  });

  useSocketEvent(EVENTS.CONVERSATION_UPDATED, ({ conversation }) => {
    if (conversation) setConversations((prev) => upsertById(prev, conversation));
  });

  useSocketEvent(EVENTS.MESSAGE_SEEN, ({ conversationId, userId, seenAt }) => {
    setMessages((prev) =>
      prev.map((m) =>
        String(m.conversation) === String(conversationId) && String(m.sender?._id || m.sender) !== String(userId)
          ? { ...m, status: "seen", seenAt }
          : m
      )
    );
  });

  useSocketEvent(EVENTS.TYPING_START, ({ conversationId, userId }) => {
    setTypingUsers((prev) => ({ ...prev, [conversationId]: userId }));
  });

  useSocketEvent(EVENTS.TYPING_STOP, ({ conversationId }) => {
    setTypingUsers((prev) => {
      const next = { ...prev };
      delete next[conversationId];
      return next;
    });
  });

  return useMemo(
    () => ({
      conversations,
      activeConversation,
      messages,
      typingUsers,
      isLoading,
      error,
      openConversation,
      sendMessage,
      markSeen,
      startTyping: () => sendTyping(EVENTS.TYPING_START),
      stopTyping: () => sendTyping(EVENTS.TYPING_STOP),
      refetch: loadConversations,
      clearError: () => setError(""),
    }),
    [activeConversation, conversations, error, isLoading, loadConversations, markSeen, messages, openConversation, sendMessage, sendTyping, typingUsers]
  );
}
