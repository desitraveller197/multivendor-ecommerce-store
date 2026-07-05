/**
 * Backfill colorFamilies, seasons, and variants on all products.
 * Run: node scripts/backfillProductFilters.js
 */
require('dotenv').config();
const connectDB = require('../config/db');
const Product = require('../models/Product');
const { buildFilterFields } = require('../utils/productFilterUtils');

async function backfill() {
  await connectDB();
  const products = await Product.find({});
  let updated = 0;

  for (const product of products) {
    const fields = buildFilterFields(product);
    const needsUpdate =
      JSON.stringify(product.colorFamilies || []) !== JSON.stringify(fields.colorFamilies) ||
      JSON.stringify(product.seasons || []) !== JSON.stringify(fields.seasons) ||
      (product.variants || []).length === 0;

    if (needsUpdate) {
      product.colorFamilies = fields.colorFamilies;
      product.seasons = fields.seasons;
      if ((product.variants || []).length === 0) {
        product.variants = fields.variants;
      }
      await product.save();
      updated += 1;
    }
  }

  console.log(`✅ Backfill complete. Updated ${updated} of ${products.length} products.`);
  process.exit(0);
}

backfill().catch((err) => {
  console.error('❌ Backfill failed:', err);
  process.exit(1);
});
