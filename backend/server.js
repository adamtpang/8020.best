// server.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

const app = express();

// Environment setup
const environment = process.env.NODE_ENV || 'development';
console.log('Environment:', environment);

// Webhook handling - MUST come first
app.post(
  '/webhook',
  express.raw({ type: 'application/json' }),  // Match Stripe's content type exactly
  async (req, res) => {
    try {
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
        secretLength: webhookSecret?.length,
        contentType: req.headers['content-type']
      });

      // Verify webhook
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret
      );

      // Handle the event
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const Purchase = require('./models/Purchase');
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

// CORS and other middleware AFTER webhook
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://hower.app',
      'https://go.hower.app'
    ].includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes setup
const purchasesRouter = require('./routes/purchases');
app.use('/', purchasesRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${environment} mode`);
});
