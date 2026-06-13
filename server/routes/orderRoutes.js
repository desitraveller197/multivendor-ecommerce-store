const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/orderController');

const router = express.Router();

router.post('/', protect, authorize('customer', 'admin'), ctrl.createOrder);
router.get('/myorders', protect, ctrl.getMyOrders);
router.get('/seller', protect, authorize('seller', 'admin'), ctrl.getSellerOrders);
router.get('/:id', protect, ctrl.getOrder);
router.put('/:id/status', protect, authorize('seller', 'admin'), ctrl.updateOrderStatus);

module.exports = router;
