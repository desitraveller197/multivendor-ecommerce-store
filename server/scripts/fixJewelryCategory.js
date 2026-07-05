require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');

async function run() {
  await connectDB();

  // Find the product
  const product = await Product.findOne({ name: /Tribal Silver Choker/i });
  if (!product) {
    console.log('❌ Product not found');
    process.exit(1);
  }

  console.log('Found product:', product.name);
  console.log('Current category:', product.category);

  // Fix the category
  product.category = 'Jewelry';
  await product.save();
  console.log('✅ Category updated to "Jewelry" (maps to Fashion)');

  await mongoose.connection.close();
}

run().catch((err) => { console.error(err); process.exit(1); });
