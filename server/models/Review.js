const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String },
    comment: { type: String, required: true, maxlength: 500 },
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

reviewSchema.pre('save', function (next) {
  if (this.isModified('comment') && this.comment) {
    this.comment = sanitizeHtml(this.comment, {
      allowedTags: [],
      allowedAttributes: {},
    });
  }
  next();
});

reviewSchema.index({ product: 1, customer: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
