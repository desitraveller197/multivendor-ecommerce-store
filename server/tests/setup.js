/**
 * Test setup: connect to a test MongoDB if MONGO_URI_TEST (or MONGO_URI) is reachable.
 * If no database is reachable, tests that need one are skipped via global.__DB_READY__.
 */
const mongoose = require('mongoose');

module.exports = async function connectTestDB() {
  const uri = process.env.MONGO_URI_TEST || process.env.MONGO_URI;
  if (!uri) return false;
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    return true;
  } catch {
    return false;
  }
};
