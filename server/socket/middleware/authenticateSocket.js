const jwt = require("jsonwebtoken");
const User = require("../../models/User");

async function authenticateSocket(socket, next) {
  try {
    const rawToken =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "");

    if (!rawToken) {
      const err = new Error("Socket authentication required");
      err.data = { code: "AUTH_REQUIRED" };
      return next(err);
    }

    const decoded = jwt.verify(rawToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("_id name email");
    if (!user) {
      const err = new Error("Socket user not found");
      err.data = { code: "AUTH_USER_NOT_FOUND" };
      return next(err);
    }

    socket.user = {
      id: String(user._id),
      name: user.name,
      email: user.email,
    };
    return next();
  } catch (error) {
    error.data = { code: "AUTH_INVALID" };
    return next(error);
  }
}

module.exports = authenticateSocket;
