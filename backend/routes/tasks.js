const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const auth = require('../middleware/auth');

// Get user's tasks
router.get('/', auth, async (req, res) => {
    try {
        const tasks = await Task.findOne({ userId: req.user._id });
        res.json(tasks || { tasks: [] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Save user's tasks
router.post('/', auth, async (req, res) => {
    try {
        const { tasks } = req.body;

        let userTasks = await Task.findOne({ userId: req.user._id });

        if (userTasks) {
            // Update existing tasks
            userTasks.tasks = tasks;
            await userTasks.save();
        } else {
            // Create new tasks document
            userTasks = new Task({
                userId: req.user._id,
                tasks
            });
            await userTasks.save();
        }

        res.json(userTasks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;