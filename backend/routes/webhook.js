const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY?.trim());
const crypto = require('crypto');

router.post(
  '/',
  express.raw({ type: '*/*' }),
  async (req, res) => {
    try {
      console.log('\n=== Webhook Request Received ===');

      const sig = req.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

      // Log headers
      console.log('Headers:', {
        'stripe-signature': sig?.substring(0, 20) + '...',
        'content-type': req.headers['content-type'],
        'content-length': req.headers['content-length']
      });

      // Log request body details
      const bodyHash = crypto.createHash('sha256').update(req.body).digest('hex');
      console.log('Request body:', {
        isBuffer: Buffer.isBuffer(req.body),
        length: req.body?.length,
        hash: bodyHash.substring(0, 20) + '...',
        type: typeof req.body
      });

      // Log webhook secret details
      console.log('Webhook secret:', {
        exists: !!webhookSecret,
        length: webhookSecret?.length,
        firstChar: webhookSecret?.[0],
        lastChar: webhookSecret?.[webhookSecret.length - 1]
      });

      // Verify webhook
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret
      );

      console.log('Event verified:', {
        type: event.type,
        id: event.id
      });

      // Handle the event
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        console.log('Processing checkout session:', {
          id: session.id,
          email: session.customer_email
        });

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

        console.log('Purchase recorded successfully');
      }

      res.status(200).send('Success');

    } catch (err) {
      console.error('Webhook error:', {
        message: err.message,
        type: err.name,
        stack: err.stack?.split('\n')[0],
        requestBody: {
          isBuffer: Buffer.isBuffer(req.body),
          length: req.body?.length,
          type: typeof req.body
        }
      });
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

module.exports = router;
