const asyncHandler = require('../utils/asyncHandler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Shop = require('../models/Shop');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// GET /api/seller/stats  (seller)
// Returns { products, revenue, orders } for the seller's own shop.
const getSellerStats = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;

  // Find the seller's shop
  const shop = await Shop.findOne({ owner: sellerId });
  const shopId = shop ? shop._id : null;

  // Count products belonging to this seller
  const products = shopId ? await Product.countDocuments({ shop: shopId }) : 0;

  // Get orders containing items from this seller
  const orders = await Order.find({
    'orderItems.seller': sellerId,
    isPaid: true,
  });

  const orderCount = orders.length;
  let revenue = 0;
  orders.forEach((order) => {
    order.orderItems
      .filter((it) => it.seller && it.seller.toString() === sellerId.toString())
      .forEach((it) => {
        revenue += it.price * it.qty;
      });
  });

  res.json({ products, revenue, orders: orderCount });
});

// GET /api/seller/stats/revenue-chart  (seller)
// Returns [{ month, revenue }, ...] for the recharts BarChart in SellerDashboard.
const revenueChart = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;
  const start = new Date();
  start.setMonth(start.getMonth() - 5);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const orders = await Order.find({
    'orderItems.seller': sellerId,
    isPaid: true,
    createdAt: { $gte: start },
  });

  // Initialize the last 6 months in order.
  const buckets = [];
  const now = new Date();
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, month: MONTHS[d.getMonth()], revenue: 0 });
  }
  const byKey = new Map(buckets.map((b) => [b.key, b]));

  orders.forEach((order) => {
    const d = new Date(order.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = byKey.get(key);
    if (!bucket) return;
    order.orderItems
      .filter((it) => it.seller && it.seller.toString() === sellerId.toString())
      .forEach((it) => {
        bucket.revenue += it.price * it.qty;
      });
  });

  res.json(buckets.map(({ month, revenue }) => ({ month, revenue })));
});

// Helper to compute balance
async function computeSellerBalance(sellerId) {
  const PlatformSettings = require('../models/PlatformSettings');
  const Withdrawal = require('../models/Withdrawal');
  let settings = await PlatformSettings.findOne();
  const commissionPercent = settings ? settings.commissionPercent : 10;

  // Paid & Delivered orders
  const orders = await Order.find({
    isPaid: true,
    orderStatus: 'Delivered',
    'orderItems.seller': sellerId,
  });

  let totalEarned = 0;
  for (const order of orders) {
    for (const item of order.orderItems) {
      if (item.seller.toString() === sellerId.toString()) {
        const itemTotal = item.price * item.qty;
        const commission = itemTotal * (commissionPercent / 100);
        totalEarned += (itemTotal - commission);
      }
    }
  }

  // Deduct prior withdrawals (all except rejected)
  const withdrawals = await Withdrawal.find({
    seller: sellerId,
    status: { $ne: 'rejected' },
  });

  const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);

  return Math.max(0, Math.round(totalEarned - totalWithdrawn));
}

// GET /api/seller/balance
const getBalance = asyncHandler(async (req, res) => {
  const balance = await computeSellerBalance(req.user._id);
  res.json({ balance });
});

// POST /api/seller/withdrawals
const createWithdrawal = asyncHandler(async (req, res) => {
  const { amount, method, accountDetails } = req.body;
  const Withdrawal = require('../models/Withdrawal');

  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error('Please provide a valid withdrawal amount');
  }

  if (!method || !accountDetails?.trim()) {
    res.status(400);
    throw new Error('Please specify payout method and account details');
  }

  const balance = await computeSellerBalance(req.user._id);
  if (amount > balance) {
    res.status(400);
    throw new Error(`Insufficient balance. Your available balance is PKR ${balance.toLocaleString()}`);
  }

  const withdrawal = await Withdrawal.create({
    seller: req.user._id,
    amount,
    method,
    accountDetails: accountDetails.trim(),
    status: 'pending',
  });

  res.status(201).json(withdrawal);
});

// GET /api/seller/withdrawals
const getWithdrawals = asyncHandler(async (req, res) => {
  const Withdrawal = require('../models/Withdrawal');
  const withdrawals = await Withdrawal.find({ seller: req.user._id }).sort({ requestedAt: -1 });
  res.json(withdrawals);
});

module.exports = {
  getSellerStats,
  revenueChart,
  getBalance,
  createWithdrawal,
  getWithdrawals,
};
