const mongoose = require('mongoose');

const voucherUsageSchema = new mongoose.Schema(
  {
    voucher: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    discountAmount: { type: Number, required: true },
    usedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

voucherUsageSchema.index({ voucher: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('VoucherUsage', voucherUsageSchema);
