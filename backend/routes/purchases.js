// routes/purchases.js

const express = require('express');
const router = express.Router();
const Purchase = require('../models/Purchase');

const CHUNK_SIZE = 50; // Define CHUNK_SIZE constant

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

    // Ensure we're sending clean arrays
    const lists = {
      list1: purchase?.list1?.filter(Boolean) || [],
      list2: purchase?.list2?.filter(Boolean) || [],
      list3: purchase?.list3?.filter(Boolean) || [],
      trashedItems: purchase?.trashedItems?.filter(Boolean) || []
    };

    // Log what we're sending back
    console.log('Sending lists:', {
      list1Length: lists.list1.length,
      list2Length: lists.list2.length,
      list3Length: lists.list3.length,
      trashedItemsLength: lists.trashedItems.length
    });

    res.json({
      success: true,
      lists
    });
  } catch (error) {
    console.error('Error loading lists:', error);
    res.status(500).json({ error: 'Failed to load lists' });
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

    // Use findOneAndUpdate instead of find and save
    const result = await Purchase.findOneAndUpdate(
      { email },
      {
        $set: {
          [`${listName}`]: chunk.items
        }
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

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

// Add a clear trash endpoint
router.post('/api/purchases/clear-trash', async (req, res) => {
  try {
    const { email } = req.body;

    const purchase = await Purchase.findOne({ email });
    if (purchase) {
      purchase.trashedItems = [];
      await purchase.save();
    }

    res.json({
      success: true,
      message: 'Trash cleared'
    });
  } catch (error) {
    console.error('Error clearing trash:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update the clear-list endpoint
router.post('/api/purchases/clear-list', async (req, res) => {
  try {
    const { email, listNumber } = req.body;
    console.log(`Clearing list ${listNumber} for ${email}`);

    const purchase = await Purchase.findOneAndUpdate(
      { email },
      {
        $set: {
          [listNumber === 1 ? 'list1' :
           listNumber === 2 ? 'list2' :
           listNumber === 3 ? 'list3' :
           'trashedItems']: []
        }
      },
      { new: true }
    );

    if (!purchase) {
      console.log('No purchase found to clear');
      return res.status(404).json({ error: 'Purchase not found' });
    }

    console.log(`List ${listNumber} cleared successfully`);
    console.log('Updated purchase:', {
      list1Length: purchase.list1.length,
      list2Length: purchase.list2.length,
      list3Length: purchase.list3.length,
      trashedItemsLength: purchase.trashedItems.length
    });

    res.json({
      success: true,
      message: `List ${listNumber} cleared`,
      listLengths: {
        list1: purchase.list1.length,
        list2: purchase.list2.length,
        list3: purchase.list3.length,
        trashedItems: purchase.trashedItems.length
      }
    });

  } catch (error) {
    console.error('Error clearing list:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
