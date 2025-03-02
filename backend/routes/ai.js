const express = require('express');
const router = express.Router();
const { analyzeTasks } = require('../services/taskAnalysis');
const auth = require('../middleware/auth');
const { hasEnoughCredits, deductCredits } = require('../services/creditService');

// Analyze tasks with authentication and credit check
router.post('/analyze-tasks', auth, async (req, res) => {
    try {
        const { tasks } = req.body;
        if (!Array.isArray(tasks) || tasks.length === 0) {
            return res.status(400).json({ error: 'Invalid tasks array' });
        }

        // Calculate credits needed based on number of tasks
        const creditsNeeded = tasks.length; // 1 credit per task

        // Check if user has enough credits
        const hasCredits = await hasEnoughCredits(req.user.id, creditsNeeded);
        if (!hasCredits) {
            return res.status(403).json({
                error: 'Insufficient credits',
                creditsNeeded
            });
        }

        // Analyze tasks
        const results = await analyzeTasks(tasks);

        // Deduct credits after successful analysis
        const remainingCredits = await deductCredits(req.user.id, creditsNeeded);

        // Return results and credit information
        res.json({
            results,
            credits: {
                used: creditsNeeded,
                remaining: remainingCredits
            }
        });
    } catch (error) {
        console.error('Error analyzing tasks:', error);
        res.status(500).json({ error: 'Failed to analyze tasks' });
    }
});

module.exports = router;
