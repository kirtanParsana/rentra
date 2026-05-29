const jwt = require("jsonwebtoken");

const protect = async (req, res, next) => {

  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {

    try {

      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      // Keep backward compatibility with existing handlers expecting `req.user`
      req.user = decoded.id;
      req.userId = decoded.id;

      return next();

    } catch (error) {

      return res.status(401).json({
        message: "Not authorized",
      });

    }

  }

  if (!token) {
    return res.status(401).json({
      message: "No token",
    });
  }
};

module.exports = protect;