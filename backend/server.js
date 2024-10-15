const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 5000; // Use a different port

// Middleware
app.use(cors());
app.use(express.json()); // This middleware parses JSON request bodies

// Special middleware for Stripe webhook (this should come after express.json())
app.use('/webhook', express.raw({ type: 'application/json' }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// User model
const User = mongoose.model('User', new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  hasPurchased: { type: Boolean, default: false },
}));

// Add this function after the User model definition
async function checkUserPurchaseStatus(email) {
  try {
    const user = await User.findOne({ email });
    return user ? user.hasPurchased : false;
  } catch (error) {
    console.error('Error checking user purchase status:', error);
    throw error;
  }
}

// Routes
app.get('/', (req, res) => {
  res.send('Hello from MERN Boilerplate API');
});

app.post('/webhook', async (request, response) => {
  const sig = request.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  response.status(200).send('Received'); // Respond quickly

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const customerEmail = session.customer_details.email;

    if (customerEmail) {
      try {
        await User.findOneAndUpdate(
          { email: customerEmail },
          { email: customerEmail, hasPurchased: true },
          { upsert: true, new: true }
        );
        console.log(`Purchase recorded for ${customerEmail}`);
      } catch (error) {
        console.error(`Error updating user purchase status: ${error.message}`);
      }
    } else {
      console.error('No email address found in session data');
    }
  }
});

app.get('/api/check-purchase', async (req, res) => {
  const userEmail = req.query.email;

  if (!userEmail) {
    console.log('Email is missing in request');
    return res.status(400).json({ error: 'Email is required' });
  }

  console.log(`Received request to check purchase status for email: ${userEmail}`);

  try {
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      console.log(`No user found with email: ${userEmail}`);
      res.json({ hasPurchased: false });
    } else {
      console.log(`User found: ${JSON.stringify(user)}`);
      res.json({ hasPurchased: user.hasPurchased });
    }
  } catch (error) {
    console.error('Error checking purchase status:', error);
    res.status(500).json({ error: 'Failed to check purchase status' });
  }
});



app.post('/api/manual-add-purchase', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const user = await User.findOneAndUpdate(
      { email: email },
      { $set: { hasPurchased: true } },
      { upsert: true, new: true }
    );
    console.log(`User ${email} updated with hasPurchased: true`);
    res.json({ message: `User ${email} updated successfully`, user });
  } catch (error) {
    console.error('Error updating user purchase status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
