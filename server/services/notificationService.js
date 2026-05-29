const Notification = require("../models/Notification");
const EVENTS = require("../socket/events");
const { emitToUser } = require("../socket/services/socketHub");

function serializeNotification(notification) {
  if (!notification) return null;
  const n = notification.toObject ? notification.toObject() : notification;
  return {
    _id: n._id,
    recipient: n.recipient,
    actor: n.actor,
    type: n.type,
    title: n.title,
    body: n.body,
    entityType: n.entityType,
    entityId: n.entityId,
    data: n.data || {},
    readAt: n.readAt,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  };
}

async function createNotification({
  recipient,
  actor = null,
  type,
  title,
  body = "",
  entityType = "",
  entityId = null,
  data = {},
}) {
  if (!recipient || !type || !title) return null;

  const notification = await Notification.create({
    recipient,
    actor,
    type,
    title,
    body,
    entityType,
    entityId,
    data,
  });

  const payload = serializeNotification(notification);
  emitToUser(recipient, EVENTS.NOTIFICATION_CREATED, { notification: payload });
  return payload;
}

async function listNotifications(userId, { limit = 30 } = {}) {
  const notifications = await Notification.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 30, 100))
    .populate("actor", "name email");

  const unreadCount = await Notification.countDocuments({
    recipient: userId,
    readAt: null,
  });

  return {
    unreadCount,
    notifications: notifications.map(serializeNotification),
  };
}

async function markNotificationRead(userId, notificationId) {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { $set: { readAt: new Date() } },
    { new: true }
  );
  const payload = serializeNotification(notification);
  if (payload) emitToUser(userId, EVENTS.NOTIFICATION_READ, { notification: payload });
  return payload;
}

async function markAllNotificationsRead(userId) {
  const now = new Date();
  await Notification.updateMany(
    { recipient: userId, readAt: null },
    { $set: { readAt: now } }
  );
  emitToUser(userId, EVENTS.NOTIFICATIONS_READ_ALL, { readAt: now });
  return { readAt: now };
}

module.exports = {
  createNotification,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  serializeNotification,
};
