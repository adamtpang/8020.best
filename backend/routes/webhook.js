// routes/webhook.js

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Purchase = require('../models/Purchase');

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log('Webhook received:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const customerEmail = session.customer_email?.toLowerCase();

      console.log('Processing purchase for:', customerEmail);

      try {
        let purchase = await Purchase.findOne({ email: customerEmail });
        console.log('Existing purchase record:', purchase);

        purchase = await Purchase.findOneAndUpdate(
          { email: customerEmail },
          {
            email: customerEmail,
            hasPurchased: true,
            purchaseDate: new Date(),
            stripeSessionId: session.id
          },
          {
            upsert: true,
            new: true,
            runValidators: true
          }
        );

        console.log('Purchase record updated:', purchase);
      } catch (error) {
        console.error('MongoDB Error:', error);
      }
    }

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
