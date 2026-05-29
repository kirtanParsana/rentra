const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const initSocketServer = require("./socket");

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
      : true,
    credentials: true,
  })
);
app.use(express.json());


// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/listings", require("./routes/listingRoutes"));
app.use("/api/uploads", require("./routes/uploadRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));


// Auth Middleware
const protect = require("./middleware/authMiddleware");


// Test Route
app.get("/", (req, res) => {
  res.send("API Running");
});


// Protected Route
app.get("/api/private", protect, (req, res) => {
  res.json({
    message: "Private Route Accessed",
    user: req.user,
  });
});

app.use(notFound);
app.use(errorHandler);

const requiredEnv = ["MONGO_URI", "JWT_SECRET"];
const missingEnv = requiredEnv.filter((k) => !process.env[k]);
if (missingEnv.length) {
  console.error(`Missing required env vars: ${missingEnv.join(", ")}`);
  process.exit(1);
}

connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  initSocketServer(httpServer);
  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
