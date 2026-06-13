const express = require('express');
const { stripeWebhook } = require('../controllers/paymentController');

const router = express.Router();

// NOTE: the raw body parser for this route is applied in server.js BEFORE express.json().
router.post('/webhook', stripeWebhook);

module.exports = router;
