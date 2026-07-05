const express = require('express');
const {
  jazzcashReturn,
  easypaisaReturn,
  simulateReturn,
  stripeSuccess,
  stripeCancel,
} = require('../controllers/paymentController');

const router = express.Router();

// Gateways redirect the buyer back here after payment (form-POST or GET).
router.post('/jazzcash/return', jazzcashReturn);
router.get('/jazzcash/return', jazzcashReturn);
router.post('/easypaisa/return', easypaisaReturn);
router.get('/easypaisa/return', easypaisaReturn);

// Stripe redirect endpoints
router.get('/stripe/success', stripeSuccess);
router.get('/stripe/cancel', stripeCancel);

// Dev fallback used when no gateway credentials are configured.
router.get('/simulate', simulateReturn);

module.exports = router;
