const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireAuth, requireAdmin } = require('../middleware/auth');

/**
 * @route GET /api/admin/users
 * @desc Get all users with their API usage stats
 * @access Admin only
 */
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
    try {
        const users = await User.find({}, {
            name: 1,
            email: 1,
            role: 1,
            credits: 1,
            apiUsage: 1,
            apiLimits: 1,
            createdAt: 1,
            lastLogin: 1
        }).sort({ createdAt: -1 });

        res.json({ users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

/**
 * @route GET /api/admin/stats
 * @desc Get overall system stats
 * @access Admin only
 */
router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
    try {
        // Get total users count
        const totalUsers = await User.countDocuments();

        // Get active users (used the API in the last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const activeUsers = await User.countDocuments({
            'apiUsage.replicate.lastUsed': { $gte: thirtyDaysAgo }
        });

        // Get total API calls and tokens
        const apiStats = await User.aggregate([
            {
                $group: {
                    _id: null,
                    totalCalls: { $sum: '$apiUsage.replicate.totalCalls' },
                    totalTokens: { $sum: '$apiUsage.replicate.totalTokens' },
                    totalLines: { $sum: '$apiUsage.replicate.totalLines' }
                }
            }
        ]);

        // Get users with most API usage
        const topUsers = await User.find({}, {
            name: 1,
            email: 1,
            apiUsage: 1
        })
            .sort({ 'apiUsage.replicate.totalCalls': -1 })
            .limit(5);

        res.json({
            totalUsers,
            activeUsers,
            apiStats: apiStats[0] || { totalCalls: 0, totalTokens: 0, totalLines: 0 },
            topUsers
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ error: 'Failed to fetch admin statistics' });
    }
});

/**
 * @route PUT /api/admin/user/:userId
 * @desc Update user settings (credits, limits, role)
 * @access Admin only
 */
router.put('/user/:userId', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { credits, maxDailyLines, maxMonthlyTokens, role, isRestricted } = req.body;

        const updateData = {};

        // Only update fields that are provided
        if (credits !== undefined) updateData.credits = credits;
        if (role !== undefined) updateData.role = role;

        // Update API limits if provided
        if (maxDailyLines !== undefined || maxMonthlyTokens !== undefined || isRestricted !== undefined) {
            updateData.apiLimits = {};

            if (maxDailyLines !== undefined) updateData['apiLimits.maxDailyLines'] = maxDailyLines;
            if (maxMonthlyTokens !== undefined) updateData['apiLimits.maxMonthlyTokens'] = maxMonthlyTokens;
            if (isRestricted !== undefined) updateData['apiLimits.isRestricted'] = isRestricted;
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            message: 'User updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                credits: user.credits,
                apiLimits: user.apiLimits
            }
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

/**
 * @route POST /api/admin/grant-credits
 * @desc Grant credits to a user
 * @access Admin only for existing users, no auth required for new users
 */
router.post('/grant-credits', async (req, res) => {
    try {
        const { userId, email, amount } = req.body;

        // Check if this is an admin request or a new user request
        const isAdmin = req.user && req.user.role === 'admin';
        let user;

        if (userId) {
            // Find user by ID
            user = await User.findById(userId);
        } else if (email) {
            // Find user by email
            user = await User.findOne({ email });
        } else {
            return res.status(400).json({ error: 'Either userId or email is required' });
        }

        // Check if user exists
        const isNewUser = !user || user.credits === 0;

        // Only allow non-admin requests for new users
        if (!isAdmin && !isNewUser) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // For new users without admin request, limit to 1000 credits
        const creditsToGrant = isAdmin ? amount : Math.min(amount, 1000);

        if (!user) {
            // Create new user if they don't exist
            user = new User({
                email,
                credits: creditsToGrant
            });
        } else {
            // Update existing user
            user.credits = (user.credits || 0) + creditsToGrant;
        }

        await user.save();

        console.log(`Granted ${creditsToGrant} credits to user ${user._id}, new balance: ${user.credits}`);

        res.json({
            message: 'Credits granted successfully',
            userId: user._id,
            newBalance: user.credits,
            granted: creditsToGrant
        });
    } catch (error) {
        console.error('Error granting credits:', error);
        res.status(500).json({ error: 'Failed to grant credits' });
    }
});

module.exports = router;