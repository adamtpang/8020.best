const express = require('express');
const router = express.Router();
const { streamAnalysis } = require('../services/taskAnalysis');
const { hasEnoughCredits, deductCredits } = require('../services/creditService');
const User = require('../src/models/User');
const { requireAuth } = require('../middleware/auth');


/**
 * Analyzes and ranks tasks, streaming the results back to the client.
 * Works with or without authentication.
 */
router.post('/rank-tasks', async (req, res) => {
    try {
        const { tasks, userPriorities } = req.body;

        if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
            return res.status(400).json({ error: 'No tasks provided or invalid format' });
        }

        // Skip authentication and credit checks for now
        // TODO: Re-implement when authentication is added back

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