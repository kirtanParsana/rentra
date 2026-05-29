let ioRef = null;

function setIO(io) {
  ioRef = io;
}

function getIO() {
  return ioRef;
}

function emitToUser(userId, event, payload) {
  const io = getIO();
  if (!io || !userId) return false;
  io.to(`user:${String(userId)}`).emit(event, payload);
  return true;
}

function emitToConversation(conversationId, event, payload) {
  const io = getIO();
  if (!io || !conversationId) return false;
  io.to(`conversation:${String(conversationId)}`).emit(event, payload);
  return true;
}

module.exports = {
  setIO,
  getIO,
  emitToUser,
  emitToConversation,
};
