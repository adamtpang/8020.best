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

// Enable CORS
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
  credentials: true
}));

// Parse JSON requests
app.use(express.json());

// Simple /api/users/me endpoint for testing
app.get('/api/users/me', (req, res) => {
  // Return mock user data for testing
  res.json({
    id: 'mock-user-id',
    name: 'Test User',
    email: 'test@example.com',
    credits: 100,
    role: 'user'
  });
});

// Simple analyzer endpoint - mock version
app.post('/api/ai/analyze-tasks', (req, res) => {
  const { tasks } = req.body;

  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({ error: 'No tasks provided or invalid format' });
  }

  // Mock classifier that tends to put tasks in the Important+Urgent or Not Important+Not Urgent categories
  const results = tasks.map(task => {
    // Important + Urgent keywords
    const importantUrgentKeywords = ['urgent', 'important', 'deadline', 'today', 'asap', 'emergency', 'critical'];

    // Not Important + Not Urgent keywords
    const notImportantNotUrgentKeywords = ['maybe', 'someday', 'would be nice', 'could', 'eventually', 'when possible', 'leisure'];

    const taskLower = task.toLowerCase();

    // Check if this should be important+urgent
    if (importantUrgentKeywords.some(keyword => taskLower.includes(keyword))) {
      return {
        task,
        important: 1,
        urgent: 1,
        explanation: `Identified as important and urgent: ${task}`
      };
    }

    // Check if this should be not important+not urgent
    if (notImportantNotUrgentKeywords.some(keyword => taskLower.includes(keyword))) {
      return {
        task,
        important: 0,
        urgent: 0,
        explanation: `Identified as not important and not urgent: ${task}`
      };
    }

    // Otherwise random but biased toward these two quadrants
    const randomValue = Math.random();
    if (randomValue < 0.4) {
      return {
        task,
        important: 1,
        urgent: 1,
        explanation: `Classified as important and urgent: ${task}`
      };
    } else if (randomValue < 0.8) {
      return {
        task,
        important: 0,
        urgent: 0,
        explanation: `Classified as not important and not urgent: ${task}`
      };
    } else {
      // Only 20% chance for the other two quadrants
      const important = Math.random() > 0.5 ? 1 : 0;
      const urgent = important === 1 ? 0 : 1; // If important, then not urgent, if not important, then urgent
      return {
        task,
        important,
        urgent,
        explanation: `Classified as ${important ? 'important' : 'not important'} and ${urgent ? 'urgent' : 'not urgent'}: ${task}`
      };
    }
  });

  // No simulated delay - respond immediately
  console.log(`Processing ${tasks.length} tasks immediately`);

  res.json({
    results,
    processingTime: 0,
    tokensUsed: tasks.length * 50 // Mock token usage
  });
});

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Catch-all route to serve index.html
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Set port and start server
const PORT = process.env.PORT || 5000;

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
