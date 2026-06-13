const Order = require('../models/Order');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const Notification = require('../models/Notification');
const sendEmail = require('../utils/sendEmail');
const { getStripe } = require('../utils/stripe');

/**
 * POST /api/payment/webhook  (public, raw body)
 * Mounted BEFORE express.json() so Stripe signature verification gets the raw bytes.
 */
async function stripeWebhook(req, res) {
  const stripe = getStripe();
  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    if (stripe && secret) {
      event = stripe.webhooks.constructEvent(req.body, sig, secret);
    } else {
      // Dev fallback when no signing secret is configured.
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      const order = await Order.findOne({ stripePaymentIntentId: intent.id }).populate(
        'customer',
        'name email'
      );
      if (order && !order.isPaid) {
        order.isPaid = true;
        order.paidAt = new Date();
        order.orderStatus = 'Processing';
        order.paymentResult = {
          id: intent.id,
          status: intent.status,
          updateTime: new Date().toISOString(),
          emailAddress: order.customer?.email,
        };
        await order.save();

        // Decrement stock and bump shop counters.
        for (const item of order.orderItems) {
          await Product.updateOne({ _id: item.product }, { $inc: { stock: -item.qty } });
          if (item.shop) {
            await Shop.updateOne(
              { _id: item.shop },
              { $inc: { totalRevenue: item.price * item.qty, totalOrders: 1 } }
            );
          }
        }

        // Notify + email the customer.
        if (order.customer) {
          await Notification.create({
            user: order.customer._id,
            type: 'payment',
            title: 'Payment received',
            message: `Your order ${order._id} has been confirmed.`,
          });
          await sendEmail({
            to: order.customer.email,
            subject: 'Order confirmation — Multivendor Store',
            text: `Thank you! Your order ${order._id} is confirmed and now processing.`,
          });
        }
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object;
      const order = await Order.findOne({ stripePaymentIntentId: intent.id });
      if (order) {
        order.orderStatus = 'Cancelled';
        await order.save();
      }
    }
  } catch (err) {
    // Log but still 200 so Stripe doesn't retry indefinitely on app-side errors.
    console.error('Webhook handler error:', err.message);
  }

  res.json({ received: true });
}

module.exports = { stripeWebhook };
