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
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY?.trim());

// Debug middleware to log request details
const logRequest = (req, res, next) => {
  if (req.path === '/webhook') {
    console.log('\nWebhook request received:', {
      path: req.path,
      method: req.method,
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
      stripeSignature: req.headers['stripe-signature']?.substring(0, 20) + '...',
    });
  }
  next();
};

// Raw body handler for webhooks
const webhookBodyParser = (req, res, next) => {
  if (req.path === '/webhook' && req.method === 'POST') {
    let data = '';

    req.on('data', chunk => {
      data += chunk;
    });

    req.on('end', () => {
      req.rawBody = data;
      console.log('Raw body captured:', {
        length: data.length,
        preview: data.substring(0, 50) + '...'
      });
      next();
    });
  } else {
    next();
  }
};

// Use middleware in correct order
app.use(logRequest);
app.use(webhookBodyParser);

// Webhook endpoint
app.post('/webhook', async (req, res) => {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const signature = req.headers['stripe-signature'];

  console.log('Processing webhook:', {
    hasSignature: !!signature,
    signatureLength: signature?.length,
    hasSecret: !!endpointSecret,
    secretLength: endpointSecret?.length,
    bodyLength: req.rawBody?.length
  });

  try {
    // Verify webhook
    const event = stripe.webhooks.constructEvent(
      req.rawBody,
      signature,
      endpointSecret
    );

    console.log('Webhook verified:', event.type);

    // Handle checkout completion
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

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
          success: true,
          purchaseId: result._id
        });

      } catch (dbError) {
        console.error('Database error:', dbError);
        return res.status(500).send('Database error');
      }
    }

    res.json({ received: true });

  } catch (err) {
    console.error('Webhook verification failed:', {
      error: err.message,
      type: err.type,
      bodyPreview: req.rawBody?.substring(0, 50) + '...',
      signaturePreview: signature?.substring(0, 20) + '...',
      secretPreview: endpointSecret?.substring(0, 5) + '...'
    });

    res.status(400).send(`Webhook Error: ${err.message}`);
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
