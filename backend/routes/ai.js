const express = require('express');
const router = express.Router();
const { analyzeTask, analyzeTasks } = require('../services/taskAnalysis');

// Analyze a single task (simplified, no auth for now)
router.post('/analyze-task', async (req, res) => {
    try {
        const { task } = req.body;

        if (!task) {
            return res.status(400).json({ error: 'No task provided' });
        }

        const result = await analyzeTask(task);

        res.json({
            result: {
                important: result.importance === 1,
                urgent: result.urgency === 1
            }
        });
    } catch (error) {
        console.error('Error analyzing task:', error);
        res.status(500).json({ error: 'Failed to analyze task' });
    }
});

// Analyze multiple tasks (simplified, no auth for now)
router.post('/analyze-tasks', async (req, res) => {
    try {
        const { tasks } = req.body;

        if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
            return res.status(400).json({ error: 'No tasks provided or invalid format' });
        }

        const results = await analyzeTasks(tasks);

        res.json({ results });
    } catch (error) {
        console.error('Error analyzing tasks:', error);
        res.status(500).json({ error: 'Failed to analyze tasks' });
    }
});

/**
 * Simple test endpoint
 */
router.get('/test', (req, res) => {
    res.json({ message: 'AI API is working!' });
});

module.exports = router;
