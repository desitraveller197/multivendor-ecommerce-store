const asyncHandler = require('../utils/asyncHandler');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const { getOrCreateShop } = require('./productController');

// GET /api/shops  (public) — browse active shops
const listShops = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 12);
  const filter = { isActive: true };
  if (req.query.q) filter.name = { $regex: req.query.q, $options: 'i' };

  const shops = await Shop.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  res.json(shops);
});

// GET /api/shops/my  (seller) — auto-creates if absent
const getMyShop = asyncHandler(async (req, res) => {
  const shop = await getOrCreateShop(req.user);
  res.json(shop);
});

// PUT /api/shops/my  (seller)
const updateMyShop = asyncHandler(async (req, res) => {
  const shop = await getOrCreateShop(req.user);
  const { name, description, logo, banner, deliveryCharges, taxRate } = req.body;
  if (name !== undefined) shop.name = name;
  if (description !== undefined) shop.description = description;
  if (logo !== undefined) shop.logo = logo;
  if (banner !== undefined) shop.banner = banner;
  if (deliveryCharges !== undefined) shop.deliveryCharges = Number(deliveryCharges) || 0;
  if (taxRate !== undefined) shop.taxRate = Number(taxRate) || 0;
  await shop.save();
  res.json(shop);
});

// GET /api/shops/:id  (public)
const getShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.id).populate('owner', 'name createdAt');
  if (!shop) {
    res.status(404);
    throw new Error('Shop not found');
  }
  // Provide fields the frontend ShopPage reads (totalSales, joinedDate).
  const json = shop.toJSON();
  json.totalSales = shop.totalOrders;
  json.joinedDate = shop.createdAt;
  res.json(json);
});

// GET /api/shops/:id/products  (public)
const getShopProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(500, parseInt(req.query.limit, 10) || 12);
  const products = await Product.find({ shop: req.params.id, isPublished: true })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  res.json(products);
});

module.exports = { listShops, getMyShop, updateMyShop, getShop, getShopProducts };
