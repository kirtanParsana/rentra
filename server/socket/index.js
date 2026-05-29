const { Server } = require("socket.io");
const authenticateSocket = require("./middleware/authenticateSocket");
const registerPresenceHandler = require("./handlers/presenceHandler");
const registerNotificationHandler = require("./handlers/notificationHandler");
const registerChatHandler = require("./handlers/chatHandler");
const { setIO } = require("./services/socketHub");

function initSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
        : true,
      credentials: true,
    },
    transports: ["websocket", "polling"],
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  setIO(io);
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    registerPresenceHandler(io, socket);
    registerNotificationHandler(io, socket);
    registerChatHandler(io, socket);
  });

  return io;
}

module.exports = initSocketServer;
