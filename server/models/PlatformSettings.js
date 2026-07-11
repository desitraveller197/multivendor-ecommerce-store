const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema(
  {
    commissionPercent: { type: Number, default: 10, min: 0, max: 100 },
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

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
