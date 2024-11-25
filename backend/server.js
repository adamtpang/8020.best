// server.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

// Graceful shutdown handling
const gracefulShutdown = async () => {
  console.log('Received shutdown signal. Closing connections...');

  try {
    // Close MongoDB connection using await
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    // If there's an error, force exit after a brief delay
    setTimeout(() => {
      console.error('Forcefully shutting down');
      process.exit(1);
    }, 1000);
  }

  // Keep the timeout as a safety net
  setTimeout(() => {
    console.error('Could not close MongoDB connection in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  gracefulShutdown().catch(err => {
    console.error('Error during graceful shutdown:', err);
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  gracefulShutdown().catch(err => {
    console.error('Error during graceful shutdown:', err);
    process.exit(1);
  });
});

// Handle process signals
process.on('SIGTERM', () => gracefulShutdown());
process.on('SIGINT', () => gracefulShutdown());

const app = express();

// Environment setup
const environment = process.env.NODE_ENV || 'development';
console.log('Environment:', environment);

// Import webhook router FIRST
const webhookRouter = require('./routes/webhook');

// Use webhook router BEFORE other middleware
app.use('/webhook', webhookRouter);

// CORS and other middleware AFTER webhook
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://hower.app',
      'https://www.hower.app',
      'https://go.hower.app',
      'https://hower-app.vercel.app'
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Increase payload size limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Start server only after MongoDB connection is established
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} in ${environment} mode`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Routes setup
const purchasesRouter = require('./routes/purchases');
app.use('/', purchasesRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});
