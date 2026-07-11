const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema(
  { size: String, color: String, sku: String, stock: Number },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 }, // PKR
    discountPrice: { type: Number, default: null },
    discountEvent: { type: String, default: '' },
    stock: { type: Number, required: true, min: 0, default: 0 },
    image: { type: String, default: '' }, // primary thumbnail (matches frontend field)
    images: { type: [String], default: [] },
    category: { type: String, default: '' },
    region: { type: String },
    culture: { type: String },
    colorFamilies: { type: [String], default: [] },
    seasons: { type: [String], default: [] },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
    variants: { type: [variantSchema], default: [] },
    // Display label used by the frontend ProductCard ("seller" column).
    sellerName: { type: String, default: '' },
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

const sanitizeHtml = require('sanitize-html');

productSchema.pre('save', function (next) {
  if (this.isModified('description') && this.description) {
    this.description = sanitizeHtml(this.description, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        img: ['src', 'alt', 'width', 'height'],
      },
    });
  }
  next();
});

productSchema.index({ shop: 1, isPublished: 1, createdAt: -1 });
productSchema.index({ category: 1, isPublished: 1 });
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
