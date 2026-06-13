const mongoose = require('mongoose');

/**
 * Connect to MongoDB (Atlas or local) using the MONGO_URI env var.
 * Exits the process on failure so a misconfigured server never appears "up".
 */
async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('✖ MONGO_URI is not set. Copy .env.example to .env and configure it.');
    process.exit(1);
  }
  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(uri);
    console.log(`✔ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`✖ MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
}

module.exports = connectDB;
