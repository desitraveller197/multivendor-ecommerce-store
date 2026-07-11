const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/reviewController');

const router = express.Router();

router.get('/recent', ctrl.getRecentReviews);
router.get('/product/:productId', ctrl.getProductReviews);
router.post('/product/:productId', protect, ctrl.createReview);

module.exports = router;
