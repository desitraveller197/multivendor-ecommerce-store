const Voucher = require('../models/Voucher');
const VoucherUsage = require('../models/VoucherUsage');

/**
 * No-op fallback function (Buy 3 get voucher has been removed).
 */
const checkAndAwardVoucher = async (order) => {
  // No-op
  return;
};

/**
 * Transaction-safe method to settle/mark a voucher code as used for an order.
 * Prevents double redemption and race conditions by utilizing Mongoose's unique indexes on VoucherUsage
 * and atomic increments on Voucher.
 */
const markVoucherUsed = async (order) => {
  try {
    if (!order || !order.voucherCode || !order.customer) return;

    const code = String(order.voucherCode).trim().toUpperCase();
    const userId = order.customer._id || order.customer;

    // Find the voucher
    const voucher = await Voucher.findOne({ code, active: true });
    if (!voucher) {
      console.warn(`[Voucher] Voucher ${code} not found or inactive during order settlement.`);
      return;
    }

    // Attempt to insert a usage record. This will fail with a duplicate key error
    // if the user already used this voucher (composite unique index on { voucher, user }).
    try {
      await VoucherUsage.create({
        voucher: voucher._id,
        user: userId,
        order: order._id,
        discountAmount: order.voucherDiscount || 0,
        usedAt: new Date(),
      });
    } catch (err) {
      if (err.code === 11000) {
        console.error(`[Voucher] Duplicate voucher usage detected for code ${code} and user ${userId}. Skipping.`);
        return;
      }
      throw err;
    }

    // Increment usedCount atomically
    await Voucher.updateOne(
      { _id: voucher._id },
      { $inc: { usedCount: 1 } }
    );

    console.log(`[Voucher] Marked voucher ${code} as used for customer ${userId} on order ${order._id}`);
  } catch (err) {
    console.error('[Voucher] Error marking voucher used:', err);
  }
};

module.exports = {
  checkAndAwardVoucher,
  markVoucherUsed,
};
