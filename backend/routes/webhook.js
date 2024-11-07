// routes/webhook.js

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Purchase = require('../models/Purchase');

router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  console.log('Webhook called');
  console.log('Raw body exists:', !!req.rawBody);
  console.log('Signature:', sig);

  try {
    const event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      webhookSecret
    );

    console.log('Event verified:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const customerEmail = session.customer_email?.toLowerCase();

      console.log('Processing purchase for:', customerEmail);

      if (customerEmail) {
        const purchase = await Purchase.findOneAndUpdate(
          { email: customerEmail },
          {
            email: customerEmail,
            hasPurchased: true,
            purchaseDate: new Date(),
            stripeSessionId: session.id
          },
          { upsert: true, new: true }
        );

        console.log('Purchase record updated:', purchase);
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

module.exports = router;
