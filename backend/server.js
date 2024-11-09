// server.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  // Don't exit the process
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Don't exit the process
});

const app = express();

// Environment setup
const environment = process.env.NODE_ENV || 'development';
console.log('Environment:', environment);

// Allowed Origins for CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://hower.app',
  'https://go.hower.app'
];

// Webhook handling - MUST come first
app.post(
  '/webhook',
  express.raw({ type: '*/*' }),  // Accept any content type
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
        secretLength: webhookSecret?.length,
        contentType: req.headers['content-type']
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

      res.status(200).send('Success');

    } catch (err) {
      console.error('Webhook error:', {
        message: err.message,
        stack: err.stack?.split('\n')[0],
        headers: req.headers,
        bodyType: typeof req.body,
        isBuffer: Buffer.isBuffer(req.body)
      });
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

// CORS and other middleware AFTER webhook
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

// MongoDB connection with retry
const connectDB = async (retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000
      });
      console.log('Connected to MongoDB');
      return;
    } catch (error) {
      console.error(`MongoDB connection attempt ${i + 1} failed:`, error);
      if (i === retries - 1) {
        console.error('All MongoDB connection attempts failed');
      } else {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
};

connectDB();

// Routes setup
console.log('Registering purchase routes...');
const purchasesRouter = require('./routes/purchases');
app.use('/', purchasesRouter);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${environment} mode`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});
