const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY?.trim());
const crypto = require('crypto');

router.post(
  '/',
  express.raw({
    type: (req) => req.headers['content-type'].startsWith('application/json'),
  }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

    // Log the signature header
    console.log('Signature header:', sig);

    // Log the raw request body
    const rawBodyLength = req.body.length;
    const rawBodyHash = crypto.createHash('sha256').update(req.body).digest('hex');

    console.log('Request body:', {
      isBuffer: Buffer.isBuffer(req.body),
      length: rawBodyLength,
      hash: rawBodyHash,
      type: typeof req.body,
    });

    // Log the webhook secret details
    console.log('Webhook secret:', {
      exists: !!webhookSecret,
      length: webhookSecret?.length,
      firstChar: webhookSecret?.charAt(0),
      lastChar: webhookSecret?.slice(-1),
    });

    try {
      // Verify the webhook signature
      const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

      console.log('Event verified:', event.type);

      // Handle the event
      res.status(200).send('Success');
    } catch (err) {
      console.error('Webhook error:', {
        message: err.message,
        type: err.name,
        stack: err.stack?.split('\n')[0],
        requestBody: {
          isBuffer: Buffer.isBuffer(req.body),
          length: req.body.length,
          type: typeof req.body,
        },
      });
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

module.exports = router;
