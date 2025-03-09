const User = require('../models/User');

/**
 * Middleware to track API usage, enforce limits, and handle credits
 * This will track API calls, count lines in requests, check user limits, and deduct credits
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const trackApiUsage = async (req, res, next) => {
    try {
        // Skip if no authenticated user
        if (!req.user || !req.user.id) {
            return next();
        }

        // Get user from database to check current usage, limits, and credits
        const user = await User.findById(req.user.id);
        if (!user) {
            return next();
        }

        // Initialize API usage tracking objects if they don't exist
        if (!user.apiUsage) {
            user.apiUsage = {};
        }

        if (!user.apiUsage.replicate) {
            user.apiUsage.replicate = {
                totalCalls: 0,
                totalTokens: 0,
                totalLines: 0,
                lastUsed: null
            };
        }

        if (!user.apiLimits) {
            user.apiLimits = {
                isRestricted: false,
                maxDailyLines: 1000,
                maxMonthlyTokens: 100000
            };
        }

        // Check if user is restricted from API access
        if (user.apiLimits.isRestricted) {
            return res.status(403).json({
                error: 'API access restricted',
                message: 'Your account has been restricted from using the API. Please contact support.'
            });
        }

        // Count lines in the request (for task analysis)
        let lineCount = 0;

        if (req.body.task) {
            // Single task case
            lineCount = 1;
        } else if (req.body.tasks && Array.isArray(req.body.tasks)) {
            // Multiple tasks case
            lineCount = req.body.tasks.length;
        }

        // Check if user has enough credits
        if (user.credits < lineCount) {
            return res.status(402).json({
                error: 'Insufficient credits',
                message: `You need ${lineCount} credits for this operation, but you only have ${user.credits} credits remaining. Please purchase more credits.`,
                creditsNeeded: lineCount,
                creditsAvailable: user.credits
            });
        }

        // Check daily line limits
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dailyUsage = await User.aggregate([
            { $match: { _id: user._id } },
            { $unwind: { path: '$apiUsageLogs', preserveNullAndEmptyArrays: true } },
            {
                $match: {
                    'apiUsageLogs.timestamp': { $gte: today }
                }
            },
            {
                $group: {
                    _id: null,
                    totalDailyLines: { $sum: '$apiUsageLogs.lines' }
                }
            }
        ]);

        const currentDailyLines = (dailyUsage[0]?.totalDailyLines || 0);

        if (currentDailyLines + lineCount > user.apiLimits.maxDailyLines) {
            return res.status(429).json({
                error: 'Daily limit exceeded',
                message: `You've reached your daily limit of ${user.apiLimits.maxDailyLines} lines.`,
                limit: user.apiLimits.maxDailyLines,
                used: currentDailyLines,
                remaining: Math.max(0, user.apiLimits.maxDailyLines - currentDailyLines)
            });
        }

        // Deduct credits from user
        const deductCreditsPromise = User.findByIdAndUpdate(
            user._id,
            { $inc: { credits: -lineCount } }
        );

        // Track this request (don't await to avoid blocking the response)
        const updatePromise = User.updateOne(
            { _id: user._id },
            {
                $inc: {
                    'apiUsage.replicate.totalCalls': 1,
                    'apiUsage.replicate.totalLines': lineCount
                },
                $set: {
                    'apiUsage.replicate.lastUsed': new Date()
                },
                $push: {
                    'apiUsageLogs': {
                        timestamp: new Date(),
                        endpoint: req.originalUrl,
                        lines: lineCount
                    }
                }
            }
        );

        // Store the line count for potential token tracking after the request
        req.lineCount = lineCount;
        req.userCredits = user.credits - lineCount;

        // Continue to the next middleware or route handler
        next();

        // Execute the updates without blocking the request
        Promise.all([deductCreditsPromise, updatePromise]).catch(err => {
            console.error('Error updating API usage stats or credits:', err);
        });

    } catch (error) {
        console.error('Error in API usage tracking middleware:', error);
        // Don't block the request if tracking fails
        next();
    }
};

module.exports = trackApiUsage;