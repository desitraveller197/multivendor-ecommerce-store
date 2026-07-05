require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');

async function run() {
  await connectDB();

  const categories = await Product.distinct('category');
  console.log('\nAll distinct product categories in DB:');
  categories.sort().forEach(c => console.log(' -', JSON.stringify(c)));

  const total = await Product.countDocuments({ isPublished: true });
  console.log(`\nTotal published products: ${total}`);

  await mongoose.connection.close();
}

run().catch((err) => { console.error(err); process.exit(1); });
