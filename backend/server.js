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

// Webhook handling - MUST come before other middleware
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

app.post('/webhook',
  express.raw({type: 'application/json'}),
  async (request, response) => {
    const buf = request.body;
    const sig = request.headers['stripe-signature'];

    // Debug logging
    console.log('Webhook received:', {
      bodyType: typeof buf,
      bodyLength: buf?.length,
      isBuffer: Buffer.isBuffer(buf),
      signature: sig?.substring(0, 20) + '...',
      secretLength: endpointSecret?.length
    });

    let event;

    try {
      // Verify exactly as Stripe docs show
      event = stripe.webhooks.constructEvent(
        buf,
        sig,
        endpointSecret
      );

      // Handle the checkout.session.completed event
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        // Log the session data
        console.log('Processing checkout session:', {
          id: session.id,
          email: session.customer_email
        });

        try {
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

          console.log('Purchase recorded:', {
            email: session.customer_email,
            success: true
          });
        } catch (dbError) {
          console.error('Database error:', dbError);
          return response.status(500).send('Database error');
        }
      }

      // Send success response
      response.json({received: true});

    } catch (err) {
      // Log the full error details
      console.error('Webhook Error:', {
        message: err.message,
        type: err.type,
        bodyPreview: buf?.toString().substring(0, 50) + '...',
        signatureHeader: sig,
        secretPreview: endpointSecret?.substring(0, 5) + '...'
      });

      response.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

// CORS and other middleware MUST come AFTER webhook route
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
