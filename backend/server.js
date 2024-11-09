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

// Webhook handling
app.post('/webhook',
  express.raw({type: '*/*'}),  // Accept any content type
  async (req, res) => {
    try {
      // Log request details
      console.log('Webhook received:', {
        contentType: req.headers['content-type'],
        contentLength: req.headers['content-length'],
        bodyType: typeof req.body,
        isBuffer: Buffer.isBuffer(req.body)
      });

      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY?.trim());
      const sig = req.headers['stripe-signature'];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

      // Verify we have what we need
      if (!sig || !endpointSecret || !req.body) {
        console.log('Missing required data:', {
          hasSignature: !!sig,
          hasSecret: !!endpointSecret,
          hasBody: !!req.body
        });
        return res.status(400).send('Missing required webhook data');
      }

      // Verify webhook
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        endpointSecret
      );

      console.log('Event verified:', event.type);

      // Handle the event
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        console.log('Processing session:', session.id);

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

        console.log('Purchase recorded for:', session.customer_email);
      }

      // Send success response
      res.json({ received: true });

    } catch (err) {
      console.error('Webhook error:', {
        message: err.message,
        stack: err.stack,
        headers: req.headers,
        bodyPreview: req.body?.toString().slice(0, 100)
      });
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

// Other middleware AFTER webhook
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
