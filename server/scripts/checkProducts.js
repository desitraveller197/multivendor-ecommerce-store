require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');

async function run() {
  await connectDB();
  const products = await Product.find({}, 'name image region');
  console.log('Product list:');
  products.forEach(p => {
    console.log(`- [${p.region}] Name: "${p.name}" | Image: "${p.image}"`);
  });
  await mongoose.connection.close();
}

run();
