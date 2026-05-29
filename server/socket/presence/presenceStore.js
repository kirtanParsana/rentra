const users = new Map();
const disconnectTimers = new Map();
const OFFLINE_GRACE_MS = 8000;

function getUserSockets(userId) {
  const key = String(userId);
  if (!users.has(key)) users.set(key, new Map());
  return users.get(key);
}

function markOnline({ userId, socketId, connectedAt = new Date(), deviceId = "" }) {
  const key = String(userId);
  const wasOnline = isOnline(key);
  const timer = disconnectTimers.get(key);
  if (timer) {
    clearTimeout(timer);
    disconnectTimers.delete(key);
  }

  getUserSockets(key).set(socketId, {
    socketId,
    deviceId,
    connectedAt,
    lastSeenAt: connectedAt,
  });

  return {
    userId: key,
    becameOnline: !wasOnline,
    connections: getConnectionCount(key),
  };
}

function scheduleOffline({ userId, socketId, onOffline }) {
  const key = String(userId);
  const sockets = users.get(key);
  if (sockets) {
    sockets.delete(socketId);
    if (sockets.size === 0) users.delete(key);
  }

  if (isOnline(key) || disconnectTimers.has(key)) {
    return { userId: key, becameOffline: false, connections: getConnectionCount(key) };
  }

  const timer = setTimeout(() => {
    disconnectTimers.delete(key);
    onOffline?.(key);
  }, OFFLINE_GRACE_MS);
  disconnectTimers.set(key, timer);

  return { userId: key, becameOffline: true, connections: 0 };
}

function isOnline(userId) {
  return (users.get(String(userId))?.size || 0) > 0;
}

function getConnectionCount(userId) {
  return users.get(String(userId))?.size || 0;
}

function getPresenceFor(userIds) {
  return Array.from(new Set((userIds || []).map(String))).map((userId) => ({
    userId,
    online: isOnline(userId),
    connections: getConnectionCount(userId),
  }));
}

module.exports = {
  markOnline,
  scheduleOffline,
  isOnline,
  getConnectionCount,
  getPresenceFor,
};
