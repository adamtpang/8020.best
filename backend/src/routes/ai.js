const express = require('express');
const router = express.Router();
const { analyzeTask, analyzeTasks } = require('../services/taskAnalysis');
const { verifyToken } = require('../middleware/auth');
const trackApiUsage = require('../middleware/usageTracker');
const User = require('../models/User');

// Analyze a single task with authentication, usage tracking and limits
router.post('/analyze-task', verifyToken, trackApiUsage, async (req, res) => {
    try {
        const { task } = req.body;

        if (!task) {
            return res.status(400).json({ error: 'No task provided' });
        }

        const result = await analyzeTask(task);

        // Update token count if available and the user exists
        if (result.tokensUsed && req.user && req.user.id) {
            try {
                await User.findByIdAndUpdate(req.user.id, {
                    $inc: { 'apiUsage.replicate.totalTokens': result.tokensUsed }
                });
            } catch (err) {
                console.error('Error updating token count:', err);
                // Continue anyway, token count is not critical
            }
        }

        // Fetch current credit balance
        const user = await User.findById(req.user.id);

        res.json({
            result: {
                important: result.importance === 1,
                urgent: result.urgency === 1
            },
            credits: {
                used: 1,  // Single task = 1 credit
                remaining: user.credits
            }
        });
    } catch (error) {
        console.error('Error analyzing task:', error);
        res.status(500).json({ error: 'Failed to analyze task' });
    }
});

// Analyze multiple tasks with authentication and usage limits
router.post('/analyze-tasks', verifyToken, trackApiUsage, async (req, res) => {
    try {
        const { tasks } = req.body;

        if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
            return res.status(400).json({ error: 'No tasks provided or invalid format' });
        }

        const results = await analyzeTasks(tasks);

        // Update token count if available in results
        if (results.tokensUsed && req.user && req.user.id) {
            try {
                await User.findByIdAndUpdate(req.user.id, {
                    $inc: { 'apiUsage.replicate.totalTokens': results.tokensUsed }
                });
            } catch (err) {
                console.error('Error updating token count:', err);
                // Continue anyway, token count is not critical
            }
        }

        // Fetch current credit balance
        const user = await User.findById(req.user.id);

        res.json({
            results: results.results,
            credits: {
                used: tasks.length,  // Each task uses 1 credit
                remaining: user.credits
            }
        });
    } catch (error) {
        console.error('Error analyzing tasks:', error);
        res.status(500).json({ error: 'Failed to analyze tasks' });
    }
});

module.exports = router;