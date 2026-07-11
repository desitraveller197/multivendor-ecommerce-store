const mongoose = require('mongoose');

const posterSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: '', maxlength: 150 },
    subtitle: { type: String, trim: true, default: '', maxlength: 300 },
    imageUrl: { type: String, required: true },
    linkUrl: { type: String, default: '' },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
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

module.exports = mongoose.model('Poster', posterSchema);
