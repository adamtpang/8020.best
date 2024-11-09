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

// Custom middleware to handle raw body
const getRawBody = (req, res, next) => {
  if (req.url === '/webhook' && req.method === 'POST') {
    let data = '';
    req.setEncoding('utf8');

    req.on('data', chunk => {
      data += chunk;
    });

    req.on('end', () => {
      req.rawBody = data;
      next();
    });
  } else {
    next();
  }
};

// Use raw body middleware FIRST
app.use(getRawBody);

// Webhook handling - MUST be first
app.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (request, response) => {
    console.log('Webhook received');

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const sig = request.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    console.log('Request headers:', request.headers);
    console.log('Body type:', typeof request.body);
    console.log('Body is buffer:', Buffer.isBuffer(request.body));
    console.log('Signature:', sig);

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        request.body,
        sig,
        endpointSecret
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

        console.log('Purchase recorded for:', session.customer_email);
      }

      response.send({ received: true });
    } catch (err) {
      console.log('Webhook error:', err.message);
      return response.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

// CORS and other middleware MUST come after webhook
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
