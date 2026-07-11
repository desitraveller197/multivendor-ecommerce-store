const Voucher = require('../models/Voucher');
const VoucherUsage = require('../models/VoucherUsage');
const voucherService = require('../services/voucherService');
const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');

// POST /api/admin/vouchers  (admin only)
const createVoucher = asyncHandler(async (req, res) => {
  const {
    code,
    discountPercentage,
    maxDiscountCap,
    minOrderAmount,
    startsAt,
    expiresAt,
    active,
    usageLimit,
    applicableScope,
    applicableCategories,
    applicableProducts,
    isNewCustomerOnly,
  } = req.body;

  if (!code || !discountPercentage || maxDiscountCap === undefined || minOrderAmount === undefined || !startsAt || !expiresAt || !usageLimit) {
    res.status(400);
    throw new Error('All core fields (code, percentage, maxDiscountCap, minOrderAmount, startsAt, expiresAt, usageLimit) are required.');
  }

  // Check if voucher code already exists
  const exists = await Voucher.findOne({ code: String(code).trim().toUpperCase() });
  if (exists) {
    res.status(400);
    throw new Error('Voucher code already exists.');
  }

  const voucher = await Voucher.create({
    code: String(code).trim().toUpperCase(),
    discountPercentage: Number(discountPercentage),
    maxDiscountCap: Number(maxDiscountCap),
    minOrderAmount: Number(minOrderAmount),
    startsAt: new Date(startsAt),
    expiresAt: new Date(expiresAt),
    active: active !== undefined ? active : true,
    usageLimit: Number(usageLimit),
    applicableScope: applicableScope || 'all',
    applicableCategories: Array.isArray(applicableCategories) ? applicableCategories : [],
    applicableProducts: Array.isArray(applicableProducts) ? applicableProducts : [],
    isNewCustomerOnly: !!isNewCustomerOnly,
  });

  res.status(201).json(voucher);
});

// GET /api/vouchers  (authenticated/public)
// Lists all active vouchers offered by the platform for collection.
const listVouchers = asyncHandler(async (req, res) => {
  const now = new Date();
  const query = {
    active: true,
    expiresAt: { $gte: now },
  };

  const vouchers = await Voucher.find(query).sort({ expiresAt: 1 });
  
  // Return list with indicator if the current user has already collected it
  const userId = req.user ? String(req.user._id) : null;
  const list = vouchers.map(v => {
    const doc = v.toJSON();
    doc.collected = userId ? v.collectedBy && v.collectedBy.some(id => String(id) === userId) : false;
    return doc;
  });

  res.json(list);
});

// POST /api/vouchers/:id/collect  (authenticated)
const collectVoucher = asyncHandler(async (req, res) => {
  const voucher = await Voucher.findById(req.params.id);
  if (!voucher) {
    res.status(404);
    throw new Error('Voucher not found.');
  }

  if (!voucher.active || new Date() > new Date(voucher.expiresAt)) {
    res.status(400);
    throw new Error('Voucher is inactive or has expired.');
  }

  const userId = req.user._id;
  const isAlreadyCollected = voucher.collectedBy && voucher.collectedBy.some(id => String(id) === String(userId));
  if (isAlreadyCollected) {
    res.status(400);
    throw new Error('Voucher already collected.');
  }

  voucher.collectedBy = voucher.collectedBy || [];
  voucher.collectedBy.push(userId);
  await voucher.save();

  res.json({ message: 'Voucher collected successfully.', voucher });
});

// POST /api/vouchers/validate  (authenticated)
const validateVoucherCode = asyncHandler(async (req, res) => {
  const { code, cartItems, cartTotal } = req.body;
  if (!code) {
    res.status(400);
    throw new Error('Voucher code is required.');
  }

  const validationResult = await voucherService.validateVoucher(
    code,
    req.user._id,
    Array.isArray(cartItems) ? cartItems : [],
    Number(cartTotal) || 0
  );

  res.json({
    valid: true,
    code: validationResult.voucher.code,
    discountPercentage: validationResult.voucher.discountPercentage,
    maxDiscountCap: validationResult.voucher.maxDiscountCap,
    minOrderAmount: validationResult.voucher.minOrderAmount,
    discountAmount: validationResult.discountAmount,
    applicableScope: validationResult.voucher.applicableScope,
    applicableCategories: validationResult.voucher.applicableCategories,
  });
});

// POST /api/vouchers/apply  (authenticated)
const applyVoucherCode = asyncHandler(async (req, res) => {
  // Alias to validateVoucherCode for checkout discount calculations
  const { code, cartItems, cartTotal } = req.body;
  const validationResult = await voucherService.validateVoucher(
    code,
    req.user._id,
    Array.isArray(cartItems) ? cartItems : [],
    Number(cartTotal) || 0
  );

  res.json({
    valid: true,
    discountAmount: validationResult.discountAmount,
    finalTotal: Math.max(0, Number(cartTotal) - validationResult.discountAmount),
  });
});

// GET /api/user/vouchers  (authenticated)
const getMyVouchers = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // Find all active/expired vouchers collected by this user
  const vouchers = await Voucher.find({ collectedBy: userId }).sort({ createdAt: -1 });

  // For each voucher, check if they have used it or if it is expired
  const usageRecords = await VoucherUsage.find({ user: userId });
  const usedVoucherIds = new Set(usageRecords.map(u => String(u.voucher)));

  const result = vouchers.map(v => {
    const doc = v.toJSON();
    doc.isUsed = usedVoucherIds.has(String(v._id));
    const now = new Date();
    doc.isExpired = now > new Date(v.expiresAt);
    doc.status = doc.isUsed ? 'used' : doc.isExpired ? 'expired' : 'active';
    return doc;
  });

  res.json(result);
});

// DELETE /api/admin/vouchers/:id  (admin only)
const deleteVoucher = asyncHandler(async (req, res) => {
  const voucher = await Voucher.findByIdAndDelete(req.params.id);
  if (!voucher) {
    res.status(404);
    throw new Error('Voucher not found.');
  }
  res.json({ message: 'Voucher deleted successfully.' });
});

module.exports = {
  createVoucher,
  listVouchers,
  collectVoucher,
  validateVoucherCode,
  applyVoucherCode,
  getMyVouchers,
  deleteVoucher,
};
