const Stripe = require('stripe');

let stripeClient = null;

/** Lazily create and cache the Stripe client. Returns null if no key is set. */
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

module.exports = { getStripe };
