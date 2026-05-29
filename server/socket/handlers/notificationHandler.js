const EVENTS = require("../events");
const {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require("../../services/notificationService");

function emitError(socket, message, details = {}) {
  socket.emit(EVENTS.ERROR, { scope: "notifications", message, ...details });
}

function registerNotificationHandler(_io, socket) {
  socket.on("notification:list", async (payload = {}, ack) => {
    try {
      const data = await listNotifications(socket.user.id, { limit: payload.limit });
      ack?.({ ok: true, ...data });
    } catch (error) {
      emitError(socket, error.message);
      ack?.({ ok: false, message: error.message });
    }
  });

  socket.on("notification:mark_read", async (payload = {}, ack) => {
    try {
      const notification = await markNotificationRead(socket.user.id, payload.notificationId);
      ack?.({ ok: true, notification });
    } catch (error) {
      emitError(socket, error.message);
      ack?.({ ok: false, message: error.message });
    }
  });

  socket.on("notification:mark_all_read", async (_payload = {}, ack) => {
    try {
      const result = await markAllNotificationsRead(socket.user.id);
      ack?.({ ok: true, ...result });
    } catch (error) {
      emitError(socket, error.message);
      ack?.({ ok: false, message: error.message });
    }
  });
}

module.exports = registerNotificationHandler;
