/**
 * Seed script — run with `npm run seed` after configuring MONGO_URI.
 * Creates default categories, admin/seller/customer demo accounts, demo shops,
 * and imports every product from the frontend's mockData.js so the catalog
 * matches what the UI was designed around.
 *
 * Pakistani cultural theme: Clothing, Shawls & Dupattas, Footwear (Chappals),
 * Handicrafts & Decor, Organic Beauty, Local Foods
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
const Review = require('../models/Review');
const { buildFilterFields } = require('../utils/productFilterUtils');

/**
 * Load the products array out of the frontend's ESM mockData.js without importing it.
 * We isolate the `export const products = [ ... ]` block and evaluate just that array.
 */
function loadMockProducts() {
  const mockPath = path.join(__dirname, '..', '..', 'my-project', 'src', 'data', 'mockData.js');
  if (!fs.existsSync(mockPath)) {
    console.warn('⚠ mockData.js not found — seeding fallback product set.');
    return FALLBACK_PRODUCTS;
  }
  const src = fs.readFileSync(mockPath, 'utf8');
  const start = src.indexOf('export const products');
  if (start === -1) return FALLBACK_PRODUCTS;
  const arrStart = src.indexOf('[', start);
  // Find matching closing bracket.
  let depth = 0;
  let end = -1;
  for (let i = arrStart; i < src.length; i += 1) {
    if (src[i] === '[') depth += 1;
    else if (src[i] === ']') {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) return FALLBACK_PRODUCTS;
  const arrayLiteral = src.slice(arrStart, end + 1);
  try {
    // eslint-disable-next-line no-eval
    const products = eval(arrayLiteral); // trusted local source file
    return Array.isArray(products) ? products : FALLBACK_PRODUCTS;
  } catch (err) {
    console.warn('⚠ Could not parse mockData products:', err.message);
    return FALLBACK_PRODUCTS;
  }
}

const FALLBACK_PRODUCTS = [
  {
    name: 'Phulkari Dupatta',
    description: 'Hand-embroidered Phulkari dupatta with vibrant floral motifs on a rich orange base.',
    category: 'Shawls & Dupattas',
    price: 3200,
    discountPrice: 2890,
    stock: 22,
    image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=900',
    rating: 4.7,
    region: 'Punjab',
    culture: 'Traditional Clothing',
  },
  {
    name: 'Peshawari Chappal',
    description: 'Iconic all-leather Peshawari chappal, handcrafted by master cobblers.',
    category: 'Footwear (Chappals)',
    price: 4800,
    discountPrice: 4290,
    stock: 35,
    image: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=900',
    rating: 4.8,
    region: 'KPK',
    culture: 'Cultural Accessories',
  },
  {
    name: 'Embroidered Shalwar Kameez',
    description: 'Hand-embroidered cotton shalwar kameez with classic Punjabi threadwork.',
    category: 'Clothing',
    price: 5800,
    discountPrice: 4990,
    stock: 40,
    image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=900',
    rating: 4.7,
    region: 'Punjab',
    culture: 'Traditional Clothing',
  },
];

const DEFAULT_CATEGORIES = [
  'Clothing',
  'Shawls & Dupattas',
  'Footwear (Chappals)',
  'Handicrafts & Decor',
  'Organic Beauty',
  'Local Foods',
];

// Demo sellers — each with their own shop matching the mockData seller names
const DEMO_SELLERS = [
  {
    email: 'punjab@store.pk',
    name: 'Punjab Handloom',
    shopName: 'Punjab Handloom',
    shopDesc: 'Authentic Punjabi textiles, phulkari embroidery, and traditional crafts from the heart of Punjab.',
    deliveryCharges: 250,
  },
  {
    email: 'sindh@store.pk',
    name: 'Sindh Crafts',
    shopName: 'Sindh Crafts Co.',
    shopDesc: 'Ajrak block-prints, Hala pottery, and handcrafted Sindhi heritage products.',
    deliveryCharges: 300,
  },
  {
    email: 'kpk@store.pk',
    name: 'KPK Heritage',
    shopName: 'KPK Heritage Store',
    shopDesc: 'Swati shawls, Peshawari chappals, pashmina, and mountain-region cultural products.',
    deliveryCharges: 350,
  },
  {
    email: 'baloch@store.pk',
    name: 'Baloch Artisans',
    shopName: 'Baloch Artisans',
    shopDesc: 'Balochi mirror-work embroidery, tribal jewellery, and traditional Balochistan crafts.',
    deliveryCharges: 400,
  },
  {
    email: 'seller@store.pk',
    name: 'Demo Seller',
    shopName: 'Bazarix Official Store',
    shopDesc: 'General showcase store with a curated selection of the best Pakistani cultural products.',
    deliveryCharges: 200,
  },
];

async function seed() {
  await connectDB();

  console.log('🗑  Clearing existing data…');
  await Promise.all([
    User.deleteMany({}),
    Shop.deleteMany({}),
    Product.deleteMany({}),
    Category.deleteMany({}),
    Review.deleteMany({}),
  ]);

  // ─── Categories ───────────────────────────────────────────────────────────
  console.log('📦  Seeding categories…');
  await Category.insertMany(DEFAULT_CATEGORIES.map((name) => ({ name })));

  // ─── Users ────────────────────────────────────────────────────────────────
  console.log('👤  Seeding users…');
  await User.create({
    name: 'Admin User',
    email: 'admin@store.pk',
    password: 'admin123',
    role: 'admin',
    isApproved: true,
  });

  const demoCustomer = await User.create({
    name: 'Demo Customer',
    email: 'customer@store.pk',
    password: 'customer123',
    role: 'customer',
    isApproved: true,
  });

  // Create all seller users and their shops
  const shopMap = {}; // shopName → shop document
  for (const sellerData of DEMO_SELLERS) {
    const sellerUser = await User.create({
      name: sellerData.name,
      email: sellerData.email,
      password: 'seller123',
      role: 'seller',
      isApproved: true,
    });
    const shop = await Shop.create({
      owner: sellerUser._id,
      name: sellerData.shopName,
      description: sellerData.shopDesc,
      logo: '',
      isActive: true,
      deliveryCharges: sellerData.deliveryCharges || 200,
    });
    shopMap[sellerData.shopName] = { shop, sellerUser };
  }

  // ─── Products from mockData ───────────────────────────────────────────────
  console.log('🛍  Seeding products from mockData…');
  const mockProducts = loadMockProducts();

  // Default shop/seller for products whose seller name doesn't match a known shop
  const defaultShopEntry = shopMap['Bazarix Official Store'];

  const docs = mockProducts.map((p) => {
    const entry = shopMap[p.seller] || defaultShopEntry;
    const filterFields = buildFilterFields(p);
    return {
      name: p.name,
      description: p.description || p.name,
      price: Number(p.price) || 0,
      discountPrice: p.discountPrice != null ? Number(p.discountPrice) : null,
      stock: Number(p.stock) || 0,
      image: p.image || '',
      category: p.category || '',
      region: p.region,
      culture: p.culture,
      colorFamilies: filterFields.colorFamilies,
      seasons: filterFields.seasons,
      variants: filterFields.variants,
      rating: Number(p.rating) || 0,
      seller: entry.sellerUser._id,
      shop: entry.shop._id,
      sellerName: p.seller || entry.shop.name,
      isPublished: true,
    };
  });

  const insertedProducts = await Product.insertMany(docs);

  // ─── Sample product reviews ───────────────────────────────────────────────
  console.log('⭐  Seeding product reviews…');
  const sampleReviewTexts = [
  { rating: 5, title: 'Excellent quality', comment: 'Beautiful craftsmanship and fast delivery. Highly recommend!' },
  { rating: 5, title: 'Authentic product', comment: 'Exactly as described — genuine regional product with great packaging.' },
  { rating: 4, title: 'Great value', comment: 'Good quality for the price. Will definitely order again from this seller.' },
  { rating: 5, title: 'Loved it!', comment: 'My family loved this purchase. True Pakistani heritage quality.' },
  { rating: 4, title: 'Very satisfied', comment: 'Nice product, arrived on time. Seller was responsive and helpful.' },
  { rating: 5, title: 'Perfect gift', comment: 'Bought this as a gift and it was a huge hit. Stunning details!' },
  ];

  const reviewProducts = [...insertedProducts]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, sampleReviewTexts.length);

  const reviewDocs = reviewProducts.map((product, index) => ({
    product: product._id,
    customer: demoCustomer._id,
    rating: sampleReviewTexts[index].rating,
    title: sampleReviewTexts[index].title,
    comment: sampleReviewTexts[index].comment,
  }));

  if (reviewDocs.length > 0) {
    await Review.insertMany(reviewDocs);
    for (const product of reviewProducts) {
      const productReviews = reviewDocs.filter((r) => String(r.product) === String(product._id));
      const avg =
        productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
      await Product.findByIdAndUpdate(product._id, {
        rating: Math.round(avg * 10) / 10,
        numReviews: productReviews.length,
      });
    }
  }

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log(`\n✅  Seed complete!`);
  console.log(`   Products  : ${docs.length}`);
  console.log(`   Reviews   : ${reviewDocs.length}`);
  console.log(`   Shops     : ${DEMO_SELLERS.length}`);
  console.log(`   Categories: ${DEFAULT_CATEGORIES.length}`);
  console.log('\n🔑  Login Credentials:');
  console.log('   Admin    : admin@store.pk    / admin123');
  console.log('   Customer : customer@store.pk / customer123');
  console.log('   Sellers  : seller@store.pk, punjab@store.pk, sindh@store.pk,');
  console.log('              kpk@store.pk, baloch@store.pk  (password: seller123)');

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
