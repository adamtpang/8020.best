const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());


mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));


// Routes
app.get('/', (req, res) => {
  res.send('Hello from MERN Boilerplate API');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});