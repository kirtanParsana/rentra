import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchNotifications,
  markAllNotificationsRead as markAllReadApi,
  markNotificationRead as markReadApi,
} from "../api/notifications";
import { getApiErrorMessage } from "../api/client";
import { EVENTS } from "../realtime/events";
import { useSocketEvent } from "./useSocketEvent";
import { useSocket } from "../providers/SocketProvider";

function mergeNotification(list, notification) {
  if (!notification?._id) return list;
  const exists = list.some((item) => item._id === notification._id);
  if (exists) return list.map((item) => (item._id === notification._id ? notification : item));
  return [notification, ...list];
}

export function useNotifications() {
  const { isConnected } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchNotifications();
      setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
      setUnreadCount(Number(data?.unreadCount || 0));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isConnected) load();
  }, [isConnected, load]);

  useSocketEvent(EVENTS.NOTIFICATION_CREATED, ({ notification }) => {
    setNotifications((prev) => mergeNotification(prev, notification));
    if (!notification?.readAt) setUnreadCount((count) => count + 1);
  });

  useSocketEvent(EVENTS.NOTIFICATION_READ, ({ notification }) => {
    setNotifications((prev) => mergeNotification(prev, notification));
    setUnreadCount((count) => Math.max(0, count - 1));
  });

  useSocketEvent(EVENTS.NOTIFICATIONS_READ_ALL, ({ readAt }) => {
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || readAt })));
    setUnreadCount(0);
  });

  const markRead = useCallback(async (id) => {
    const data = await markReadApi(id);
    if (data?.notification) {
      setNotifications((prev) => mergeNotification(prev, data.notification));
      setUnreadCount((count) => Math.max(0, count - 1));
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const data = await markAllReadApi();
    const readAt = data?.readAt || new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || readAt })));
    setUnreadCount(0);
  }, []);

  return useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      error,
      refetch: load,
      markRead,
      markAllRead,
    }),
    [error, isLoading, load, markAllRead, markRead, notifications, unreadCount]
  );
}
