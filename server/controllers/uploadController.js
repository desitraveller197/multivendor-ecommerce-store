const asyncHandler = require('../utils/asyncHandler');

// POST /api/upload/image  (auth) — multer has already written the file
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No image file provided (field name must be "image")');
  }
  // Path the frontend can use directly; express.static serves /uploads/*
  const imageUrl = `/uploads/${req.file.filename}`;
  res.status(201).json({ imageUrl });
});

module.exports = { uploadImage };
