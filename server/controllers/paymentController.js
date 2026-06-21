const Order = require('../models/Order');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const Notification = require('../models/Notification');
const sendEmail = require('../utils/sendEmail');
const gateway = require('../utils/paymentGateway');

function clientBaseUrl() {
  return process.env.CLIENT_URL || 'http://localhost:5173';
}

/**
 * Mark an order paid exactly once: flip status, decrement stock, bump shop
 * counters, and notify/email the customer. Safe to call more than once.
 */
async function finalizeOrder(order, result) {
  if (!order || order.isPaid) return;

  order.isPaid = true;
  order.paidAt = new Date();
  order.orderStatus = 'Processing';
  order.paymentResult = {
    id: result.id || order.gatewayTxnRef,
    status: result.status || 'completed',
    updateTime: new Date().toISOString(),
    emailAddress: order.customer?.email,
  };
  await order.save();

  for (const item of order.orderItems) {
    await Product.updateOne({ _id: item.product }, { $inc: { stock: -item.qty } });
    if (item.shop) {
      await Shop.updateOne(
        { _id: item.shop },
        { $inc: { totalRevenue: item.price * item.qty, totalOrders: 1 } }
      );
    }
  }

  if (order.customer) {
    await Notification.create({
      user: order.customer._id,
      type: 'payment',
      title: 'Payment received',
      message: `Your order ${order._id} has been confirmed.`,
    });
    if (order.customer.email) {
      await sendEmail({
        to: order.customer.email,
        subject: 'Order confirmation — Multivendor Store',
        text: `Thank you! Your order ${order._id} is confirmed and now processing.`,
      }).catch((err) => console.error('Order email failed:', err.message));
    }
  }
}

/** Redirect the buyer's browser back to the storefront result page. */
function redirectToClient(res, ok, orderId) {
  const base = clientBaseUrl();
  const path = ok ? 'checkout/success' : 'checkout/cancel';
  res.redirect(`${base}/${path}?orderId=${orderId || ''}`);
}

/**
 * POST/GET /api/payment/:method/return
 * The gateway redirects the buyer here after payment. We verify the signed
 * response, finalize the order, then bounce the browser to the result page.
 */
function gatewayReturn(method) {
  return async function handler(req, res) {
    const body = { ...req.query, ...req.body };
    let order = null;
    let ok = false;
    try {
      const { valid, success, txnRef } = gateway.verifyResponse(method, body);
      order = await Order.findOne({ gatewayTxnRef: txnRef }).populate('customer', 'name email');
      if (order && valid && success) {
        await finalizeOrder(order, { id: txnRef, status: 'completed' });
        ok = true;
      } else if (order && !success) {
        order.orderStatus = 'Cancelled';
        await order.save();
      }
    } catch (err) {
      console.error(`${method} return error:`, err.message);
    }
    redirectToClient(res, ok, order ? order._id : '');
  };
}

/**
 * GET /api/payment/simulate?orderId=..&status=success
 * Dev-only fallback used when gateway credentials are not configured: marks the
 * order paid (or cancelled) and redirects to the result page, mimicking the
 * gateway round-trip so the checkout flow works locally.
 */
async function simulateReturn(req, res) {
  const { orderId, status } = req.query;
  let ok = false;
  let order = null;
  try {
    order = await Order.findById(orderId).populate('customer', 'name email');
    if (order) {
      if (status === 'success') {
        await finalizeOrder(order, { id: order.gatewayTxnRef, status: 'simulated' });
        ok = true;
      } else {
        order.orderStatus = 'Cancelled';
        await order.save();
      }
    }
  } catch (err) {
    console.error('Simulated payment error:', err.message);
  }
  redirectToClient(res, ok, orderId);
}

module.exports = {
  finalizeOrder,
  jazzcashReturn: gatewayReturn('JazzCash'),
  easypaisaReturn: gatewayReturn('Easypaisa'),
  simulateReturn,
};
