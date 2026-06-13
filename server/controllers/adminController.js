const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const Notification = require('../models/Notification');
const sendEmail = require('../utils/sendEmail');
const { presentOrder } = require('./orderController');

// GET /api/admin/stats  (admin) — parallel aggregations
const getStats = asyncHandler(async (req, res) => {
  const [users, orders, products, revenueAgg] = await Promise.all([
    User.countDocuments(),
    Order.countDocuments(),
    Product.countDocuments(),
    Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),
  ]);
  const revenue = revenueAgg.length ? revenueAgg[0].total : 0;
  res.json({ users, orders, revenue, products });
});

// GET /api/admin/users  (admin) — shape matches ManageUsers/ManageSellers
const listUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.status === 'pending') {
    filter.role = 'seller';
    filter.isApproved = false;
  }

  const users = await User.find(filter).sort({ createdAt: -1 });

  // Attach shop name for sellers (ManageSellers reads `shop`).
  const sellerIds = users.filter((u) => u.role === 'seller').map((u) => u._id);
  const shops = await Shop.find({ owner: { $in: sellerIds } }).select('owner name');
  const shopByOwner = new Map(shops.map((s) => [s.owner.toString(), s.name]));

  res.json(
    users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.role === 'seller' ? (u.isApproved ? 'approved' : 'pending') : 'active',
      shop: shopByOwner.get(u._id.toString()) || '',
    }))
  );
});

// DELETE /api/admin/users/:id  (admin) — soft delete
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  user.isActive = false;
  await user.save();
  res.json({ message: 'User deactivated' });
});

// PUT /api/admin/sellers/:id/approve  (admin)
const approveSeller = asyncHandler(async (req, res) => {
  const seller = await User.findById(req.params.id);
  if (!seller || seller.role !== 'seller') {
    res.status(404);
    throw new Error('Seller not found');
  }
  seller.isApproved = true;
  await seller.save();

  await Notification.create({
    user: seller._id,
    type: 'system',
    title: 'Account approved',
    message: 'Your seller account has been approved. You can now add products.',
  });
  await sendEmail({
    to: seller.email,
    subject: 'Your seller account is approved',
    text: 'Congratulations! Your seller account on Multivendor Store has been approved.',
  });

  res.json({ message: 'Seller approved', success: true });
});

// PUT /api/admin/sellers/:id/reject  (admin)
const rejectSeller = asyncHandler(async (req, res) => {
  const seller = await User.findById(req.params.id);
  if (!seller || seller.role !== 'seller') {
    res.status(404);
    throw new Error('Seller not found');
  }
  seller.isApproved = false;
  await seller.save();

  await Notification.create({
    user: seller._id,
    type: 'system',
    title: 'Account rejected',
    message: 'Your seller account application was not approved at this time.',
  });
  await sendEmail({
    to: seller.email,
    subject: 'Seller account update',
    text: 'We are unable to approve your seller account at this time.',
  });

  res.json({ message: 'Seller rejected', success: true });
});

// GET /api/admin/orders  (admin) — platform-wide list
const listOrders = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status && req.query.status !== 'all') {
    filter.orderStatus = req.query.status;
  }
  const orders = await Order.find(filter).populate('customer', 'name').sort({ createdAt: -1 });
  res.json(orders.map(presentOrder));
});

module.exports = {
  getStats,
  listUsers,
  deleteUser,
  approveSeller,
  rejectSeller,
  listOrders,
};
