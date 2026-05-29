const cloudinary = require("cloudinary").v2;

function initCloudinary() {
  const required = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    const err = new Error(`Missing Cloudinary env vars: ${missing.join(", ")}`);
    err.statusCode = 500;
    throw err;
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  return cloudinary;
}

module.exports = { cloudinary, initCloudinary };

