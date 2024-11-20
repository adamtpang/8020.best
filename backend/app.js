const express = require('express');
const app = express();

// Increase JSON payload limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ... rest of your app configuration