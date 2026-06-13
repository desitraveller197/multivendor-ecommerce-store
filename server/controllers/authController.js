const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/User');

/**
 * Shape a user document into the object the frontend authSlice expects.
 * The frontend reads user.name, user.email, etc. and merges role separately.
 */
function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || '',
    city: user.city || '',
    avatar: user.avatar,
    address: user.address || {},
    isApproved: user.isApproved,
  };
}

// POST /api/auth/register  (public)
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Only customer/seller can self-register; admins are seeded.
  const safeRole = role === 'seller' ? 'seller' : 'customer';

  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    role: safeRole,
    // Sellers start unapproved; customers are active immediately.
    isApproved: safeRole === 'customer',
  });

  res.status(201).json({ message: 'Account created successfully', user: publicUser(user) });
});

// POST /api/auth/login  (public)
const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (role && user.role !== role) {
    res.status(401);
    throw new Error(`This account is not registered as a ${role}`);
  }

  if (user.role === 'seller' && !user.isApproved) {
    res.status(403);
    throw new Error('Your seller account is awaiting admin approval');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('This account has been deactivated');
  }

  const token = generateToken(user);
  res.json({ token, role: user.role, user: publicUser(user) });
});

// GET /api/auth/profile  (auth)
const getProfile = asyncHandler(async (req, res) => {
  res.json(publicUser(req.user));
});

// PUT /api/auth/profile  (auth)
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  const { name, phone, city, address, avatar } = req.body;
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (city !== undefined) user.city = city;
  if (avatar !== undefined) user.avatar = avatar;
  if (address !== undefined) user.address = address;
  await user.save();
  res.json(publicUser(user));
});

// PUT /api/auth/change-password  (auth)
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!user || !(await user.matchPassword(currentPassword))) {
    res.status(400);
    throw new Error('Current password is incorrect');
  }
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated successfully' });
});

// POST /api/auth/forgot-password  (public) — always 200 to prevent enumeration
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    const rawToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${rawToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Password Reset — Multivendor Store',
      text: `Reset your password using this link (valid 15 minutes): ${resetUrl}`,
      html: `<p>Reset your password using the link below (valid 15 minutes):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });
  }

  res.json({ message: 'If that email exists, a reset link has been sent.' });
});

// POST /api/auth/reset-password/:token  (public)
const resetPassword = asyncHandler(async (req, res) => {
  const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpire: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpire');

  if (!user) {
    res.status(400);
    throw new Error('Reset token is invalid or has expired');
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.json({ message: 'Password has been reset successfully' });
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  publicUser,
};
