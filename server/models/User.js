const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const addressSchema = new mongoose.Schema(
  {
    street: String,
    city: String,
    province: String,
    postalCode: String,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    // Required only for local (email/password) accounts; OAuth users have none.
    password: {
      type: String,
      select: false,
      required: function requirePassword() {
        return !this.provider || this.provider === 'local';
      },
    },
    // How the account authenticates.
    provider: { type: String, enum: ['local', 'google', 'facebook'], default: 'local' },
    providerId: { type: String },
    role: {
      type: String,
      enum: ['admin', 'seller', 'customer'],
      default: 'customer',
    },
    phone: { type: String },
    city: { type: String },
    avatar: { type: String, default: 'https://ui-avatars.com/api/?name=User' },
    isApproved: { type: Boolean, default: false }, // sellers; flipped by admin
    isActive: { type: Boolean, default: true },
    address: { type: addressSchema, default: {} },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },
    resetOTP: { type: String, select: false },
    resetOTPExpire: { type: Date, select: false },
    resetOTPTries: { type: Number, default: 0, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpire;
        delete ret.resetOTP;
        delete ret.resetOTPExpire;
        delete ret.resetOTPTries;
        return ret;
      },
    },
  }
);

// Hash password before save when modified.
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = function matchPassword(entered) {
  return bcrypt.compare(entered, this.password);
};

// Create a reset token: returns the RAW token (emailed) and stores its SHA-256 hash.
userSchema.methods.createPasswordResetToken = function createPasswordResetToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 min
  return rawToken;
};

// Create a 6-digit password reset OTP: returns the raw OTP and stores its SHA-256 hash.
userSchema.methods.createPasswordResetOTP = function createPasswordResetOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.resetOTP = crypto.createHash('sha256').update(otp).digest('hex');
  this.resetOTPExpire = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
  this.resetOTPTries = 0;
  return otp;
};

module.exports = mongoose.model('User', userSchema);
