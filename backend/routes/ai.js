const express = require('express');
const router = express.Router();
const { streamAnalysis } = require('../services/taskAnalysis');
const { hasEnoughCredits, deductCredits } = require('../services/creditService');
const User = require('../src/models/User');
const { requireAuth } = require('../middleware/auth');

/**
 * Analyzes and ranks tasks, streaming the results back to the client.
 * Requires authentication and deducts credits.
 */
router.post('/rank-tasks', requireAuth, async (req, res) => {
    try {
        const { tasks, userPriorities } = req.body;

        if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
            return res.status(400).json({ error: 'No tasks provided or invalid format' });
        }

        // Find user and check credits
        const userId = req.user.userId || req.user.id;
        let user = await User.findOne({ uid: userId });
        
        // In development mode, if we can't find by UID, try by email or create user
        if (!user && process.env.NODE_ENV === 'development') {
            user = await User.findOne({ email: req.user.email });
            
            // If still no user found, create one for development
            if (!user) {
                user = new User({
                    uid: userId || 'dev-user-id',
                    email: req.user.email || 'adamtpangelinan@gmail.com',
                    displayName: req.user.displayName || 'Development User',
                    credits: 999999
                });
                await user.save();
                console.log('Created development user for AI analysis:', user.uid);
            }
        }
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Admin bypass: Check if user is adampangelinan (skip credit checks) or in development mode
        const isAdmin = user.email === 'adamtpangelinan@gmail.com';
        const isDevelopment = process.env.NODE_ENV === 'development';
        
        if (!isAdmin && !isDevelopment) {
            // Calculate credit cost (1 credit per task, minimum 1)
            const creditCost = Math.max(1, tasks.length);
            
            // Check if user has enough credits
            if (!(await hasEnoughCredits(user._id, creditCost))) {
                return res.status(402).json({ 
                    error: 'Insufficient credits', 
                    required: creditCost,
                    available: user.credits 
                });
            }

            // Deduct credits before processing
            await deductCredits(user._id, creditCost);
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        const stream = await streamAnalysis(tasks, userPriorities);

        for await (const event of stream) {
            if (event.event === 'output') {
                res.write(`data: ${JSON.stringify({ type: 'chunk', content: event.data })}\n\n`);
            }
        }

        res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
        res.end();

    } catch (error) {
        console.error('Error in rank-tasks:', error);
        res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
        res.end();
    }
});

module.exports = router;