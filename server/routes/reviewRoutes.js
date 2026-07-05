const express = require('express');
const ctrl = require('../controllers/reviewController');

const router = express.Router();

router.get('/recent', ctrl.getRecentReviews);
router.get('/product/:productId', ctrl.getProductReviews);

module.exports = router;
