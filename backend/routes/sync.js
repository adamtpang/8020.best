const express = require('express');
const router = express.Router();

// Increase the JSON payload size limit
router.use(express.json({ limit: '10mb' })); // Increase from default to handle larger lists

router.post('/', async (req, res) => {
  try {
    const { email, list1, list2, list3, trashedItems } = req.body;

    // Log the sizes for debugging
    console.log('Sync request sizes:', {
      list1: list1?.length || 0,
      list2: list2?.length || 0,
      list3: list3?.length || 0,
      trashedItems: trashedItems?.length || 0
    });

    const result = await Purchase.findOneAndUpdate(
      { email },
      {
        $set: {
          list1,
          list2,
          list3,
          trashedItems,
          lastSyncedAt: new Date()
        }
      },
      {
        upsert: true,
        new: true,
        // Remove or increase any runValidators limits
        runValidators: true
      }
    );

    res.json(result);
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      error: error.message,
      details: error.errors // Include validation error details
    });
  }
});

router.post('/sync-changes', express.json({ limit: '1mb' }), async (req, res) => {
  try {
    const { email, changes } = req.body;
    console.log('Processing chunk for:', email);

    let purchase = await Purchase.findOne({ email });
    if (!purchase) {
      purchase = new Purchase({ email });
    }

    // Apply changes
    if (changes.list1?.added?.length > 0) {
      purchase.list1 = [...purchase.list1, ...changes.list1.added];
    }
    if (changes.list2?.added?.length > 0) {
      purchase.list2 = [...purchase.list2, ...changes.list2.added];
    }
    if (changes.list3?.added?.length > 0) {
      purchase.list3 = [...purchase.list3, ...changes.list3.added];
    }
    if (changes.trashedItems?.added?.length > 0) {
      purchase.trashedItems = [...purchase.trashedItems, ...changes.trashedItems.added];
    }

    purchase.lastSyncedAt = changes.timestamp;
    await purchase.save();

    res.json({
      success: true,
      listSizes: {
        list1: purchase.list1.length,
        list2: purchase.list2.length,
        list3: purchase.list3.length,
        trashedItems: purchase.trashedItems.length
      }
    });

  } catch (error) {
    console.error('Chunk sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;