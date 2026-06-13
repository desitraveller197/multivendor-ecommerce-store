const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/shopController');

const router = express.Router();

router.get('/', ctrl.listShops);
router.get('/my', protect, authorize('seller', 'admin'), ctrl.getMyShop);
router.put('/my', protect, authorize('seller', 'admin'), ctrl.updateMyShop);
router.get('/:id', ctrl.getShop);
router.get('/:id/products', ctrl.getShopProducts);

module.exports = router;
