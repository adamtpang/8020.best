// server.js

require('web-streams-polyfill');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

const app = express();

// Environment setup
const environment = process.env.NODE_ENV || 'development';
console.log('Environment:', environment);

// CORS setup
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://hower.app',
  'https://go.hower.app'
];

console.log('Allowed Origins:', allowedOrigins);

// Create a new router for the webhook
const webhookRouter = express.Router();

// Configure webhook route with raw body parser
webhookRouter.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY?.trim());

  // Log headers and body for debugging
  console.log('Webhook Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Webhook Body Length:', req.body.length);

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  console.log('Webhook Secret Length:', webhookSecret?.length);
  console.log('Signature Header:', sig);

  let event;

  try {
    // Verify the event
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      console.log('Processing successful payment:', {
        sessionId: session.id,
        customerEmail: session.customer_email
      });

      const Purchase = require('./models/Purchase');
      const result = await Purchase.findOneAndUpdate(
        { email: session.customer_email },
        {
          $set: {
            hasPurchased: true,
            purchaseDate: new Date(),
            stripeSessionId: session.id
          }
        },
        { upsert: true, new: true }
      );

      console.log('Updated purchase record:', {
        email: session.customer_email,
        hasPurchased: result.hasPurchased,
        purchaseDate: result.purchaseDate
      });
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook Error:', {
      message: err.message,
      stack: err.stack,
      body: req.body.toString('utf8').slice(0, 100) + '...' // Log first 100 chars of body
    });

    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// Use the webhook router BEFORE other middleware
app.use(webhookRouter);

// CORS and other middleware AFTER webhook router
app.use(cors({
  origin: function(origin, callback) {
    console.log('Request origin:', origin);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Regular JSON parser for non-webhook routes
app.use(express.json());

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();

// Routes setup
console.log('Registering purchase routes...');
const purchasesRouter = require('./routes/purchases');
app.use('/', purchasesRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${environment} mode`);
});
