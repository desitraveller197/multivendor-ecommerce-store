const Voucher = require('../models/Voucher');
const VoucherUsage = require('../models/VoucherUsage');
const Order = require('../models/Order');

/**
 * Validates a voucher for a given user and cart items.
 * @param {string} code - The voucher code (case-insensitive)
 * @param {string} userId - The ID of the authenticated user
 * @param {Array} cartItems - Array of cart items: [{ id, name, price, quantity, category }]
 * @param {number} cartTotal - Total price of the cart items (before voucher discount)
 */
async function validateVoucher(code, userId, cartItems, cartTotal) {
  const normalizedCode = String(code).trim().toUpperCase();
  const voucher = await Voucher.findOne({ code: normalizedCode });

  if (!voucher) {
    throw new Error('Voucher code does not exist.');
  }

  if (!voucher.active) {
    throw new Error('Voucher is currently inactive.');
  }

  const now = new Date();
  if (now < new Date(voucher.startsAt)) {
    throw new Error('Voucher campaign has not started yet.');
  }

  if (now > new Date(voucher.expiresAt)) {
    throw new Error('Voucher has expired.');
  }

  if (cartTotal < voucher.minOrderAmount) {
    throw new Error(`Minimum order amount of PKR ${voucher.minOrderAmount} is required to use this voucher.`);
  }

  // Check if total usage limit is exceeded
  if (voucher.usedCount >= voucher.usageLimit) {
    throw new Error('Voucher usage limit has been reached.');
  }

  // Check if customer already used this voucher (check VoucherUsage)
  const alreadyUsed = await VoucherUsage.findOne({ voucher: voucher._id, user: userId });
  if (alreadyUsed) {
    throw new Error('You have already redeemed this voucher.');
  }

  // Optional: check if new customer only
  if (voucher.isNewCustomerOnly) {
    const existingOrdersCount = await Order.countDocuments({ customer: userId, status: { $ne: 'cancelled' } });
    if (existingOrdersCount > 0) {
      throw new Error('This voucher is only available for new customers making their first purchase.');
    }
  }

  // Check if user has collected this voucher
  const hasCollected = voucher.collectedBy && voucher.collectedBy.some(id => id.toString() === userId.toString());
  if (!hasCollected) {
    throw new Error('You must collect this voucher first before applying it.');
  }

  // Calculate discount based on scope
  let eligibleTotal = 0;
  if (voucher.applicableScope === 'all') {
    eligibleTotal = cartTotal;
  } else if (voucher.applicableScope === 'category') {
    const categories = (voucher.applicableCategories || []).map(c => c.toLowerCase());
    cartItems.forEach(item => {
      const itemCat = String(item.category || '').toLowerCase();
      if (categories.includes(itemCat)) {
        eligibleTotal += (Number(item.price) * Number(item.quantity || 1));
      }
    });
    if (eligibleTotal === 0) {
      throw new Error(`This voucher is only applicable to products in categories: ${voucher.applicableCategories.join(', ')}.`);
    }
  } else if (voucher.applicableScope === 'product') {
    const productIds = (voucher.applicableProducts || []).map(p => p.toString());
    cartItems.forEach(item => {
      if (productIds.includes(String(item.id || item.product || ''))) {
        eligibleTotal += (Number(item.price) * Number(item.quantity || 1));
      }
    });
    if (eligibleTotal === 0) {
      throw new Error('None of the products in your cart are eligible for this voucher.');
    }
  }

  // Calculate discount amount
  let discountAmount = Math.round(eligibleTotal * (voucher.discountPercentage / 100));
  if (discountAmount > voucher.maxDiscountCap) {
    discountAmount = voucher.maxDiscountCap;
  }

  return {
    valid: true,
    voucher,
    discountAmount,
  };
}

module.exports = {
  validateVoucher,
};
