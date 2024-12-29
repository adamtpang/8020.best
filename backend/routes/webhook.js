const express = require('express');

// Export a function that takes stripe as a parameter
module.exports = function (stripe) {
  const router = express.Router();

  // Debug logging
  console.log('Webhook route initialized with Stripe instance:', !!stripe);

  router.post(
    '/',
    express.raw({ type: 'application/json' }),
    async (request, response) => {
      const sig = request.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

      if (!webhookSecret) {
        console.error('STRIPE_WEBHOOK_SECRET is not set!');
        response.status(500).send('Webhook secret not configured');
        return;
      }

      let event;

      try {
        event = stripe.webhooks.constructEvent(request.body, sig, webhookSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        response.status(400).send(`Webhook Error: ${err.message}`);
        return;
      }

      // Handle the checkout.session.completed event
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        try {
          const customerEmail = session.customer_email.toLowerCase();
          console.log('Processing webhook for email:', customerEmail);

          // Update purchase status in MongoDB
          const Purchase = require('../models/Purchase');
          const result = await Purchase.findOneAndUpdate(
            { email: customerEmail },
            {
              $set: {
                hasPurchased: true,
                purchaseDate: new Date(),
                stripeSessionId: session.id,
                amount: session.amount_total
              }
            },
            { upsert: true, new: true }
          );

          console.log('Purchase recorded successfully:', {
            email: customerEmail,
            sessionId: session.id,
            amount: session.amount_total
          });

          response.json({ received: true });
        } catch (error) {
          console.error('Error processing webhook:', error);
          response.status(500).send(`Webhook Error: ${error.message}`);
        }
      } else {
        // For other event types, just acknowledge receipt
        response.json({ received: true });
      }
    }
  );

  return router;
};
