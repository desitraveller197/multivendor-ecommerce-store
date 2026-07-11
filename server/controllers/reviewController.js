const asyncHandler = require('../utils/asyncHandler');
const Review = require('../models/Review');
const Product = require('../models/Product');

function formatReview(doc) {
  const review = { ...doc };
  if (review._id) {
    review.id = review._id;
    delete review._id;
  }
  delete review.__v;

  if (review.customer && typeof review.customer === 'object') {
    review.customerName = review.customer.name || 'Customer';
    review.customerId = review.customer._id || review.customer.id;
    delete review.customer;
  }

  if (review.product && typeof review.product === 'object') {
    review.productName = review.product.name || '';
    review.productImage = review.product.image || '';
    review.productId = review.product._id || review.product.id;
    delete review.product;
  }

  return review;
}

// GET /api/reviews/recent?limit=6
const getRecentReviews = asyncHandler(async (req, res) => {
  const limit = Math.min(20, parseInt(req.query.limit, 10) || 6);

  const reviews = await Review.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('customer', 'name')
    .populate('product', 'name image rating')
    .lean();

  res.json(reviews.map(formatReview));
});

// GET /api/reviews/product/:productId
const getProductReviews = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId).select('_id');
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const reviews = await Review.find({ product: product._id })
    .sort({ createdAt: -1 })
    .populate('customer', 'name')
    .lean();

  res.json(reviews.map(formatReview));
});

// POST /api/reviews/product/:productId  (auth, customer-only)
const createReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const Order = require('../models/Order');

  if (!rating || rating < 1 || rating > 5) {
    res.status(400);
    throw new Error('Please provide a rating between 1 and 5');
  }

  // 1. Verify user purchased this product and the order is paid & delivered
  const verifiedPurchase = await Order.findOne({
    customer: req.user._id,
    orderStatus: 'Delivered',
    isPaid: true,
    'orderItems.product': req.params.productId,
  });

  if (!verifiedPurchase) {
    res.status(400);
    throw new Error('You can only review products you have purchased and had delivered.');
  }

  // 2. Check if already reviewed
  const exists = await Review.findOne({
    customer: req.user._id,
    product: req.params.productId,
  });
  if (exists) {
    res.status(400);
    throw new Error('You have already submitted a review for this product.');
  }

  // 3. Create review
  const review = await Review.create({
    customer: req.user._id,
    product: req.params.productId,
    rating: Number(rating),
    comment: comment || '',
  });

  // 4. Update product rating and reviews count
  const allReviews = await Review.find({ product: req.params.productId });
  const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
  await Product.findByIdAndUpdate(req.params.productId, {
    rating: Math.round(avgRating * 10) / 10,
    numReviews: allReviews.length,
  });

  const populated = await review.populate('customer', 'name');
  res.status(201).json(formatReview(populated.toJSON()));
});

module.exports = {
  getRecentReviews,
  getProductReviews,
  createReview,
};
