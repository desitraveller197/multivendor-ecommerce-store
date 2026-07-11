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

// GET /api/admin/transactions  (admin)
const listTransactions = asyncHandler(async (req, res) => {
  const Transaction = require('../models/Transaction');
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 10);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.paymentMethod) {
    filter.paymentMethod = req.query.paymentMethod;
  }
  if (req.query.startDate || req.query.endDate) {
    filter.createdAt = {};
    if (req.query.startDate) filter.createdAt.$gte = new Date(req.query.startDate);
    if (req.query.endDate) filter.createdAt.$lte = new Date(req.query.endDate);
  }

  const total = await Transaction.countDocuments(filter);
  const transactions = await Transaction.find(filter)
    .populate('order', 'orderNumber totalPrice')
    .populate('user', 'name email')
    .populate('seller', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    transactions,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

// GET /api/admin/refunds  (admin)
const listRefundRequests = asyncHandler(async (req, res) => {
  const RefundRequest = require('../models/RefundRequest');
  const refunds = await RefundRequest.find()
    .populate('order', 'orderNumber totalPrice isPaid orderStatus')
    .populate('customer', 'name email')
    .sort({ createdAt: -1 });
  res.json(refunds);
});

// PATCH /api/admin/refunds/:id  (admin)
const processRefundRequest = asyncHandler(async (req, res) => {
  const { action } = req.body;
  const RefundRequest = require('../models/RefundRequest');
  const Transaction = require('../models/Transaction');
  const Notification = require('../models/Notification');
  const { sendNotification } = require('../socket');

  const refund = await RefundRequest.findById(req.params.id)
    .populate('order')
    .populate('customer');
  if (!refund) {
    res.status(404);
    throw new Error('Refund request not found');
  }

  if (action === 'approve') {
    refund.status = 'approved';
    await refund.save();

    const order = refund.order;
    order.orderStatus = 'Refunded';
    await order.save();

    await Transaction.create({
      order: order._id,
      user: refund.customer._id,
      seller: order.orderItems?.[0]?.seller || null,
      amount: order.totalPrice,
      currency: 'PKR',
      paymentMethod: order.paymentMethod,
      gateway: order.paymentMethod,
      gatewayReference: order.gatewayTxnRef || 'refund_approved',
      status: 'refunded',
    });

    const notifCustomer = await Notification.create({
      user: refund.customer._id,
      type: 'payment',
      title: 'Refund Approved',
      message: `Your refund request for order ${order.orderNumber || order._id} has been approved.`,
      link: `/my-orders/${order._id}`,
    });
    sendNotification(refund.customer._id, notifCustomer.toJSON());

    const sellerIds = [...new Set(order.orderItems.map((item) => String(item.seller)))];
    for (const sellerId of sellerIds) {
      const notifSeller = await Notification.create({
        user: sellerId,
        type: 'order',
        title: 'Refund Approved',
        message: `Refund approved for order ${order.orderNumber || order._id}. Amount deducted from balance.`,
        link: `/seller/orders`,
      });
      sendNotification(sellerId, notifSeller.toJSON());
    }

    res.json({ message: 'Refund request approved', refund });
  } else if (action === 'reject') {
    refund.status = 'rejected';
    await refund.save();

    const order = refund.order;
    const notifCustomer = await Notification.create({
      user: refund.customer._id,
      type: 'order',
      title: 'Refund Rejected',
      message: `Your refund request for order ${order.orderNumber || order._id} was rejected.`,
      link: `/my-orders/${order._id}`,
    });
    sendNotification(refund.customer._id, notifCustomer.toJSON());

    res.json({ message: 'Refund request rejected', refund });
  } else {
    res.status(400);
    throw new Error('Invalid action. Use approve or reject.');
  }
});

// GET /api/admin/withdrawals  (admin)
const listWithdrawals = asyncHandler(async (req, res) => {
  const Withdrawal = require('../models/Withdrawal');
  const withdrawals = await Withdrawal.find()
    .populate('seller', 'name email')
    .sort({ requestedAt: -1 });
  res.json(withdrawals);
});

// PATCH /api/admin/withdrawals/:id  (admin)
const processWithdrawal = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const Withdrawal = require('../models/Withdrawal');
  const Notification = require('../models/Notification');
  const { sendNotification } = require('../socket');

  const withdrawal = await Withdrawal.findById(req.params.id).populate('seller');
  if (!withdrawal) {
    res.status(404);
    throw new Error('Withdrawal request not found');
  }

  if (!['approved', 'rejected', 'paid'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  withdrawal.status = status;
  withdrawal.processedAt = new Date();
  await withdrawal.save();

  const notif = await Notification.create({
    user: withdrawal.seller._id,
    type: 'system',
    title: `Withdrawal request ${status}`,
    message: `Your payout request of PKR ${withdrawal.amount.toLocaleString()} has been ${status}.`,
    link: `/seller/withdraw`,
  });
  sendNotification(withdrawal.seller._id, notif.toJSON());

  res.json({ message: `Withdrawal marked as ${status}`, withdrawal });
});

// GET /api/admin/settings  (admin)
const getPlatformSettings = asyncHandler(async (req, res) => {
  const PlatformSettings = require('../models/PlatformSettings');
  let settings = await PlatformSettings.findOne();
  if (!settings) {
    settings = await PlatformSettings.create({ commissionPercent: 10 });
  }
  res.json(settings);
});

// PUT /api/admin/settings  (admin)
const updatePlatformSettings = asyncHandler(async (req, res) => {
  const { commissionPercent } = req.body;
  const PlatformSettings = require('../models/PlatformSettings');
  let settings = await PlatformSettings.findOne();
  if (!settings) {
    settings = new PlatformSettings();
  }
  settings.commissionPercent = commissionPercent;
  await settings.save();
  res.json(settings);
});

// GET /api/admin/reports/sales  (admin)
const getSalesReport = asyncHandler(async (req, res) => {
  const fromDate = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const toDate = req.query.to ? new Date(req.query.to) : new Date();

  const durationMs = toDate.getTime() - fromDate.getTime();
  const prevFromDate = new Date(fromDate.getTime() - durationMs);
  const prevToDate = fromDate;

  const PlatformSettings = require('../models/PlatformSettings');
  let settings = await PlatformSettings.findOne();
  const commissionPercent = settings ? settings.commissionPercent : 10;

  const aggregateSales = async (start, end) => {
    return Order.aggregate([
      {
        $match: {
          isPaid: true,
          orderStatus: { $ne: 'Cancelled' },
          createdAt: { $gte: start, $lte: end }
        }
      },
      { $unwind: '$orderItems' },
      {
        $group: {
          _id: '$orderItems.seller',
          totalSales: { $sum: { $multiply: ['$orderItems.price', '$orderItems.qty'] } },
          ordersCount: { $addToSet: '$_id' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'sellerInfo'
        }
      },
      {
        $project: {
          sellerName: { $arrayElemAt: ['$sellerInfo.name', 0] },
          totalSales: 1,
          ordersCount: { $size: '$ordersCount' }
        }
      }
    ]);
  };

  const [currentSellers, prevSellers] = await Promise.all([
    aggregateSales(fromDate, toDate),
    aggregateSales(prevFromDate, prevToDate)
  ]);

  const prevSellersMap = new Map(prevSellers.map((s) => [s._id.toString(), s.totalSales]));

  const sellerTrends = currentSellers.map((curr) => {
    const prevSales = prevSellersMap.get(curr._id.toString()) || 0;
    const delta = curr.totalSales - prevSales;
    const deltaPercent = prevSales > 0 ? (Math.abs(delta) / prevSales) * 100 : (curr.totalSales > 0 ? 100 : 0);
    return {
      seller: curr.sellerName || 'Unknown Seller',
      current: curr.totalSales,
      previous: prevSales,
      direction: delta >= 0 ? 'increase' : 'decrease',
      deltaPercent
    };
  });

  const totalCurrentSales = sellerTrends.reduce((sum, item) => sum + item.current, 0);
  const totalPreviousSales = sellerTrends.reduce((sum, item) => sum + item.previous, 0);

  const totalOrdersAgg = await Order.countDocuments({
    isPaid: true,
    orderStatus: { $ne: 'Cancelled' },
    createdAt: { $gte: fromDate, $lte: toDate }
  });

  res.json({
    sellerTrends,
    totalCurrentSales,
    totalPreviousSales,
    totalOrders: totalOrdersAgg,
    commissionPercent,
  });
});

module.exports = {
  getStats,
  listUsers,
  deleteUser,
  approveSeller,
  rejectSeller,
  listOrders,
  listTransactions,
  listRefundRequests,
  processRefundRequest,
  listWithdrawals,
  processWithdrawal,
  getPlatformSettings,
  updatePlatformSettings,
  getSalesReport,
};
