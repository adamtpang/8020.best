// server.js

require('dotenv').config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
});

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ error: err.message });
});

// CORS middleware
app.use(cors({
  origin: [
    'http://localhost:3001',
    'https://8020.best',
    'https://www.8020.best'
  ],
  credentials: true
}));

// Webhook handler - must be before any body parsers
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    console.log('Webhook received with signature:', sig);
    console.log('Webhook secret:', process.env.STRIPE_WEBHOOK_SECRET ? 'Present' : 'Missing');

    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log('Webhook event type:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const customerEmail = session.customer_details.email;
      console.log('Processing purchase for:', customerEmail);

      await mongoose.connection.collection('users').updateOne(
        { email: customerEmail },
        {
          $set: {
            hasPurchased: true,
            purchaseDate: new Date(),
            stripeSessionId: session.id
          }
        },
        { upsert: true }
      );
      console.log('Purchase recorded for:', customerEmail);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// JSON parsing for other routes
app.use(express.json());

// API routes
const router = express.Router();

// Purchase check endpoint
router.get('/purchases/check-purchase', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    console.log('Checking purchase status for:', email);

    const user = await mongoose.connection.collection('users').findOne({ email });
    console.log('User found:', user);

    res.json({ hasPurchased: user?.hasPurchased || false });
  } catch (error) {
    console.error('Error checking purchase:', error);
    res.status(500).json({ error: 'Failed to check purchase status' });
  }
});

// Get lists endpoint
router.get('/purchases/lists', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    console.log('Loading lists for:', email);

    const user = await mongoose.connection.collection('users').findOne({ email });
    if (!user) {
      return res.json({ list1: [], list2: [], list3: [] });
    }

    res.json({
      list1: user.list1 || [],
      list2: user.list2 || [],
      list3: user.list3 || []
    });
  } catch (error) {
    console.error('Error loading lists:', error);
    res.status(500).json({ error: 'Failed to load lists' });
  }
});

// Save lists endpoint
router.post('/purchases/save-lists', async (req, res) => {
  try {
    const { email, list1, list2, list3 } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    console.log('Saving lists for:', email);

    await mongoose.connection.collection('users').updateOne(
      { email },
      {
        $set: {
          list1: list1 || [],
          list2: list2 || [],
          list3: list3 || []
        }
      },
      { upsert: true }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving lists:', error);
    res.status(500).json({ error: 'Failed to save lists' });
  }
});

// Mount API routes
app.use('/api', router);

// Connect to MongoDB and start server
console.log('Starting server...');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('MongoDB URI:', process.env.MONGO_URI ? 'Present' : 'Missing');

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', (err) => {
      if (err) {
        console.error('Server startup error:', err);
        process.exit(1);
      }
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  });
