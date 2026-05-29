import { apiClient } from "./client";

export async function fetchNotifications() {
  const { data } = await apiClient.get("/notifications");
  return data;
}

export async function markNotificationRead(id) {
  const { data } = await apiClient.patch(`/notifications/${id}/read`);
  return data;
}

export async function markAllNotificationsRead() {
  const { data } = await apiClient.patch("/notifications/read-all");
  return data;
}
