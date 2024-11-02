// routes/tasks.js

const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const verifyToken = require('../middleware/verifyToken');

// GET /api/tasks - Fetch tasks for the authenticated user
router.get('/api/tasks', verifyToken, async (req, res) => {
  const userId = req.user.uid;

  try {
    let tasks = await Task.findOne({ userId });

    if (!tasks) {
      // If no tasks exist for the user, create a new document
      tasks = new Task({ userId, list1: [], list2: [], list3: [] });
      await tasks.save();
    }

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /api/tasks - Save tasks for the authenticated user
router.post('/api/tasks', verifyToken, async (req, res) => {
  const userId = req.user.uid;
  const { list1, list2, list3 } = req.body;

  try {
    let tasks = await Task.findOne({ userId });

    if (tasks) {
      // Update existing tasks
      tasks.list1 = list1;
      tasks.list2 = list2;
      tasks.list3 = list3;
      await tasks.save();
    } else {
      // Create new tasks document
      tasks = new Task({ userId, list1, list2, list3 });
      await tasks.save();
    }

    res.json({ message: 'Tasks saved successfully' });
  } catch (error) {
    console.error('Error saving tasks:', error);
    res.status(500).json({ error: 'Failed to save tasks' });
  }
});

module.exports = router;
