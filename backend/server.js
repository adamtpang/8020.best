// server.js

require('web-streams-polyfill');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

// Determine allowed origins based on environment
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://hower.app', 'https://www.hower.app', 'https://howerapp-production.up.railway.app']
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

// Log environment and origins for debugging
console.log('Environment:', process.env.NODE_ENV);
console.log('Allowed Origins:', allowedOrigins);

// CORS configuration with dynamic origin checking
app.use(cors({
  origin: function (origin, callback) {
    console.log('Request origin:', origin);
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight
app.options('*', cors());

app.use(express.json());

// Handle raw body for Stripe webhooks
app.use('/webhook', express.raw({ type: 'application/json' }));

// MongoDB connection with specific database
const mongoConfig = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'howerdotapp'  // Specify the database name
};

mongoose.connect(process.env.MONGO_URI, mongoConfig)
  .then(() => {
    console.log('Connected to MongoDB - Database:', mongoConfig.dbName);
    console.log('Collections:', mongoose.connection.collections);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Import routes
const userDataRouter = require('./routes/userData');
const purchasesRouter = require('./routes/purchases');
const webhookRouter = require('./routes/webhook');

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Hower API Server',
    status: 'running',
    environment: process.env.NODE_ENV,
    database: mongoConfig.dbName,
    timestamp: new Date().toISOString()
  });
});

// Use routes
app.use(userDataRouter);
app.use(purchasesRouter);
app.use(webhookRouter);

// Stripe webhook handler
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful payment
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const customerEmail = session.customer_email;

    try {
      // Update purchase status
      const purchase = await Purchase.findOneAndUpdate(
        { email: customerEmail },
        {
          email: customerEmail,
          hasPurchased: true,
          purchaseDate: new Date(),
          stripeSessionId: session.id
        },
        { upsert: true, new: true }
      );

      console.log('Purchase recorded for:', customerEmail);
    } catch (error) {
      console.error('Error recording purchase:', error);
    }
  }

  res.json({ received: true });
});

// Success URL handler
app.get('/api/purchases/success', async (req, res) => {
  const { session_id } = req.query;

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    const customerEmail = session.customer_email;

    // Update purchase status
    const purchase = await Purchase.findOneAndUpdate(
      { email: customerEmail },
      {
        email: customerEmail,
        hasPurchased: true,
        purchaseDate: new Date(),
        stripeSessionId: session_id
      },
      { upsert: true, new: true }
    );

    console.log('Purchase confirmed for:', customerEmail);
    res.redirect('/product');
  } catch (error) {
    console.error('Error confirming purchase:', error);
    res.redirect('/?error=purchase-confirmation-failed');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});
