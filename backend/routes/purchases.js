// routes/purchases.js

const express = require('express');
const router = express.Router();
const Purchase = require('../models/Purchase');

// Log to verify route is registered
console.log('Registering purchase routes...');

// Manual purchase setter
router.post('/api/purchases/set-purchase', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      console.log('No email provided in request');
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('Setting purchase for email:', email);

    const purchase = await Purchase.findOneAndUpdate(
      { email: { $regex: new RegExp(`^${email}$`, 'i') } },
      {
        email: email.toLowerCase(),
        hasPurchased: true
      },
      {
        upsert: true,
        new: true,
        runValidators: true
      }
    );

    console.log('Purchase record created/updated:', purchase);
    res.json({
      success: true,
      purchase,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error setting purchase:', error);
    res.status(500).json({ error: 'Failed to set purchase', details: error.message });
  }
});

// Check purchase status
router.get('/api/purchases/check-purchase', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('Checking purchase for email:', email);

    // Case-insensitive email search
    const purchase = await Purchase.findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    });

    console.log('Purchase record found:', purchase);

    return res.json({
      hasPurchased: Boolean(purchase?.hasPurchased),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking purchase:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Add this new endpoint
router.post('/api/purchases/reset-purchase', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('Resetting purchase for email:', email);

    const purchase = await Purchase.findOneAndUpdate(
      { email: { $regex: new RegExp(`^${email}$`, 'i') } },
      {
        email: email.toLowerCase(),
        hasPurchased: false,
        purchaseDate: null
      },
      { upsert: true, new: true }
    );

    console.log('Purchase record reset:', purchase);
    res.json({ success: true, purchase });

  } catch (error) {
    console.error('Error resetting purchase:', error);
    res.status(500).json({ error: 'Failed to reset purchase', details: error.message });
  }
});

module.exports = router;
