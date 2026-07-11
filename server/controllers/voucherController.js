const Voucher = require('../models/Voucher');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/vouchers  (auth)
const getMyVouchers = asyncHandler(async (req, res) => {
  const vouchers = await Voucher.find({ customer: req.user._id }).sort({ createdAt: -1 });
  res.json(vouchers);
});

// POST /api/vouchers/verify  (auth)
const verifyVoucher = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) {
    res.status(400);
    throw new Error('Voucher code is required');
  }

  const voucher = await Voucher.findOne({
    code: String(code).trim().toUpperCase(),
    customer: req.user._id,
    isUsed: false,
  });

  if (!voucher) {
    res.status(404);
    throw new Error('Invalid, expired, or already used voucher code.');
  }

  res.json({
    valid: true,
    code: voucher.code,
    discountValue: voucher.discountValue,
    discountType: voucher.discountType,
  });
});

module.exports = {
  getMyVouchers,
  verifyVoucher,
};
