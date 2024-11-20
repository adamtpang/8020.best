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

router.post('/sync-changes', async (req, res) => {
  try {
    const { email, changes, lastSyncTimestamp } = req.body;

    // Get the current document
    let purchase = await Purchase.findOne({ email });

    if (!purchase) {
      purchase = new Purchase({ email });
    }

    // Apply changes to each list
    Object.entries(changes).forEach(([listName, { added, removed }]) => {
      if (listName === 'timestamp') return;

      // Remove items that should be removed
      if (removed?.length > 0) {
        if (listName === 'list1') {
          purchase.list1 = purchase.list1.filter(item =>
            !removed.includes(item)
          );
        } else if (listName === 'list2' || listName === 'list3') {
          purchase[listName] = purchase[listName].filter(item =>
            !removed.some(r => r.idea === item.idea)
          );
        } else if (listName === 'trashedItems') {
          purchase.trashedItems = purchase.trashedItems.filter(item =>
            !removed.includes(item)
          );
        }
      }

      // Add new items
      if (added?.length > 0) {
        purchase[listName] = [...purchase[listName], ...added];
      }
    });

    // Update last sync timestamp
    purchase.lastSyncedAt = changes.timestamp;

    // Save changes
    await purchase.save();

    res.json({
      success: true,
      lastSyncedAt: changes.timestamp
    });
  } catch (error) {
    console.error('Sync changes error:', error);
    res.status(500).json({
      error: error.message,
      details: error.errors
    });
  }
});

module.exports = router;