const Voucher = require('../models/Voucher');
const Notification = require('../models/Notification');
const crypto = require('crypto');

/**
 * Check if the order contains at least 3 items (total quantity).
 * If so, generate a new 50% voucher code and notify the customer.
 */
const checkAndAwardVoucher = async (order) => {
  try {
    if (!order || !order.customer) return;

    // Calculate total quantity of items purchased
    const totalQty = (order.orderItems || []).reduce((acc, item) => acc + (item.qty || item.quantity || 0), 0);

    if (totalQty >= 3) {
      const code = 'VOUCH-' + crypto.randomBytes(3).toString('hex').toUpperCase();

      await Voucher.create({
        code,
        customer: order.customer,
        discountType: 'percentage',
        discountValue: 50,
        isUsed: false,
      });

      // Notify customer
      await Notification.create({
        user: order.customer,
        title: '🎉 New 50% Voucher Awarded!',
        message: `Thank you for purchasing ${totalQty} products! You have been awarded a 50% discount voucher. Code: ${code}`,
        type: 'info',
      });

      console.log(`[Voucher] Successfully awarded voucher ${code} to customer ${order.customer}`);
    }
  } catch (err) {
    console.error('[Voucher] Error checking/awarding voucher:', err);
  }
};

/**
 * Settle/mark the applied voucher code on an order as used.
 */
const markVoucherUsed = async (order) => {
  try {
    if (order && order.voucherCode) {
      const result = await Voucher.updateOne(
        { code: order.voucherCode.trim().toUpperCase(), customer: order.customer, isUsed: false },
        { isUsed: true, usedAt: new Date() }
      );
      if (result.modifiedCount > 0) {
        console.log(`[Voucher] Marked voucher ${order.voucherCode} as used for customer ${order.customer}`);
      }
    }
  } catch (err) {
    console.error('[Voucher] Error marking voucher used:', err);
  }
};

module.exports = {
  checkAndAwardVoucher,
  markVoucherUsed,
};
