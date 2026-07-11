const Wishlist = require('../models/Wishlist');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/wishlist
const getWishlist = asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ customer: req.user._id }).populate('products');
  if (!wishlist) {
    wishlist = await Wishlist.create({ customer: req.user._id, products: [] });
  }
  res.json(wishlist.products);
});

// PUT /api/wishlist
const syncWishlist = asyncHandler(async (req, res) => {
  const { productIds } = req.body;
  if (!Array.isArray(productIds)) {
    res.status(400);
    throw new Error('productIds must be an array');
  }

  let wishlist = await Wishlist.findOne({ customer: req.user._id });
  if (!wishlist) {
    wishlist = new Wishlist({ customer: req.user._id, products: [] });
  }

  const combined = [...new Set([
    ...wishlist.products.map((id) => id.toString()),
    ...productIds,
  ])];

  wishlist.products = combined;
  await wishlist.save();

  const populated = await wishlist.populate('products');
  res.json(populated.products);
});

module.exports = { getWishlist, syncWishlist };
