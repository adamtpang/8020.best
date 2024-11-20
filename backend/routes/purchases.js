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

    console.log('Found purchase:', purchase);

    // Ensure list4 exists
    if (!purchase.list4) {
      purchase.list4 = [];
      await purchase.save();
    }

    const lists = {
      list1: purchase?.list1 || [],
      list2: purchase?.list2 || [],
      list3: purchase?.list3 || [],
      list4: purchase?.list4 || []
    };

    console.log('Sending lists with trash:', lists);

    res.json({
      success: true,
      lists
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
    console.log('Lists to save:', {
      list1Length: lists.list1?.length,
      list2Length: lists.list2?.length,
      list3Length: lists.list3?.length,
      list4Length: lists.list4?.length
    });

    const result = await Purchase.findOneAndUpdate(
      { email },
      {
        $set: {
          list1: lists.list1 || [],
          list2: lists.list2 || [],
          list3: lists.list3 || [],
          list4: lists.list4 || []
        }
      },
      { upsert: true, new: true }
    );

    console.log('Save result:', {
      list1Length: result.list1?.length,
      list2Length: result.list2?.length,
      list3Length: result.list3?.length,
      list4Length: result.list4?.length
    });

    res.json({ success: true, purchase: result });
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

// Handle chunk syncs
router.post('/api/purchases/sync-chunk', async (req, res) => {
  try {
    const { email, listName, chunk } = req.body;

    console.log(`Processing ${listName} chunk ${chunk.index + 1}/${chunk.total} for ${email}`);

    const purchase = await Purchase.findOne({ email });
    if (!purchase) {
      purchase = new Purchase({ email });
    }

    // Calculate the start index for this chunk
    const startIndex = chunk.index * CHUNK_SIZE;

    // Update the specific portion of the list
    if (!purchase[listName]) {
      purchase[listName] = [];
    }

    // Extend array if needed
    while (purchase[listName].length < startIndex + chunk.items.length) {
      purchase[listName].push(null);
    }

    // Insert chunk items at the correct position
    for (let i = 0; i < chunk.items.length; i++) {
      purchase[listName][startIndex + i] = chunk.items[i];
    }

    await purchase.save();

    res.json({
      success: true,
      chunkProcessed: chunk.index + 1,
      totalChunks: chunk.total
    });

  } catch (error) {
    console.error('Error processing chunk:', error);
    res.status(500).json({ error: error.message });
  }
});

// Handle sync completion
router.post('/api/purchases/sync-complete', async (req, res) => {
  try {
    const { email, metadata } = req.body;

    const purchase = await Purchase.findOne({ email });
    if (purchase) {
      purchase.lastSyncedAt = metadata.lastSyncedAt;
      await purchase.save();
    }

    res.json({
      success: true,
      message: 'Sync completed successfully',
      timestamp: metadata.lastSyncedAt
    });

  } catch (error) {
    console.error('Error completing sync:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
