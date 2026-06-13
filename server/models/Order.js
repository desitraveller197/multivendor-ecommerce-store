const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    image: String,
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderItems: { type: [orderItemSchema], default: [] },
    shippingAddress: {
      street: String,
      city: String,
      province: String,
      postalCode: String,
    },
    paymentMethod: { type: String, enum: ['Stripe', 'COD'], default: 'Stripe' },
    paymentResult: {
      id: String,
      status: String,
      updateTime: String,
      emailAddress: String,
    },
    itemsPrice: { type: Number, default: 0 },
    shippingPrice: { type: Number, default: 0 },
    taxPrice: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },
    orderStatus: {
      type: String,
      enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },
    stripePaymentIntentId: { type: String, index: true, sparse: true },
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

orderSchema.index({ 'orderItems.seller': 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
