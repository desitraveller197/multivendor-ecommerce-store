const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/voucherController');

const router = express.Router();

router.use(protect);

router.get('/', ctrl.getMyVouchers);
router.post('/verify', ctrl.verifyVoucher);

module.exports = router;
