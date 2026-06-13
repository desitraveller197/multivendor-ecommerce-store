const asyncHandler = require('../utils/asyncHandler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { getStripe } = require('../utils/stripe');

const FREE_SHIPPING_THRESHOLD = 5000; // PKR
const FLAT_SHIPPING = 200; // PKR
const TAX_RATE = 0.05;

/**
 * Convert an Order document into the flattened shape the frontend reads:
 * { id, status, amount, date, paymentMethod, customer, address, items[] }
 */
function presentOrder(order) {
  const customerName =
    order.customer && order.customer.name ? order.customer.name : undefined;
  return {
    id: order._id,
    status: order.orderStatus,
    amount: order.totalPrice,
    date: order.createdAt,
    paymentMethod: order.paymentMethod,
    isPaid: order.isPaid,
    customer: customerName,
    address: {
      street: order.shippingAddress?.street || '',
      city: order.shippingAddress?.city || '',
      province: order.shippingAddress?.province || '',
      postal: order.shippingAddress?.postalCode || '',
    },
    items: (order.orderItems || []).map((it) => ({
      id: it.product,
      name: it.name,
      quantity: it.qty,
      price: it.price,
      image: it.image,
    })),
  };
}

// POST /api/orders  (customer) — creates Order + Stripe PaymentIntent
const createOrder = asyncHandler(async (req, res) => {
  const { items, address, paymentMethod, orderId } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error('No order items provided');
  }

  // Re-fetch every product from DB — never trust client prices.
  const orderItems = [];
  let itemsPrice = 0;

  for (const line of items) {
    const product = await Product.findById(line.product);
    if (!product) {
      res.status(404);
      throw new Error(`Product not found: ${line.product}`);
    }
    const qty = Math.max(1, Number(line.quantity) || 1);
    if (product.stock < qty) {
      res.status(400);
      throw new Error(`Insufficient stock for ${product.name}`);
    }
    const unitPrice = product.discountPrice ?? product.price;
    itemsPrice += unitPrice * qty;
    orderItems.push({
      product: product._id,
      name: product.name,
      qty,
      price: unitPrice,
      image: product.image,
      seller: product.seller,
      shop: product.shop,
    });
  }

  const shippingPrice = itemsPrice >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
  const taxPrice = Math.round(itemsPrice * TAX_RATE);
  const totalPrice = itemsPrice + shippingPrice + taxPrice;

  let order;
  if (orderId) {
    order = await Order.findById(orderId);
    if (order && order.customer.toString() === req.user._id.toString() && order.orderStatus === 'Pending') {
      order.orderItems = orderItems;
      order.shippingAddress = {
        street: address?.street,
        city: address?.city,
        province: address?.province,
        postalCode: address?.postal || address?.postalCode,
      };
      order.paymentMethod = paymentMethod === 'COD' ? 'COD' : 'Stripe';
      order.itemsPrice = itemsPrice;
      order.shippingPrice = shippingPrice;
      order.taxPrice = taxPrice;
      order.totalPrice = totalPrice;
      await order.save();
    } else {
      order = null;
    }
  }

  if (!order) {
    order = await Order.create({
      customer: req.user._id,
      orderItems,
      shippingAddress: {
        street: address?.street,
        city: address?.city,
        province: address?.province,
        postalCode: address?.postal || address?.postalCode,
      },
      paymentMethod: paymentMethod === 'COD' ? 'COD' : 'Stripe',
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      orderStatus: 'Pending',
    });
  }

  // COD: no PaymentIntent needed.
  if (order.paymentMethod === 'COD') {
    return res.status(201).json({ clientSecret: null, orderId: order._id });
  }

  // Stripe PaymentIntent (amount in the smallest currency unit).
  const stripe = getStripe();
  if (!stripe) {
    res.status(500);
    throw new Error('Stripe is not configured on the server');
  }

  let intent;
  if (order.stripePaymentIntentId) {
    try {
      intent = await stripe.paymentIntents.update(order.stripePaymentIntentId, {
        amount: totalPrice * 100,
      });
    } catch (err) {
      intent = null;
    }
  }

  if (!intent) {
    intent = await stripe.paymentIntents.create({
      amount: totalPrice * 100,
      currency: 'pkr',
      metadata: { orderId: order._id.toString() },
      automatic_payment_methods: { enabled: true },
    });
    order.stripePaymentIntentId = intent.id;
    await order.save();
  }

  res.status(201).json({ clientSecret: intent.client_secret, orderId: order._id });
});

// GET /api/orders/myorders  (customer)
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ customer: req.user._id }).sort({ createdAt: -1 });
  res.json(orders.map(presentOrder));
});

// GET /api/orders/seller  (seller) — orders containing the seller's items
const getSellerOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ 'orderItems.seller': req.user._id })
    .populate('customer', 'name')
    .sort({ createdAt: -1 });
  res.json(orders.map(presentOrder));
});

// GET /api/orders/:id  (owning customer, admin, or item seller)
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('customer', 'name email');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  const uid = req.user._id.toString();
  const isOwner = order.customer && order.customer._id.toString() === uid;
  const isSeller = order.orderItems.some((it) => it.seller && it.seller.toString() === uid);
  if (req.user.role !== 'admin' && !isOwner && !isSeller) {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }
  res.json(presentOrder(order));
});

// PUT /api/orders/:id/status  (seller / admin)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  if (!allowed.includes(status)) {
    res.status(400);
    throw new Error('Invalid order status');
  }
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  const uid = req.user._id.toString();
  const isSeller = order.orderItems.some((it) => it.seller && it.seller.toString() === uid);
  if (req.user.role !== 'admin' && !isSeller) {
    res.status(403);
    throw new Error('Not authorized to update this order');
  }
  order.orderStatus = status;
  if (status === 'Delivered') {
    order.isDelivered = true;
    order.deliveredAt = new Date();
  }
  await order.save();
  res.json(presentOrder(order));
});

module.exports = {
  createOrder,
  getMyOrders,
  getSellerOrders,
  getOrder,
  updateOrderStatus,
  presentOrder,
};
