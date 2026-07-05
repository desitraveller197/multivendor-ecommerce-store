const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['admin', 'seller', 'customer'], required: true },
    name: { type: String, default: '' },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['buyer_seller', 'admin_vendor', 'order'],
      required: true,
      index: true,
    },
    participants: { type: [participantSchema], required: true },
    participantKey: { type: String, required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    subject: { type: String, default: '' },
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now, index: true },
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

conversationSchema.index({ participantKey: 1, type: 1, order: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', conversationSchema);
