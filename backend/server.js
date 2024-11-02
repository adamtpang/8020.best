// server.js

require('web-streams-polyfill');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

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
  origin: function(origin, callback) {
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

// Add success URL handler
app.get('/product', async (req, res) => {
  const { success, email } = req.query;

  if (success && email) {
    try {
      // Create purchase record
      await Purchase.findOneAndUpdate(
        { email },
        { email, hasPurchased: true },
        { upsert: true, new: true }
      );

      console.log('Purchase recorded for:', email);
    } catch (error) {
      console.error('Error recording purchase:', error);
    }
  }

  res.redirect('/product');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});
