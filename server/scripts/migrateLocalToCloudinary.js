require('dotenv').config();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');
const { uploadToCloudinary, isCloudinaryConfigured } = require('../utils/cloudinary');

async function migrate() {
  await connectDB();

  if (!isCloudinaryConfigured()) {
    console.error('❌ Cloudinary is not configured. Check server/.env variables.');
    process.exit(1);
  }

  console.log('🏁 Starting migration of local product images to Cloudinary...');

  const products = await Product.find({});
  let migratedCount = 0;

  for (const product of products) {
    const imgUrl = product.image || '';
    
    // Check if the URL is a local or localhost url
    const isLocal = imgUrl.startsWith('/uploads/') || imgUrl.includes('localhost:5000/uploads/');
    
    if (isLocal) {
      // Extract the filename
      const filename = path.basename(imgUrl);
      const localFilePath = path.join(__dirname, '..', 'uploads', filename);

      console.log(`Processing product: "${product.name}" (${product.region})`);
      console.log(`  - Local image path: ${localFilePath}`);

      if (fs.existsSync(localFilePath)) {
        try {
          console.log(`  - Uploading to Cloudinary...`);
          const cloudinaryUrl = await uploadToCloudinary(localFilePath, 'products');
          console.log(`  - Uploaded successfully: ${cloudinaryUrl}`);
          
          product.image = cloudinaryUrl;
          await product.save();
          console.log(`  ✔ Saved to database!`);
          migratedCount++;
        } catch (err) {
          console.error(`  ❌ Failed to upload: ${err.message}`);
        }
      } else {
        console.warn(`  ⚠ Warning: Local file does not exist at ${localFilePath}`);
      }
    }
  }

  console.log(`\n============================================`);
  console.log(`🎉 Migration complete! Migrated ${migratedCount} products to Cloudinary.`);
  console.log(`============================================`);

  await mongoose.connection.close();
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Migration script failed:', err);
  process.exit(1);
});
