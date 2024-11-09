const express = require('express');
const router = express.Router();

router.post(
  '/',
  express.raw({ type: '*/*' }),
  async (req, res) => {
    try {
      console.log('Webhook received');

      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY?.trim());
      const sig = req.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

      // Log request details
      console.log('Webhook details:', {
        hasBody: !!req.body,
        bodyLength: req.body?.length,
        isBuffer: Buffer.isBuffer(req.body),
        hasSignature: !!sig,
        signatureLength: sig?.length,
        secretLength: webhookSecret?.length
      });

      // Verify webhook
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret
      );

      console.log('Event verified:', event.type);

      // Handle the event
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        console.log('Processing session:', session.id);

        const Purchase = require('../models/Purchase');
        await Purchase.findOneAndUpdate(
          { email: session.customer_email },
          {
            $set: {
              hasPurchased: true,
              purchaseDate: new Date(),
              stripeSessionId: session.id
            }
          },
          { upsert: true }
        );

        console.log('Purchase recorded for:', session.customer_email);
      }

      res.status(200).send('Success');

    } catch (err) {
      console.error('Webhook error:', {
        message: err.message,
        stack: err.stack?.split('\n')[0]
      });
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

module.exports = router;
