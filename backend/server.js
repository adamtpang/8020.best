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
    'https://www.8020.best',
    'https://8020best-production.up.railway.app'
  ],
  credentials: true
}));

// Webhook handler - must be before any body parsers
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    console.log('\n=== WEBHOOK HANDLER START ===');
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

      // Try multiple sources for the user email
      const userEmail = (
        session.client_reference_id ||
        session.metadata?.userEmail ||
        session.customer_details?.email ||
        ''
      ).toLowerCase();

      console.log('Session data:', {
        client_reference_id: session.client_reference_id,
        metadata: session.metadata,
        customer_email: session.customer_details?.email
      });

      if (!userEmail) {
        console.error('No email found in session');
        return res.status(400).send('No user email provided');
      }

      console.log('Processing purchase for Firebase user:', userEmail);

      // Log the session details
      console.log('Stripe session details:', {
        id: session.id,
        userEmail: userEmail,
        customerEmail: session.customer_details?.email,
        paymentStatus: session.payment_status,
        clientReferenceId: session.client_reference_id
      });

      // Log MongoDB connection state
      console.log('MongoDB connection state before update:', mongoose.connection.readyState);

      // Perform the MongoDB update using the Firebase user's email
      const updateResult = await mongoose.connection.collection('users').updateOne(
        { email: userEmail },
        {
          $set: {
            hasPurchased: true,
            purchaseDate: new Date(),
            stripeSessionId: session.id
          }
        },
        { upsert: true }
      );

      console.log('MongoDB update result:', updateResult);

      // Verify the update immediately
      const user = await mongoose.connection.collection('users').findOne({ email: userEmail });
      console.log('User document after update:', user);

      // Double check the collection
      const allUsers = await mongoose.connection.collection('users').find({}).toArray();
      console.log('All users in database:', allUsers);

      console.log('Purchase recorded for Firebase user:', userEmail);
      console.log('=== WEBHOOK HANDLER END ===\n');
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook Error:', err.message);
    console.error('Full webhook error:', err);
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
    const normalizedEmail = email.toLowerCase();
    console.log('\n=== CHECK PURCHASE START ===');
    console.log('Checking purchase status for:', normalizedEmail);

    // Log MongoDB connection status
    console.log('MongoDB connection state:', mongoose.connection.readyState);

    // List all users first
    const allUsers = await mongoose.connection.collection('users').find({}).toArray();
    console.log('All users in database:', allUsers);

    // Try to find user with case-insensitive email
    const user = await mongoose.connection.collection('users').findOne({
      email: normalizedEmail
    });
    console.log('User document found:', user);

    const hasPurchased = user?.hasPurchased || false;
    console.log('Has purchased value:', hasPurchased);
    console.log('=== CHECK PURCHASE END ===\n');

    res.json({ hasPurchased });
  } catch (error) {
    console.error('Error checking purchase:', error);
    console.error('Full error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
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

// Create checkout session endpoint
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('Creating checkout session for:', email);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: '8020.best License',
              description: 'Lifetime access to 8020.best'
            },
            unit_amount: 1000, // $10.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'https://8020.best/success',
      cancel_url: 'https://8020.best',
      client_reference_id: email.toLowerCase(), // Store the Firebase user's email
      automatic_tax: { enabled: true }
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
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
