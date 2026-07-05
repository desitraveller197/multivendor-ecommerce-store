const mongoose = require('mongoose');

/**
 * Connect to MongoDB (Atlas or local) using the MONGO_URI env var.
 * Uses a cached promise so serverless invocations reuse the same connection.
 */
let cached = null;

async function connectDB() {
  // If already connected or connecting, return the cached promise
  if (cached) return cached;

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('✖ MONGO_URI is not set. Copy .env.example to .env and configure it.');
  }

  mongoose.set('strictQuery', true);
  cached = mongoose.connect(uri).then((conn) => {
    console.log(`✔ MongoDB connected: ${conn.connection.host}`);
    return conn;
  }).catch((err) => {
    cached = null; // Reset so next call retries
    console.error(`✖ MongoDB connection error: ${err.message}`);
    throw err;
  });

  return cached;
}

module.exports = connectDB;
