/**
 * Seed dummy shops + sample products for the Electronics, Home, Beauty and
 * Accessories categories (Fashion is excluded — the store already has plenty).
 *
 * - Creates 4 dedicated shops (one per category) with random names + a seller.
 * - 3 products per category, all from that category's shop.
 * - Images (product + shop logo) are uploaded to Cloudinary so they load
 *   reliably (external hotlinks can be blocked by browsers).
 * - Category / name keywords are chosen so the storefront's classifier groups
 *   each product under the right broad category.
 * - Additive & idempotent: re-running reuses the same shops/sellers and
 *   replaces only these products (by name); nothing else is touched.
 *
 * Run:  node seed/seedCategoryProducts.js   (from the server/ directory)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { buildFilterFields } = require('../utils/productFilterUtils');
const User = require('../models/User');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { uploadToCloudinary, isCloudinaryConfigured } = require('../utils/cloudinary');

const unsplash = (id) => `https://images.unsplash.com/photo-${id}?w=800&q=80`;

// One dummy shop per category (random names).
const SHOPS = {
  Electronics: {
    name: 'Voltix Hub',
    email: 'voltix@store.pk',
    description: 'Gadgets, audio and smart electronics for everyday life.',
    logoSrc: unsplash('1498049794561-7780e7231661'),
  },
  Home: {
    name: 'Nestora Living',
    email: 'nestora@store.pk',
    description: 'Handcrafted home décor, cookware and cozy living essentials.',
    logoSrc: unsplash('1556910103-1c02745aae4d'),
  },
  Beauty: {
    name: 'Lumière Glow',
    email: 'lumiere@store.pk',
    description: 'Organic skincare, herbal beauty and self-care products.',
    logoSrc: unsplash('1556228578-8c89e6adf883'),
  },
  Accessories: {
    name: 'Adorna Accessories',
    email: 'adorna@store.pk',
    description: 'Handmade jewelry, bags, footwear and finishing touches.',
    logoSrc: unsplash('1535632066927-ab7c9ab60908'),
  },
};

// group = which shop/category; category string + name drive the classifier.
const PLAN = [
  // ── Electronics ──
  { group: 'Electronics', name: 'Wireless Noise-Canceling Earbuds', category: 'Electronics', price: 8900, discountPrice: 7490, stock: 40, src: unsplash('1606220588913-b3aacb4d2f46') },
  { group: 'Electronics', name: 'Portable Bluetooth Speaker 20W', category: 'Electronics', price: 5200, discountPrice: 4499, stock: 35, src: unsplash('1608043152269-423dbba4e7e1') },
  { group: 'Electronics', name: '4K Action Camera', category: 'Electronics', price: 18500, discountPrice: 15999, stock: 18, src: unsplash('1502920917128-1aa500764cbd') },

  // ── Home ──
  { group: 'Home', name: 'Copper Karahi Cookware Set', category: 'Home Decor', price: 6900, discountPrice: 6290, stock: 20, src: unsplash('1556910103-1c02745aae4d') },
  { group: 'Home', name: 'Blue Pottery Decorative Vase', category: 'Home Decor', price: 3400, discountPrice: null, stock: 25, src: unsplash('1578500494198-246f612d3b3d') },
  { group: 'Home', name: 'Hand-block Cushion Cover (Set of 2)', category: 'Home Decor', price: 2200, discountPrice: 1899, stock: 50, src: unsplash('1584100936595-c0654b55a2e2') },

  // ── Beauty ──
  { group: 'Beauty', name: 'Herbal Henna Cone Pack', category: 'Beauty', price: 900, discountPrice: 749, stock: 80, src: unsplash('1595950653106-6c9ebd614d3a') },
  { group: 'Beauty', name: 'Pure Almond Hair Oil', category: 'Beauty', price: 1300, discountPrice: null, stock: 70, src: unsplash('1556228720-195a672e8a03') },
  { group: 'Beauty', name: 'Organic Skincare Face Cream', category: 'Beauty', price: 1800, discountPrice: 1499, stock: 55, src: unsplash('1556228578-8c89e6adf883') },

  // ── Accessories ──
  { group: 'Accessories', name: 'Handmade Leather Khussa', category: 'Accessories', price: 3200, discountPrice: 2790, stock: 45, src: unsplash('1543163521-1bf539c55dd2') },
  { group: 'Accessories', name: 'Silver Jhumka Earrings', category: 'Accessories', price: 2500, discountPrice: null, stock: 60, src: unsplash('1535632066927-ab7c9ab60908') },
  { group: 'Accessories', name: 'Embroidered Sling Bag', category: 'Accessories', price: 2800, discountPrice: 2399, stock: 30, src: unsplash('1584917865442-de89df76afd3') },
];

/** Find-or-create a seller + shop for a category, with a Cloudinary logo. */
async function ensureShop(cfg) {
  let seller = await User.findOne({ email: cfg.email });
  if (!seller) {
    seller = await User.create({
      name: `${cfg.name} Seller`,
      email: cfg.email,
      password: 'seller123',
      role: 'seller',
      isApproved: true,
    });
  }

  let shop = await Shop.findOne({ owner: seller._id });
  const logo = await uploadToCloudinary(cfg.logoSrc, 'shops');
  if (!shop) {
    shop = await Shop.create({
      owner: seller._id,
      name: cfg.name,
      description: cfg.description,
      logo,
      isActive: true,
    });
  } else {
    shop.name = cfg.name;
    shop.description = cfg.description;
    shop.logo = logo;
    await shop.save();
  }
  return shop;
}

async function run() {
  await connectDB();

  if (!isCloudinaryConfigured()) {
    console.error('❌  Cloudinary is not configured (set CLOUDINARY_* in .env).');
    process.exit(1);
  }

  // 1) Ensure the broad categories exist in the Category collection
  const categoriesToEnsure = ['Electronics', 'Beauty', 'Home Decor', 'Accessories'];
  for (const name of categoriesToEnsure) {
    const exists = await Category.findOne({ name });
    if (!exists) {
      await Category.create({ name });
      console.log(`📦 Created category: ${name}`);
    }
  }

  // 2) Create/ensure the 4 category shops.
  const shopByGroup = {};
  for (const [group, cfg] of Object.entries(SHOPS)) {
    console.log(`🏪  Ensuring shop "${cfg.name}" (${group})…`);
    shopByGroup[group] = await ensureShop(cfg);
  }

  // 2) Build products, uploading each image to Cloudinary.
  const docs = [];
  for (const p of PLAN) {
    const shop = shopByGroup[p.group];
    console.log(`☁️  Uploading image for "${p.name}"…`);
    const imageUrl = await uploadToCloudinary(p.src, 'products');
    const filterFields = buildFilterFields(p);
    docs.push({
      name: p.name,
      description: `${p.name} — available at ${shop.name}.`,
      price: p.price,
      discountPrice: p.discountPrice,
      stock: p.stock,
      image: imageUrl,
      images: [imageUrl],
      category: p.category,
      colorFamilies: filterFields.colorFamilies,
      seasons: filterFields.seasons,
      variants: filterFields.variants,
      rating: Number((Math.random() + 4).toFixed(1)),
      numReviews: Math.floor(Math.random() * 30) + 5,
      seller: shop.owner,
      shop: shop._id,
      sellerName: shop.name,
      isPublished: true,
    });
  }

  // 3) Idempotent: remove previously-seeded copies (by name), then insert.
  const names = docs.map((d) => d.name);
  const removed = await Product.deleteMany({ name: { $in: names } });
  await Product.insertMany(docs);

  console.log(`\n✅  Done. Shops: ${Object.keys(SHOPS).length} | Products: ${docs.length} (removed ${removed.deletedCount} old copies).`);
  for (const [group, shop] of Object.entries(shopByGroup)) {
    console.log(`   🏬 ${shop.name} (${group})`);
    docs.filter((d) => d.sellerName === shop.name).forEach((d) => console.log(`        • ${d.name}`));
  }

  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
