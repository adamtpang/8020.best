// routes/purchases.js

const express = require('express');
const router = express.Router();
const Purchase = require('../models/Purchase');

// Log to verify route is registered
console.log('Registering purchase routes...');

// Add test route
router.get('/api/purchases/test', (req, res) => {
  res.json({ message: 'Purchase routes working' });
});

// Manual purchase setter
router.post('/api/purchases/set-purchase', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('Setting purchase for email:', email);

    const purchase = await Purchase.findOneAndUpdate(
      { email },
      { email, hasPurchased: true },
      { upsert: true, new: true }
    );

    console.log('Purchase record created/updated:', purchase);
    res.json({ success: true, purchase });

  } catch (error) {
    console.error('Error setting purchase:', error);
    res.status(500).json({ error: 'Failed to set purchase', details: error.message });
  }
});

// Add check-purchase route
router.get('/api/purchases/check-purchase', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('Checking purchase for email:', email);

    const purchase = await Purchase.findOne({ email });
    console.log('Purchase record found:', purchase);

    return res.json({
      hasPurchased: Boolean(purchase),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking purchase:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
