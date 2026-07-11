const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountPercentage: { type: Number, required: true, min: 1, max: 100 },
    maxDiscountCap: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, required: true, min: 0 },
    startsAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    active: { type: Boolean, default: true },
    usageLimit: { type: Number, required: true, min: 1 },
    usedCount: { type: Number, default: 0 },
    applicableScope: { type: String, enum: ['all', 'category', 'product'], default: 'all' },
    applicableCategories: [{ type: String, trim: true }],
    applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    isNewCustomerOnly: { type: Boolean, default: false },
    collectedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

voucherSchema.index({ code: 1, active: 1 });
voucherSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Voucher', voucherSchema);
