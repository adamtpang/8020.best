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

// Create a buffer parser middleware
const bufferParser = (req, res, next) => {
  if (req.url === '/webhook' && req.method === 'POST') {
    const chunks = [];
    
    req.on('data', chunk => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      req.rawBody = Buffer.concat(chunks);
      next();
    });
  } else {
    next();
  }
};

// Use buffer parser FIRST
app.use(bufferParser);

// Webhook handling
app.post('/webhook', async (request, response) => {
  console.log('Webhook received');
  
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const sig = request.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  console.log('Webhook details:', {
    hasBody: !!request.rawBody,
    bodyLength: request.rawBody?.length,
    hasSignature: !!sig,
    signatureLength: sig?.length
  });

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      request.rawBody,
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
    console.log('Webhook error:', {
      message: err.message,
      bodyPreview: request.rawBody?.toString().slice(0, 50)
    });
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }
});

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
