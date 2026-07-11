const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    name: { type: String, trim: true, default: '', maxlength: 120 },

    // What the discount applies to.
    scope: { type: String, enum: ['product', 'category', 'shop'], required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null }, // scope === 'product'
    category: { type: String, default: '' }, // scope === 'category'

    // How the discount is calculated.
    type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    value: { type: Number, required: true, min: 0 }, // percent (0–100) or fixed PKR amount

    active: { type: Boolean, default: true },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    event: { type: String, default: '' },
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

discountSchema.index({ seller: 1, active: 1 });

module.exports = mongoose.model('Discount', discountSchema);
