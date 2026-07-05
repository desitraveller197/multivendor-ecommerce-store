const cloudinary = require('cloudinary').v2;
const fs = require('fs');

const isCloudinaryConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Uploads a local file to Cloudinary.
 * @param {string} filePath - Absolute or relative path to the local file.
 * @param {string} folder - Target Cloudinary folder name.
 * @returns {Promise<string>} The secure URL of the uploaded image.
 */
const uploadToCloudinary = async (filePath, folder = 'products') => {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.');
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'auto',
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

/**
 * Uploads a file buffer directly to Cloudinary.
 * @param {Buffer} buffer - File buffer from memory storage.
 * @param {string} folder - Target Cloudinary folder name.
 * @returns {Promise<string>} The secure URL of the uploaded image.
 */
const uploadBufferToCloudinary = (buffer, folder = 'products') => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      return reject(new Error('Cloudinary is not configured.'));
    }
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => {
        if (error) {
          console.error('Cloudinary stream upload error:', error);
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};

module.exports = {
  uploadToCloudinary,
  uploadBufferToCloudinary,
  isCloudinaryConfigured,
};
