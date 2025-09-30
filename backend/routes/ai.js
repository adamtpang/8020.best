const express = require('express');
const router = express.Router();
const { streamAnalysis } = require('../services/taskAnalysis');
const User = require('../src/models/User');
const { checkQuota, recordRun, getUsageSummary } = require('../services/usageService');
const { getUserPlan } = require('../services/planService');

/**
 * Analyzes and ranks tasks with usage gating.
 * Works with or without authentication.
 *
 * Quota enforcement:
 * - Anonymous/Free users: 5 runs/day
 * - Light ($5): 300 runs/month soft-limit
 * - Pro ($10): 1000 runs/month soft-limit
 */
router.post('/rank-tasks', async (req, res) => {
    try {
        const { tasks, userPriorities } = req.body;

        if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
            return res.status(400).json({ error: 'No tasks provided or invalid format' });
        }

        // Get user if authenticated
        let user = null;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                user = await User.findById(decoded.userId);
            } catch (err) {
                // Token invalid or expired - treat as anonymous
                console.log('Invalid token, treating as anonymous');
            }
        }

        // Check quota
        const quotaCheck = await checkQuota(user, req);

        if (!quotaCheck.allowed) {
            console.log(`[Telemetry] run_blocked_${quotaCheck.reason} - User: ${user?.email || 'anonymous'}`);

            return res.status(429).json({
                error: 'Quota exceeded',
                reason: quotaCheck.reason,
                quota: quotaCheck.quota || quotaCheck.monthlyLimit,
                used: quotaCheck.dailyRemaining === 0 ? quotaCheck.quota : quotaCheck.monthlyUsed,
                showPaywall: true,
                plan: user ? user.plan : 'free'
            });
        }

        // Log warning if in grace period
        if (quotaCheck.showWarning) {
            console.log(`[Telemetry] run_quota_warning - User: ${user.email}, Plan: ${user.plan}`);
        }

        // All good - proceed with analysis
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

        // Record the run (don't await - fire and forget)
        recordRun(user, req).catch(err => {
            console.error('Error recording run:', err);
        });

    } catch (error) {
        console.error('Error in rank-tasks:', error);
        res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
        res.end();
    }
});

/**
 * Get usage stats for current user/session
 */
router.get('/usage', async (req, res) => {
    try {
        let user = null;
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                user = await User.findById(decoded.userId);
            } catch (err) {
                // Treat as anonymous
            }
        }

        const summary = await getUsageSummary(user, req);
        res.json({ success: true, usage: summary });
    } catch (error) {
        console.error('Error getting usage:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;