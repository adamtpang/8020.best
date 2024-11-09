const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY?.trim());
const crypto = require('crypto');

router.post(
  '/',
  express.raw({ type: '*/*' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

    // Log the signature header
    console.log('Signature header:', sig);

    // Log the request body
    const rawBody = req.body;
    const rawBodyLength = rawBody.length;
    const rawBodyHash = crypto.createHash('sha256').update(rawBody).digest('hex');

    console.log('Request body:', {
      isBuffer: Buffer.isBuffer(rawBody),
      length: rawBodyLength,
      hash: rawBodyHash,
      type: typeof rawBody,
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
      const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

      console.log('Event verified:', event.type);

      // Handle the event
      res.status(200).send('Success');
    } catch (err) {
      // Extract received signatures
      const receivedSignatures = sig.split(',').reduce((acc, item) => {
        const [key, value] = item.split('=');
        acc[key] = value;
        return acc;
      }, {});

      // Compute expected signature
      const payload = rawBody.toString('utf8');
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(`${receivedSignatures.t}.${payload}`, 'utf8')
        .digest('hex');

      console.error('Webhook signature verification failed:', err.message);
      console.error('Error details:', {
        message: err.message,
        type: err.type,
        stack: err.stack,
        requestBody: {
          isBuffer: Buffer.isBuffer(rawBody),
          length: rawBody.length,
          hash: rawBodyHash,
        },
        receivedSignatures,
        expectedSignature,
      });
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

module.exports = router;
