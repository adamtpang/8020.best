// server.js

require('dotenv').config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
});

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// CORS middleware
app.use(cors({
  origin: [
    'http://localhost:3001',
    'http://localhost:5173',
    'https://8020.best',
    'https://www.8020.best'
  ],
  credentials: true
}));

// Webhook handler - must be before any body parsers
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

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
      console.log('Purchase recorded successfully for:', customerEmail);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// JSON parsing for other routes
app.use(express.json());

// Purchase check endpoint
app.get('/api/purchases/check-purchase', async (req, res) => {
  try {
    const { email } = req.query;
    console.log('Checking purchase status for:', email);

    const user = await mongoose.connection.collection('users').findOne({ email });
    console.log('User found:', user);

    res.json({ hasPurchased: user?.hasPurchased || false });
  } catch (error) {
    console.error('Error checking purchase:', error);
    res.status(500).json({ error: 'Failed to check purchase status' });
  }
});

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
