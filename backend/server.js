// server.js

require('dotenv').config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
});

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Initialize Express
const app = express();

// Enable CORS with explicit configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'https://8020.best',
    'https://www.8020.best',
    'https://8020best-production.up.railway.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

// Parse JSON requests
app.use(express.json());

// Import and use enhanced AI routes
const aiRoutes = require('./routes/ai');
app.use('/api/ai', aiRoutes);

// Import and use user routes
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

// Import and use Stripe routes
const stripeRoutes = require('./routes/stripe');
app.use('/api/stripe', stripeRoutes);

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// In production, serve static files from the React app build directory
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  // In production, for any other request, serve the React app's index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// Set port and start server
const PORT = process.env.PORT || 5001;

// Connect to MongoDB if configured, otherwise start without it
const startServer = () => {
  app.listen(PORT, '0.0.0.0', (err) => {
    if (err) {
      console.error('Server startup error:', err);
      process.exit(1);
    }
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

// Try to connect to MongoDB if MONGO_URI is provided
if (process.env.MONGO_URI) {
  console.log('Attempting to connect to MongoDB...');
  mongoose.connect(process.env.MONGO_URI)
    .then(() => {
      console.log('Connected to MongoDB');
      startServer();
    })
    .catch(err => {
      console.error('MongoDB connection error:', err.message);
      console.log('Starting server without MongoDB...');
      startServer();
    });
} else {
  console.log('No MongoDB URI provided. Starting server without database...');
  startServer();
}
