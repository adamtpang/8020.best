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
    const purchase = await Purchase.findOne({ email });
    return res.json({ hasPurchased: Boolean(purchase?.hasPurchased) });
  } catch (error) {
    console.error('Error checking purchase:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Load lists
router.get('/api/purchases/load-lists', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('Loading lists for:', email);
    const purchase = await Purchase.findOne({ email });

    res.json({
      success: true,
      lists: purchase?.lists || { list1: [], list2: [], list3: [] }
    });
  } catch (error) {
    console.error('Error loading lists:', error);
    res.status(500).json({ error: 'Failed to load lists' });
  }
});

// Save lists
router.post('/api/purchases/save-lists', async (req, res) => {
  try {
    const { email, lists } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('Saving lists for:', email);
    const purchase = await Purchase.findOneAndUpdate(
      { email },
      {
        $set: { lists }
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, purchase });
  } catch (error) {
    console.error('Error saving lists:', error);
    res.status(500).json({ error: 'Failed to save lists' });
  }
});

// Get user data
router.get('/api/get-user-data/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log('Getting user data for:', userId);
    const purchase = await Purchase.findOne({ userId });

    res.json({
      success: true,
      userData: purchase || { lists: { list1: [], list2: [], list3: [] } }
    });
  } catch (error) {
    console.error('Error getting user data:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

// Add save user data route
router.post('/api/save-user-data', async (req, res) => {
  try {
    const { userId, data } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log('Saving user data for:', userId);
    console.log('Data:', data);

    const purchase = await Purchase.findOneAndUpdate(
      { userId },
      {
        $set: {
          userId,
          ...data
        }
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      purchase
    });
  } catch (error) {
    console.error('Error saving user data:', error);
    res.status(500).json({ error: 'Failed to save user data' });
  }
});

module.exports = router;
