/**
 * Seed Sindhi Culture Products
 * ────────────────────────────
 * Reads output/products.json + output/images/* and:
 *   1. Upserts every unique category into the Category collection
 *   2. Copies product images from output/images/<id>_<slug>/ → server/uploads/
 *   3. Creates a "Sindh Handicrafts" seller + shop (or reuses existing)
 *   4. Inserts all products into the Product collection
 *
 * Run:  node seed/seedSindhiProducts.js
 */
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const connectDB = require('../config/db');
const User = require('../models/User');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { uploadToCloudinary, isCloudinaryConfigured } = require('../utils/cloudinary');

// ─── Paths ──────────────────────────────────────────────────────────────
const OUTPUT_DIR = path.join(__dirname, '..', '..', 'output');
const PRODUCTS_JSON = path.join(OUTPUT_DIR, 'products.json');
const IMAGES_DIR = path.join(OUTPUT_DIR, 'images_clean');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// ─── Helpers ────────────────────────────────────────────────────────────

/** Decode HTML entities like &amp; → & */
function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

/** Copy a file, creating dest dir if needed */
function copyFile(src, dest) {
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(src, dest);
}

/** Build a slug from product id + name */
function slugify(id, name) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${id}_${slug}`;
}

// ─── Main seed function ─────────────────────────────────────────────────
async function seedSindhiProducts() {
  await connectDB();

  // 1) Load products.json
  if (!fs.existsSync(PRODUCTS_JSON)) {
    console.error('❌  products.json not found at:', PRODUCTS_JSON);
    process.exit(1);
  }
  const rawProducts = JSON.parse(fs.readFileSync(PRODUCTS_JSON, 'utf8'));
  console.log(`📦  Loaded ${rawProducts.length} products from products.json`);

  // 2) Collect & upsert categories
  const categorySet = new Set();
  rawProducts.forEach((p) => {
    (p.categories || []).forEach((c) => categorySet.add(decodeEntities(c)));
  });
  const categoryNames = [...categorySet].sort();
  console.log(`📂  Found ${categoryNames.length} unique categories`);

  for (const name of categoryNames) {
    const exists = await Category.findOne({ name });
    if (!exists) {
      await Category.create({ name });
      console.log(`   ✅  Created category: ${name}`);
    } else {
      console.log(`   ⏭️  Category exists: ${name}`);
    }
  }

  // 3) Ensure a seller + shop for these products
  const SELLER_EMAIL = 'sindhihandcrafts@store.pk';
  
  // Delete old Sindh Handicrafts seller and shop to avoid duplicates
  const oldSeller = await User.findOne({ email: 'sindh@store.pk' });
  if (oldSeller) {
    await Shop.deleteMany({ owner: oldSeller._id });
    await User.deleteOne({ _id: oldSeller._id });
    console.log('🗑️  Removed old seller account sindh@store.pk and its shop');
  }

  let sellerUser = await User.findOne({ email: SELLER_EMAIL });
  if (!sellerUser) {
    sellerUser = await User.create({
      name: 'Sindhi Handcrafts Seller',
      email: SELLER_EMAIL,
      password: 'seller123',
      role: 'seller',
      isApproved: true,
    });
    console.log('👤  Created seller user: sindhihandcrafts@store.pk');
  } else {
    console.log('👤  Using existing seller: sindhihandcrafts@store.pk');
  }

  let shop = await Shop.findOne({ owner: sellerUser._id });
  if (!shop) {
    shop = await Shop.create({
      owner: sellerUser._id,
      name: 'sindhihandcrafts',
      description: 'Authentic Sindhi culture products — Ajrak, Topi, Shawls, Embroidery & more.',
      logo: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=200',
      banner: 'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=1200',
      isActive: true,
    });
    console.log('🏪  Created shop: sindhihandcrafts');
  } else {
    shop.name = 'sindhihandcrafts';
    shop.logo = 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=200';
    shop.banner = 'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=1200';
    await shop.save();
    console.log(`🏪  Updated existing shop: ${shop.name}`);
  }

  // 4) Ensure uploads dir exists
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  const useCloudinary = isCloudinaryConfigured();
  if (useCloudinary) {
    console.log('☁️  Cloudinary configuration detected! Seeding photos directly to Cloudinary...');
  } else {
    console.log('📁  Cloudinary credentials not found. Seeding photos locally to /uploads/');
  }

  // 5) Build product docs & copy/upload images
  console.log('\n🛍️  Processing products…');
  const productDocs = [];
  let imagesCopied = 0;

  for (const p of rawProducts) {
    const productSlug = slugify(p.id, p.name);
    const imageFolder = path.join(IMAGES_DIR, productSlug);

    // Collect local image paths for this product
    const localImages = [];
    let primaryImage = '';

    // Check if we have local images for this product
    if (fs.existsSync(imageFolder)) {
      const imgFiles = fs.readdirSync(imageFolder)
        .filter((f) => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
        .sort();

      const filesToProcess = useCloudinary ? imgFiles.slice(0, 1) : imgFiles;

      for (const imgFile of filesToProcess) {
        const srcPath = path.join(imageFolder, imgFile);
        // Unique filename: productId-originalname
        const destFilename = `${p.id}-${imgFile}`;
        const destPath = path.join(UPLOADS_DIR, destFilename);

        let imageUrl;
        if (useCloudinary) {
          console.log(`   📤  Uploading ${imgFile} for product "${p.name}" to Cloudinary...`);
          imageUrl = await uploadToCloudinary(srcPath, 'products');
        } else {
          copyFile(srcPath, destPath);
          imageUrl = `/uploads/${destFilename}`;
        }
        imagesCopied++;

        localImages.push(imageUrl);
      }
    }

    // Only keep products that have local clean images uploaded
    if (localImages.length === 0) {
      continue;
    }
    primaryImage = localImages[0];

    // Decode category names
    const categories = (p.categories || []).map(decodeEntities);
    // Use the first category as the primary category string
    const primaryCategory = categories[0] || '';

    const doc = {
      name: p.name,
      description: p.description || p.name,
      price: p.sale_price || p.price || 0,
      discountPrice: p.on_sale && p.sale_price ? p.sale_price : null,
      stock: p.in_stock ? 50 : 0, // Default stock: 50 for in-stock, 0 for out-of-stock
      image: primaryImage,
      images: localImages,
      category: primaryCategory,
      region: 'Sindh',
      culture: 'Sindhi Culture',
      rating: (Math.random() * 1 + 4).toFixed(1), // Random rating between 4.0 - 5.0
      numReviews: Math.floor(Math.random() * 30) + 5,
      seller: sellerUser._id,
      shop: shop._id,
      sellerName: shop.name,
      isPublished: true,
    };

    productDocs.push(doc);
  }

  // 6) Clear existing products to avoid duplicates
  const deleted = await Product.deleteMany({});
  console.log(`🗑️  Cleared ${deleted.deletedCount} old products from database`);

  // 7) Insert all products
  await Product.insertMany(productDocs);

  // ─── Summary ────────────────────────────────────────────────────────────
  console.log(`\n✅  Seed complete!`);
  console.log(`   Products inserted : ${productDocs.length}`);
  console.log(`   Categories        : ${categoryNames.length}`);
  console.log(`   Images copied     : ${imagesCopied}`);
  console.log(`   Seller            : sindh@store.pk (password: seller123)`);
  console.log(`   Shop              : ${shop.name}`);

  await mongoose.connection.close();
  process.exit(0);
}

seedSindhiProducts().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
