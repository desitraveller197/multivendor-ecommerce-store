const path = require('path');
const dotenvResult = require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });
console.log('Dotenv Result:', dotenvResult);
console.log('MONGO_URI is set:', !!process.env.MONGO_URI);
console.log('MONGO_URI value:', process.env.MONGO_URI);

const mongoose = require('mongoose');
async function test() {
  try {
    console.log('Connecting...');
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 3000 });
    console.log('Connected successfully!');
    await mongoose.connection.close();
  } catch (err) {
    console.error('Connection failed:', err.message);
  }
}
test();
