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

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('No origin');
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) === -1) {
      console.log('Origin not allowed:', origin);
      return callback(new Error('CORS not allowed'));
    }

    console.log('Origin allowed:', origin);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight
app.options('*', cors());

app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import routes
const userDataRouter = require('./routes/userData');
const purchasesRouter = require('./routes/purchases');

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Hower API Server',
    status: 'running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Use routes
app.use(userDataRouter);
app.use(purchasesRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});
