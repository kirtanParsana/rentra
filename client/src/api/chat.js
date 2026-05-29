import { apiClient } from "./client";

export async function fetchConversations() {
  const { data } = await apiClient.get("/chat/conversations");
  return data;
}

export async function openConversation(recipientId) {
  const { data } = await apiClient.post("/chat/conversations", { recipientId });
  return data;
}

export async function fetchMessages(conversationId) {
  const { data } = await apiClient.get(`/chat/conversations/${conversationId}/messages`);
  return data;
}

export async function sendMessage(payload) {
  const { data } = await apiClient.post("/chat/messages", payload);
  return data;
}

export async function markConversationSeen(conversationId) {
  const { data } = await apiClient.patch(`/chat/conversations/${conversationId}/seen`);
  return data;
}
