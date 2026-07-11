const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from server directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Shop = require('../models/Shop');

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGO_URI is not defined in server/.env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('✔ Connected to MongoDB');

  const shops = await Shop.find();
  console.log(`Found ${shops.length} shops in the database.`);

  const charges = [200, 250, 300, 350, 400, 450, 500];

  for (let i = 0; i < shops.length; i++) {
    const shop = shops[i];
    const deliveryCharge = charges[i % charges.length];
    shop.deliveryCharges = deliveryCharge;
    await shop.save();
    console.log(`Updated shop "${shop.name}" with delivery charges: PKR ${deliveryCharge}`);
  }

  await mongoose.connection.close();
  console.log('✔ Migration complete! MongoDB connection closed.');
}

run().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
