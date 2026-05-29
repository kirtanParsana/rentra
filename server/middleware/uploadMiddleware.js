const multer = require("multer");

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB per image
const MAX_FILES = 8;

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only JPEG, PNG, and WEBP images are allowed"));
  }
  return cb(null, true);
}

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: MAX_FILES },
  fileFilter,
});

module.exports = { upload, MAX_FILES, MAX_FILE_SIZE_BYTES };

