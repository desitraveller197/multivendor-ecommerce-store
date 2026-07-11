const asyncHandler = require('../utils/asyncHandler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const gateway = require('../utils/paymentGateway');
const { finalizeOrder } = require('./paymentController');

const FREE_SHIPPING_THRESHOLD = 5000; // PKR
const FLAT_SHIPPING = 200; // PKR
const TAX_RATE = 0.05;

function serverBaseUrl() {
  return process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
}

/**
 * Convert an Order document into the flattened shape the frontend reads:
 * { id, status, amount, date, paymentMethod, customer, address, items[] }
 */
function presentOrder(order) {
  const customerName =
    order.customer && order.customer.name ? order.customer.name : undefined;
  return {
    id: order._id,
    orderNumber: order.orderNumber || order._id,
    status: order.orderStatus,
    amount: order.totalPrice,
    date: order.createdAt,
    paymentMethod: order.paymentMethod,
    isPaid: order.isPaid,
    paymentReceipt: order.paymentReceipt || '',
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
      sellerId: it.seller,
    })),
  };
}

// POST /api/orders  (customer) — creates Order + Stripe PaymentIntent
const createOrder = asyncHandler(async (req, res) => {
  const { items, address, paymentMethod, orderId, paymentReceipt } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error('No order items provided');
  }

  // Honour the selected gateway; unknown values fall back to Easypaisa. COD is cash.
  const ALLOWED_METHODS = ['COD', 'Easypaisa', 'JazzCash', 'Stripe'];
  const method = ALLOWED_METHODS.includes(paymentMethod) ? paymentMethod : 'Easypaisa';

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

  // Calculate shipping cost and tax by grouping items by shop and using shop-specific rates
  const shopGroups = {};
  for (const item of orderItems) {
    const shopId = item.shop.toString();
    if (!shopGroups[shopId]) {
      shopGroups[shopId] = { itemsPrice: 0 };
    }
    shopGroups[shopId].itemsPrice += item.quantity * item.price;
  }

  let shippingPrice = 0;
  let taxPrice = 0;
  const Shop = require('../models/Shop');
  for (const shopId of Object.keys(shopGroups)) {
    const shopObj = await Shop.findById(shopId);
    const devCharges = shopObj?.deliveryCharges ?? 200;

    shippingPrice += devCharges;
  }

  const voucherCode = req.body.voucherCode ? String(req.body.voucherCode).trim().toUpperCase() : '';
  let voucherDiscount = 0;

  if (voucherCode) {
    const voucherService = require('../services/voucherService');
    const Product = require('../models/Product');
    const cartItems = [];
    for (const item of orderItems) {
      const prod = await Product.findById(item.product).select('category');
      cartItems.push({
        id: item.product,
        name: item.name,
        price: item.price,
        quantity: item.qty,
        category: prod ? prod.category : '',
      });
    }
    try {
      const validation = await voucherService.validateVoucher(
        voucherCode,
        req.user._id,
        cartItems,
        itemsPrice
      );
      voucherDiscount = validation.discountAmount;
    } catch (err) {
      res.status(400);
      throw new Error(err.message);
    }
  }

  const totalPrice = Math.max(0, itemsPrice - voucherDiscount + shippingPrice);

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
      order.paymentMethod = method;
      order.itemsPrice = itemsPrice;
      order.shippingPrice = shippingPrice;
      order.taxPrice = taxPrice;
      order.voucherCode = voucherCode;
      order.voucherDiscount = voucherDiscount;
      order.totalPrice = totalPrice;
      order.paymentReceipt = paymentReceipt || '';
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
      paymentMethod: method,
      itemsPrice,
      shippingPrice,
      taxPrice,
      voucherCode,
      voucherDiscount,
      totalPrice,
      orderStatus: 'Pending',
      paymentReceipt: paymentReceipt || '',
    });
  }

  // Record only non-sensitive card details (brand + last 4). The full card
  // number and CVV are never sent to or stored on the server.
  if (order.paymentMethod === 'Easypaisa' && req.body.card) {
    order.cardBrand = String(req.body.card.brand || '').slice(0, 20);
    order.cardLast4 = String(req.body.card.last4 || '').replace(/\D/g, '').slice(-4);
  }

  // Create notifications for sellers & admin
  try {
    const Notification = require('../models/Notification');
    const { sendNotification } = require('../socket');
    const User = require('../models/User');

    const sellerIds = [...new Set(order.orderItems.map((item) => String(item.seller)))];
    for (const sellerId of sellerIds) {
      const notif = await Notification.create({
        user: sellerId,
        type: 'order',
        title: 'New order received',
        message: `You have received a new order ${order.orderNumber || order._id}.`,
        link: `/seller/orders`,
      });
      sendNotification(sellerId, notif.toJSON());
    }

    const adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
      const notif = await Notification.create({
        user: adminUser._id,
        type: 'order',
        title: 'New order received',
        message: `A new order ${order.orderNumber || order._id} has been placed.`,
        link: `/admin/orders`,
      });
      sendNotification(adminUser._id, notif.toJSON());
    }
  } catch (err) {
    console.error('Failed to create order placement notifications:', err.message);
  }

  // COD: nothing to collect online — order is placed straight away.
  if (order.paymentMethod === 'COD') {
    return res.status(201).json({ orderId: order._id, payment: { type: 'cod' } });
  }

  // JazzCash: manual payment receipt upload. Wait for seller manual review.
  if (order.paymentMethod === 'JazzCash') {
    return res.status(201).json({ orderId: order._id, payment: { type: 'manual_receipt' } });
  }

  // Stripe Checkout Session Creation
  if (order.paymentMethod === 'Stripe') {
    console.log('DEBUG STRIPE KEY:', {
      hasKey: Boolean(process.env.STRIPE_SECRET_KEY),
      keyPrefix: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.slice(0, 10) : 'none'
    });
    if (!process.env.STRIPE_SECRET_KEY) {
      // Settle immediately for demo if no secret key is present
      await order.populate('customer', 'name email');
      await finalizeOrder(order, { id: 'simulated_stripe_' + order._id, status: 'simulated' });
      return res.status(201).json({ orderId: order._id, payment: { type: 'paid' } });
    }

    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'pkr',
              product_data: {
                name: `Order #${order._id}`,
                description: `Payment for Order #${order._id} at Bazarix Store`,
              },
              unit_amount: totalPrice * 100, // Stripe expects amount in cents/paisa
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `http://localhost:${process.env.PORT || 5000}/api/payment/stripe/success?orderId=${order._id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `http://localhost:${process.env.PORT || 5000}/api/payment/stripe/cancel?orderId=${order._id}`,
        metadata: {
          orderId: order._id.toString(),
        },
      });

      order.stripePaymentIntentId = session.id; // Store session ID for reference
      await order.save();

      return res.status(201).json({
        orderId: order._id,
        payment: { type: 'stripe_redirect', url: session.url },
      });
    } catch (err) {
      res.status(500);
      throw new Error(`Stripe session creation failed: ${err.message}`);
    }
  }

  // Gateway (JazzCash / Easypaisa): generate a txn reference for this attempt.
  const txnRef = `T${gateway.formatDateTime(new Date())}${Math.floor(1000 + Math.random() * 9000)}`;
  order.gatewayTxnRef = txnRef;
  await order.save();

  // Without live credentials, settle the order immediately (demo) and let the
  // SPA route to its own success page — avoids cross-origin/port redirects.
  // Configure the gateway env vars to use the real hosted-checkout flow.
  if (!gateway.isConfigured(order.paymentMethod)) {
    await order.populate('customer', 'name email');
    await finalizeOrder(order, { id: order.gatewayTxnRef, status: 'simulated' });
    return res.status(201).json({ orderId: order._id, payment: { type: 'paid' } });
  }

  const returnUrl = `${serverBaseUrl()}/api/payment/${order.paymentMethod.toLowerCase()}/return`;
  const { postUrl, fields } = gateway.buildRequest(order.paymentMethod, {
    amountPkr: totalPrice,
    txnRef,
    orderRef: txnRef,
    description: `Order ${order._id}`,
    returnUrl,
  });

  // The browser auto-POSTs these fields to `postUrl` (the gateway's page).
  res.status(201).json({
    orderId: order._id,
    payment: { type: 'redirect', method: order.paymentMethod, postUrl, fields },
  });
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

  const oldStatus = order.orderStatus;
  order.orderStatus = status;

  if (status === 'Delivered') {
    order.isDelivered = true;
    order.deliveredAt = new Date();
  }

  // Settle payment, decrement stock and record revenue when moving to Processing/Shipped/Delivered
  const isConfirming = ['Pending', 'Cancelled'].includes(oldStatus) && ['Processing', 'Shipped', 'Delivered'].includes(status);
  if (isConfirming && !order.isPaid) {
    order.isPaid = true;
    order.paidAt = new Date();

    const { checkAndAwardVoucher, markVoucherUsed } = require('../utils/voucherHelper');
    await markVoucherUsed(order);
    await checkAndAwardVoucher(order);

    const Shop = require('../models/Shop');
    for (const item of order.orderItems) {
      await Product.updateOne({ _id: item.product }, { $inc: { stock: -item.qty } });
      if (item.shop) {
        await Shop.updateOne(
          { _id: item.shop },
          { $inc: { totalRevenue: item.price * item.qty, totalOrders: 1 } }
        );
      }
    }
  }

  if (oldStatus !== status && ['Shipped', 'Delivered', 'Cancelled', 'Refunded'].includes(status)) {
    try {
      const Notification = require('../models/Notification');
      const { sendNotification } = require('../socket');

      const notif = await Notification.create({
        user: order.customer,
        type: 'order',
        title: `Order ${status.toLowerCase()}`,
        message: `Your order ${order.orderNumber || order._id} has been ${status.toLowerCase()}.`,
        link: `/my-orders/${order._id}`,
      });
      sendNotification(order.customer, notif.toJSON());
    } catch (err) {
      console.error('Failed to create order status change notification:', err.message);
    }
  }

  await order.save();
  res.json(presentOrder(order));
});

// POST /api/orders/:id/refund-request
const requestRefund = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const RefundRequest = require('../models/RefundRequest');

  if (!reason?.trim()) {
    res.status(400);
    throw new Error('Reason is required');
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.customer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to request refund for this order');
  }

  if (!order.isPaid && order.orderStatus !== 'Delivered') {
    res.status(400);
    throw new Error('Refund can only be requested for paid or delivered orders');
  }

  const exists = await RefundRequest.findOne({ order: order._id });
  if (exists) {
    res.status(400);
    throw new Error('Refund request already submitted for this order');
  }

  const refund = await RefundRequest.create({
    order: order._id,
    customer: req.user._id,
    reason: reason.trim(),
  });

  res.status(201).json(refund);
});

// PATCH /api/orders/:id/cancel
const cancelOrder = asyncHandler(async (req, res) => {
  const RefundRequest = require('../models/RefundRequest');
  const Notification = require('../models/Notification');
  const { sendNotification } = require('../socket');
  const User = require('../models/User');

  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.customer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to cancel this order');
  }

  const uncancellable = ['Shipped', 'Delivered', 'Cancelled', 'Refunded'];
  if (uncancellable.includes(order.orderStatus)) {
    res.status(400);
    throw new Error(`Order cannot be cancelled because it is already ${order.orderStatus.toLowerCase()}`);
  }

  order.orderStatus = 'Cancelled';
  await order.save();

  if (order.isPaid) {
    await RefundRequest.create({
      order: order._id,
      customer: req.user._id,
      reason: 'Order cancelled by customer',
      status: 'pending',
    });
  }

  try {
    const sellerIds = [...new Set(order.orderItems.map((item) => String(item.seller)))];
    for (const sellerId of sellerIds) {
      const notif = await Notification.create({
        user: sellerId,
        type: 'order',
        title: 'Order Cancelled',
        message: `Order ${order.orderNumber || order._id} was cancelled by the buyer.`,
        link: `/seller/orders`,
      });
      sendNotification(sellerId, notif.toJSON());
    }

    const adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
      const notif = await Notification.create({
        user: adminUser._id,
        type: 'order',
        title: 'Order Cancelled',
        message: `Order ${order.orderNumber || order._id} was cancelled by the buyer.`,
        link: `/admin/orders`,
      });
      sendNotification(adminUser._id, notif.toJSON());
    }
  } catch (err) {
    console.error('Failed to create order cancellation notifications:', err.message);
  }

  res.json({ message: 'Order cancelled successfully', order: presentOrder(order) });
});

// GET /api/orders/:id/invoice
const generateInvoice = asyncHandler(async (req, res) => {
  const PDFDocument = require('pdfkit');

  const order = await Order.findById(req.params.id).populate('customer', 'name email');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const uid = req.user._id.toString();
  const isOwner = order.customer && order.customer._id.toString() === uid;
  if (req.user.role !== 'admin' && !isOwner) {
    res.status(403);
    throw new Error('Not authorized to access this invoice');
  }

  const doc = new PDFDocument({ margin: 50 });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => {
    const buffer = Buffer.concat(chunks);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${order.orderNumber || order._id}.pdf`);
    res.send(buffer);
  });

  // Logo & Header
  doc.fillColor('#1d4ed8').fontSize(24).text('BAZARIX STORE', { align: 'right' });
  doc.fillColor('#475569').fontSize(10).text('Premium Craft & Trade Marketplace', { align: 'right' });
  doc.moveDown(1.5);

  // Title
  doc.fillColor('#0f172a').fontSize(20).text('INVOICE', { underline: true });
  doc.moveDown(1);

  // Metadata
  doc.fontSize(10).fillColor('#334155');
  doc.text(`Invoice Number: ${order.orderNumber || order._id}`);
  doc.text(`Order Date: ${new Date(order.createdAt).toLocaleString()}`);
  doc.text(`Payment Method: ${order.paymentMethod}`);
  doc.text(`Payment Status: ${order.isPaid ? 'Paid' : 'Unpaid'}`);
  doc.moveDown(1.5);

  // Customer Section
  doc.fillColor('#0f172a').fontSize(12).text('BILL TO:', { style: 'bold' });
  doc.fontSize(10).fillColor('#334155');
  doc.text(`Customer Name: ${order.customer?.name || 'Guest User'}`);
  doc.text(`Customer Email: ${order.customer?.email || 'N/A'}`);

  const addr = order.shippingAddress;
  if (addr) {
    doc.text(`Shipping Address: ${addr.street || ''}, ${addr.city || ''}, ${addr.province || ''} - ${addr.postalCode || ''}`);
  }
  doc.moveDown(2);

  // Line items headers
  doc.fillColor('#0f172a').fontSize(11);
  doc.text('Item Description', 50, doc.y, { width: 220 });
  doc.text('Qty', 280, doc.y, { width: 40, align: 'right' });
  doc.text('Unit Price', 340, doc.y, { width: 100, align: 'right' });
  doc.text('Subtotal', 460, doc.y, { width: 90, align: 'right' });
  doc.moveDown(0.5);

  const startY = doc.y;
  doc.strokeColor('#cbd5e1');
  doc.lineWidth(1);
  doc.moveTo(50, startY).lineTo(550, startY).stroke();
  doc.moveDown(0.5);

  // Print items
  doc.fillColor('#334155').fontSize(10);
  (order.orderItems || []).forEach((item) => {
    const currentY = doc.y;
    doc.text(item.name || 'Unnamed Product', 50, currentY, { width: 220 });
    doc.text(String(item.qty || 0), 280, currentY, { width: 40, align: 'right' });
    doc.text(`PKR ${(item.price || 0).toLocaleString()}`, 340, currentY, { width: 100, align: 'right' });
    doc.text(`PKR ${((item.price || 0) * (item.qty || 0)).toLocaleString()}`, 460, currentY, { width: 90, align: 'right' });
    doc.moveDown(0.8);
  });

  doc.moveDown(1);
  const endY = doc.y;
  doc.strokeColor('#cbd5e1');
  doc.lineWidth(1);
  doc.moveTo(50, endY).lineTo(550, endY).stroke();
  doc.moveDown(0.5);

  // Totals
  doc.fontSize(10).fillColor('#334155');
  doc.text(`Items Subtotal: PKR ${(order.itemsPrice || 0).toLocaleString()}`, 350, doc.y, { align: 'right' });
  doc.text(`Shipping Charges: PKR ${(order.shippingPrice || 0).toLocaleString()}`, 350, doc.y, { align: 'right' });
  if (order.voucherDiscount > 0) {
    doc.text(`Voucher Discount: -PKR ${(order.voucherDiscount || 0).toLocaleString()} (${order.voucherCode || ''})`, 350, doc.y, { align: 'right' });
  }
  doc.moveDown(0.5);
  doc.fontSize(12).fillColor('#1d4ed8').text(`Grand Total: PKR ${(order.totalPrice || 0).toLocaleString()}`, 350, doc.y, { align: 'right', style: 'bold' });

  // Footer note
  doc.moveDown(3);
  doc.fillColor('#94a3b8').fontSize(9).text('Thank you for shopping at Bazarix Store! If you have any questions, please contact our support team.', { align: 'center' });

  doc.end();
});

module.exports = {
  createOrder,
  getMyOrders,
  getSellerOrders,
  getOrder,
  updateOrderStatus,
  requestRefund,
  cancelOrder,
  generateInvoice,
  presentOrder,
};
