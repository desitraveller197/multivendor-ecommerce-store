const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/sellerController');
const discountCtrl = require('../controllers/discountController');

const router = express.Router();

router.get('/stats', protect, authorize('seller', 'admin'), ctrl.getSellerStats);
router.get('/stats/revenue-chart', protect, authorize('seller', 'admin'), ctrl.revenueChart);
router.get('/balance', protect, authorize('seller', 'admin'), ctrl.getBalance);
router.get('/withdrawals', protect, authorize('seller', 'admin'), ctrl.getWithdrawals);
router.post('/withdrawals', protect, authorize('seller', 'admin'), ctrl.createWithdrawal);
router.post('/appeal', protect, authorize('seller', 'admin'), ctrl.appealApproval);

// ─── Discount management (apply to a product, a category, or the whole shop) ───
router.get('/discounts', protect, authorize('seller', 'admin'), discountCtrl.listDiscounts);
router.post('/discounts', protect, authorize('seller', 'admin'), discountCtrl.createDiscount);
router.patch('/discounts/:id', protect, authorize('seller', 'admin'), discountCtrl.updateDiscount);
router.delete('/discounts/:id', protect, authorize('seller', 'admin'), discountCtrl.deleteDiscount);

module.exports = router;
