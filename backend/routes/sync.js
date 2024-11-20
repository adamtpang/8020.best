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

module.exports = router;