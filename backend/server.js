// server.js

require('web-streams-polyfill');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const { processText } = require('./textProcessor');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());

// Special middleware for Stripe webhook (must come before express.json())
app.use('/webhook', express.raw({ type: 'application/json' }));

app.use(express.json()); // Parse JSON bodies for other routes

// Connect to MongoDB
console.log('MONGO_URI:', process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI)

// Get the default connection
const db = mongoose.connection;

// Bind connection to error event (to get notification of connection errors)
db.on('error', (error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1); // Exit the application
});

// Once the connection is open, start the server
db.once('open', () => {
  console.log('Connected to MongoDB');

  // Import routers after successful connection
  const tasksRouter = require('./routes/tasks');
  const purchasesRouter = require('./routes/purchases');
  const webhookRouter = require('./routes/webhook');
  const userDataRouter = require('./routes/userData');

  // Routes
  app.get('/', (req, res) => {
    res.send('Hello from MERN Boilerplate API');
  });

  app.use(tasksRouter);
  app.use(purchasesRouter);
  app.use(webhookRouter);
  app.use(userDataRouter);

  // Add proper error handling for undefined routes
  app.use((req, res) => {
    console.error(`404 - Route not found: ${req.originalUrl}`);
    res.status(404).json({ error: 'Route not found' });
  });

  // Add error handling middleware
  app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  // Start the server after the database connection is established
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  app.post('/api/process-text', async (req, res) => {
    try {
      console.log('Backend: Received text processing request');

      if (!process.env.REPLICATE_API_TOKEN) {
        console.error('Backend: REPLICATE_API_TOKEN is not set');
        return res.status(500).json({ error: 'API token not configured' });
      }

      const { text } = req.body;
      if (!text) {
        console.error('Backend: No text provided in request');
        return res.status(400).json({ error: 'No text provided' });
      }

      console.log('Backend: Processing text:', text.substring(0, 100) + '...');
      console.log('Backend: Using Replicate token:', process.env.REPLICATE_API_TOKEN.substring(0, 5) + '...');

      try {
        const result = await processText(text);
        console.log('Backend: Processing complete. Result:', result);
        res.json(result);
      } catch (processingError) {
        console.error('Backend: Error in processText:', {
          message: processingError.message,
          stack: processingError.stack,
          response: processingError.response?.data,
          status: processingError.response?.status,
          fullError: processingError
        });

        return res.status(500).json({
          error: 'Processing error',
          details: processingError.message,
          response: processingError.response?.data
        });
      }
    } catch (error) {
      console.error('Backend Error Details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status,
        fullError: error
      });

      res.status(500).json({
        error: 'An error occurred while processing the text',
        details: error.message,
        response: error.response?.data
      });
    }
  });
});
