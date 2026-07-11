const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    logo: { type: String, default: '' },
    banner: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    totalRevenue: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    deliveryCharges: { type: Number, default: 200, min: 0 },
    taxRate: { type: Number, default: 5, min: 0 },
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

module.exports = mongoose.model('Shop', shopSchema);
