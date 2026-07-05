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

module.exports = {
  getRecentReviews,
  getProductReviews,
};
