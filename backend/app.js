const express = require('express');
const cors = require('cors');
const app = express();

// Configure body-parser with increased limits
app.use(express.json({
  limit: '50mb',
  extended: true,
  parameterLimit: 50000
}));

app.use(express.urlencoded({
  limit: '50mb',
  extended: true,
  parameterLimit: 50000
}));

// Configure CORS with increased limits
app.use(cors({
  maxBodyLength: 50 * 1024 * 1024 // 50MB
}));

// ... rest of your app configuration