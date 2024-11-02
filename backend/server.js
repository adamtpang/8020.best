// server.js

require('web-streams-polyfill');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

const app = express();

// Simple CORS setup
app.use(cors({
  origin: 'http://127.0.0.1:5173'
}));

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
    timestamp: new Date().toISOString()
  });
});

// Use routes
app.use(userDataRouter);
app.use(purchasesRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
