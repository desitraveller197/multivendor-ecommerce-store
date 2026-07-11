const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/voucherController');

const router = express.Router();

// General customer/auth endpoints
router.get('/', protect, ctrl.listVouchers);
router.post('/:id/collect', protect, ctrl.collectVoucher);
router.post('/validate', protect, ctrl.validateVoucherCode);
router.post('/apply', protect, ctrl.applyVoucherCode);
router.get('/user', protect, ctrl.getMyVouchers);

// Admin-only endpoints
router.post('/admin', protect, authorize('admin'), ctrl.createVoucher);
router.delete('/admin/:id', protect, authorize('admin'), ctrl.deleteVoucher);

module.exports = router;
