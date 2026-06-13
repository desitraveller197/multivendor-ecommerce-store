const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/sellerController');

const router = express.Router();

router.get('/stats', protect, authorize('seller', 'admin'), ctrl.getSellerStats);
router.get('/stats/revenue-chart', protect, authorize('seller', 'admin'), ctrl.revenueChart);

module.exports = router;
