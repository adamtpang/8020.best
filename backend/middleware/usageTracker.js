/**
 * API Usage Tracking Middleware
 *
 * Tracks API usage by user and enforces usage limits
 */
const User = require('../models/User');

/**
 * Middleware to track API usage and enforce limits
 * This middleware should be applied to routes that use the Replicate API
 */
const trackApiUsage = async (req, res, next) => {
    // Skip tracking if no user is authenticated
    if (!req.user || !req.user.id) {
        return next();
    }

    try {
        // Get the user from the database
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if user is restricted from API access
        if (user.apiLimits?.isRestricted) {
            return res.status(403).json({
                error: 'API access restricted',
                message: 'Your account has been restricted from using the API. Please contact support.'
            });
        }

        // Initialize API usage tracking if it doesn't exist
        if (!user.apiUsage) {
            user.apiUsage = { replicate: { totalCalls: 0, totalTokens: 0, totalLines: 0 } };
        }

        if (!user.apiUsage.replicate) {
            user.apiUsage.replicate = { totalCalls: 0, totalTokens: 0, totalLines: 0 };
        }

        // Get the number of lines in the request
        const lines = req.body.text ? req.body.text.split('\n').filter(line => line.trim()).length : 1;

        // Check daily line limit
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Initialize daily tracking if it doesn't exist
        if (!user.apiUsage.replicate.dailyUsage) {
            user.apiUsage.replicate.dailyUsage = {
                date: today,
                lines: 0
            };
        }

        // Reset daily tracking if it's a new day
        if (user.apiUsage.replicate.dailyUsage.date < today) {
            user.apiUsage.replicate.dailyUsage = {
                date: today,
                lines: 0
            };
        }

        // Check if adding these lines would exceed the daily limit
        const dailyLinesAfterRequest = user.apiUsage.replicate.dailyUsage.lines + lines;
        const maxDailyLines = user.apiLimits?.maxDailyLines || 1000; // Default to 1000 if not set

        if (dailyLinesAfterRequest > maxDailyLines) {
            return res.status(429).json({
                error: 'Daily limit exceeded',
                message: `You have exceeded your daily limit of ${maxDailyLines} lines. Please try again tomorrow.`,
                dailyUsage: user.apiUsage.replicate.dailyUsage.lines,
                dailyLimit: maxDailyLines
            });
        }

        // Check if user has enough credits
        if (user.credits < lines) {
            return res.status(402).json({
                error: 'Insufficient credits',
                message: `You need ${lines} credits to process this request, but you only have ${user.credits}.`,
                required: lines,
                available: user.credits
            });
        }

        // Deduct credits
        user.credits -= lines;

        // Store the original response send method
        const originalSend = res.send;

        // Override the send method to track API usage after the request is processed
        res.send = function (body) {
            // Only track successful API calls
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const updateApiUsage = async () => {
                    try {
                        // Parse the response body if it's a string
                        let responseData = body;
                        if (typeof body === 'string') {
                            try {
                                responseData = JSON.parse(body);
                            } catch (e) {
                                // If parsing fails, use the original body
                                responseData = body;
                            }
                        }

                        // Estimate token usage (this is a rough estimate)
                        const tokensUsed = responseData.tokensUsed ||
                            (responseData.usage?.total_tokens) ||
                            Math.ceil(lines * 100); // Rough estimate: 100 tokens per line

                        // Update API usage stats
                        user.apiUsage.replicate.totalCalls += 1;
                        user.apiUsage.replicate.totalTokens += tokensUsed;
                        user.apiUsage.replicate.totalLines += lines;
                        user.apiUsage.replicate.lastUsed = new Date();
                        user.apiUsage.replicate.dailyUsage.lines += lines;

                        // Save the updated user
                        await user.save();

                        console.log(`API usage tracked for user ${user._id}: +${lines} lines, +${tokensUsed} tokens`);
                    } catch (error) {
                        console.error('Error updating API usage stats:', error);
                    }
                };

                // Don't wait for the update to complete before sending the response
                updateApiUsage().catch(console.error);
            }

            // Call the original send method
            return originalSend.call(this, body);
        };

        // Continue to the next middleware
        next();
    } catch (error) {
        console.error('Error in API usage tracking middleware:', error);
        next(error);
    }
};

module.exports = { trackApiUsage };