const EVENTS = require("../events");
const { userRoom } = require("../rooms");
const presenceStore = require("../presence/presenceStore");

function registerPresenceHandler(io, socket) {
  const userId = socket.user.id;
  socket.join(userRoom(userId));

  const state = presenceStore.markOnline({
    userId,
    socketId: socket.id,
    connectedAt: new Date(),
    deviceId: socket.handshake.auth?.deviceId || "",
  });

  socket.emit(EVENTS.CONNECTED, {
    socketId: socket.id,
    user: socket.user,
    connections: state.connections,
  });

  socket.emit(EVENTS.PRESENCE_SYNC, {
    users: presenceStore.getPresenceFor([userId]),
  });

  if (state.becameOnline) {
    socket.broadcast.emit(EVENTS.PRESENCE_USER_ONLINE, { userId, online: true });
  }

  socket.on("presence:watch", (payload = {}, ack) => {
    const userIds = Array.isArray(payload.userIds) ? payload.userIds : [];
    const users = presenceStore.getPresenceFor(userIds);
    ack?.({ ok: true, users });
  });

  socket.on("disconnect", () => {
    presenceStore.scheduleOffline({
      userId,
      socketId: socket.id,
      onOffline: (offlineUserId) => {
        io.emit(EVENTS.PRESENCE_USER_OFFLINE, {
          userId: offlineUserId,
          online: false,
          lastSeenAt: new Date(),
        });
      },
    });
  });
}

module.exports = registerPresenceHandler;
