// routes/purchases.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Check purchase status
router.get('/api/check-purchase', async (req, res) => {
    const userEmail = req.query.email;

    if (!userEmail) {
      console.log('Email is missing in request');
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log(`Received request to check purchase status for email: ${userEmail}`);

    try {
      const user = await User.findOne({ email: userEmail });
      if (!user) {
        console.log(`No user found with email: ${userEmail}`);
        res.json({ hasPurchased: false });
      } else {
        console.log(`User found: ${JSON.stringify(user)}`);
        res.json({ hasPurchased: user.hasPurchased });
      }
    } catch (error) {
      console.error('Error checking purchase status:', error);
      res.status(500).json({ error: 'Failed to check purchase status' });
    }
  });

// Manually add a purchase
router.post('/api/manual-add-purchase', async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    try {
      const user = await User.findOneAndUpdate(
        { email: email },
        { $set: { hasPurchased: true } },
        { upsert: true, new: true }
      );
      console.log(`User ${email} updated with hasPurchased: true`);
      res.json({ message: `User ${email} updated successfully`, user });
    } catch (error) {
      console.error('Error updating user purchase status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

module.exports = router;
