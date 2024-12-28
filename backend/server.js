// server.js

// Load environment variables first
const path = require('path');
const fs = require('fs');

// Always use production env file in Railway/Vercel
const envPath = path.resolve(__dirname, '.env.production');

// Debug environment setup
console.log('Environment setup:');
console.log('- Working directory:', process.cwd());
console.log('- Environment file path:', envPath);
console.log('- File exists:', fs.existsSync(envPath));

try {
  require('dotenv').config({ path: envPath });

  // Validate required environment variables
  const requiredEnvVars = ['STRIPE_SECRET_KEY', 'MONGO_URI'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  console.log('Environment variables loaded successfully');
  console.log('- STRIPE_KEY_EXISTS:', !!process.env.STRIPE_SECRET_KEY);
  console.log('- MONGO_URI_EXISTS:', !!process.env.MONGO_URI);
} catch (error) {
  console.error('Failed to load environment variables:', error.message);
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// CORS configuration - MUST BE FIRST
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://8020.best');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Import and use routes
const purchasesRouter = require('./routes/purchases');
const webhookRouter = require('./routes/webhook');

// Routes
app.use('/webhook', webhookRouter);  // Webhook route first
app.use('/', purchasesRouter);       // Then other routes

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// MongoDB connection
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  try {
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
