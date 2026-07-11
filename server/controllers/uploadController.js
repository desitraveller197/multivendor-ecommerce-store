const asyncHandler = require('../utils/asyncHandler');
const { uploadToCloudinary, uploadBufferToCloudinary, isCloudinaryConfigured } = require('../utils/cloudinary');

// POST /api/upload/image  (auth) — multer has already written the file
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No image file provided (field name must be "image")');
  }

  // If Cloudinary is configured, upload to Cloudinary!
  if (isCloudinaryConfigured()) {
    try {
      let imageUrl;
      if (req.file.buffer) {
        // Upload from memory buffer (Vercel)
        imageUrl = await uploadBufferToCloudinary(req.file.buffer, 'products');
      } else if (req.file.path) {
        // Upload from local path (Local development)
        imageUrl = await uploadToCloudinary(req.file.path, 'products');
      }
      if (imageUrl) {
        return res.status(201).json({ imageUrl });
      }
    } catch (err) {
      console.error('Cloudinary upload failed, falling back to local storage:', err);
    }
  }

  // Fallback to local storage if Cloudinary is not configured or fails (and we are on local disk storage)
  if (req.file.filename) {
    const imageUrl = `/uploads/${req.file.filename}`;
    return res.status(201).json({ imageUrl });
  }

  res.status(500);
  throw new Error('Failed to upload image (Cloudinary not configured and local disk storage unavailable)');
});

// POST /api/upload/images  (auth) — multer has already written the files
const uploadImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error('No image files provided (field name must be "images")');
  }

  const imageUrls = [];

  for (const file of req.files) {
    let imageUrl = '';
    if (isCloudinaryConfigured()) {
      try {
        if (file.buffer) {
          imageUrl = await uploadBufferToCloudinary(file.buffer, 'products');
        } else if (file.path) {
          imageUrl = await uploadToCloudinary(file.path, 'products');
        }
      } catch (err) {
        console.error('Cloudinary upload failed, falling back to local:', err);
      }
    }

    if (!imageUrl && file.filename) {
      imageUrl = `/uploads/${file.filename}`;
    }

    if (imageUrl) {
      imageUrls.push(imageUrl);
    }
  }

  res.status(201).json({ imageUrls });
});

module.exports = { uploadImage, uploadImages };
