// routes/webhook.js

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');

// Stripe webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (request, response) => {});

module.exports = router;
