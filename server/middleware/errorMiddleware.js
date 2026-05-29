const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const statusCode =
    err?.statusCode ||
    (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);

  // Mongoose: invalid ObjectId cast
  if (err?.name === "CastError") {
    res.status(400);
    return res.json({ message: "Invalid id" });
  }

  // Mongoose validation errors
  if (err?.name === "ValidationError") {
    res.status(400);
    return res.json({ message: err.message });
  }

  // Multer / upload errors
  if (err?.name === "MulterError") {
    res.status(400);
    return res.json({ message: err.message });
  }

  res.status(statusCode).json({
    message: err?.message || "Server Error",
    ...(process.env.NODE_ENV === "production" ? {} : { stack: err?.stack }),
  });
};

module.exports = { notFound, errorHandler };

