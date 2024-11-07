// routes/webhook.js

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Purchase = require('../models/Purchase');

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  let event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // Log for debugging
    console.log('Webhook secret:', webhookSecret ? 'exists' : 'missing');
    console.log('Stripe signature:', req.headers['stripe-signature']);

    if (!webhookSecret) {
      throw new Error('Webhook secret is not configured');
    }

    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      webhookSecret
    );

    console.log('Webhook event received:', event.type);

    // Handle any event that has customer email
    if (event.type.includes('customer') && event.data.object.email) {
      const customerEmail = event.data.object.email;

      try {
        const purchase = await Purchase.findOneAndUpdate(
          { email: customerEmail },
          {
            email: customerEmail,
            hasPurchased: true,
            purchaseDate: new Date()
          },
          { upsert: true, new: true }
        );

        console.log('Purchase record updated:', purchase);
      } catch (error) {
        console.error('Error recording purchase:', error);
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

module.exports = router;
