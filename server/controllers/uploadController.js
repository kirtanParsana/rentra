const { initCloudinary } = require("../config/cloudinary");

function uploadBufferToCloudinary(cloudinary, buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      return resolve(result);
    });
    stream.end(buffer);
  });
}

// POST /api/uploads/listing-images (protected, multipart/form-data)
exports.uploadListingImages = async (req, res, next) => {
  try {
    if (!req.userId) {
      const err = new Error("Not authorized");
      err.statusCode = 401;
      throw err;
    }

    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const cloudinary = initCloudinary();

    const uploads = await Promise.all(
      files.map(async (file) => {
        const result = await uploadBufferToCloudinary(cloudinary, file.buffer, {
          folder: "rentra/listings",
          resource_type: "image",
          // Good defaults: smaller payloads + optimized delivery.
          transformation: [{ quality: "auto", fetch_format: "auto" }],
        });

        const optimizedUrl = cloudinary.url(result.public_id, {
          secure: true,
          transformation: [{ width: 1600, crop: "limit" }, { quality: "auto", fetch_format: "auto" }],
        });

        const thumbUrl = cloudinary.url(result.public_id, {
          secure: true,
          transformation: [{ width: 480, height: 360, crop: "fill" }, { quality: "auto", fetch_format: "auto" }],
        });

        return {
          publicId: result.public_id,
          url: optimizedUrl || result.secure_url,
          thumbUrl,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          format: result.format,
        };
      })
    );

    return res.status(201).json({ images: uploads });
  } catch (err) {
    return next(err);
  }
};

