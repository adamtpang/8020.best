const express = require('express');
const app = express();

// Increase all size limits
app.use(express.json({
  limit: '50mb',  // Increased substantially
  extended: true
}));

app.use(express.urlencoded({
  limit: '50mb',
  extended: true,
  parameterLimit: 50000
}));

// Add raw body parser with increased limit
app.use(express.raw({
  limit: '50mb'
}));

// Disable size limit in body-parser if you're using it
app.use(require('body-parser').json({
  limit: '50mb'
}));

// ... rest of your app configuration