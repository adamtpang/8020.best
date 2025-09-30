/**
 * Usage tracking service
 * Handles daily and monthly usage tracking for quota enforcement
 *
 * Lightweight pricing philosophy baked in:
 * - Start with $5 Light / $10 Pro
 * - Set FREE_RUNS_PER_DAY=5
 * - Watch conversion (free→paid), ARPU, churn weekly
 * - If conversion < 2%: increase perceived value before changing price
 * - If heavy abuse on $5: drop soft-limit to 200 or add overage packs
 * - If demand strong: test $7 Light via A/B with PRICE_TEST_BUCKET flag
 */

const DailyUsage = require('../src/models/DailyUsage');
const MonthlyUsage = require('../src/models/MonthlyUsage');
const crypto = require('crypto');

// Get config from env with defaults
const FREE_RUNS_PER_MONTH = parseInt(process.env.FREE_RUNS_PER_MONTH || '10', 10);
const PAID_MONTHLY_SOFT_LIMIT = parseInt(process.env.PAID_MONTHLY_SOFT_LIMIT || '1000', 10);
const PAID_MONTHLY_HARD_LIMIT = parseInt(process.env.PAID_MONTHLY_HARD_LIMIT || '1200', 10);
const SHOW_WARNING_AT = parseInt(process.env.SHOW_WARNING_AT || '900', 10);

/**
 * Get today's date as YYYY-MM-DD string
 */
function getTodayString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

/**
 * Get current month as YYYY-MM string
 */
function getMonthString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Generate anonymous ID from IP + User-Agent
 */
function generateAnonymousId(req) {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const combined = `${ip}:${userAgent}`;
    return crypto.createHash('sha256').update(combined).digest('hex');
}

/**
 * Get daily runs for a user or anonymous visitor
 */
async function getDailyRuns(userId, anonymousId = null) {
    const today = getTodayString();

    try {
        if (userId) {
            const record = await DailyUsage.findOne({ userId, date: today });
            return record ? record.runs : 0;
        } else if (anonymousId) {
            const record = await DailyUsage.findOne({ anonymousId, date: today });
            return record ? record.runs : 0;
        }
        return 0;
    } catch (error) {
        console.error('Error getting daily runs:', error);
        return 0;
    }
}

/**
 * Get monthly runs for a user
 */
async function getMonthlyRuns(userId) {
    const month = getMonthString();

    try {
        const record = await MonthlyUsage.findOne({ userId, month });
        return record ? record.runs : 0;
    } catch (error) {
        console.error('Error getting monthly runs:', error);
        return 0;
    }
}

/**
 * Increment run count for a user or anonymous visitor
 */
async function incrementRun(userId, anonymousId = null, plan = 'free') {
    const today = getTodayString();
    const month = getMonthString();

    try {
        // Increment daily usage
        if (userId) {
            await DailyUsage.findOneAndUpdate(
                { userId, date: today },
                { $inc: { runs: 1 }, $set: { updatedAt: new Date() } },
                { upsert: true, new: true }
            );
        } else if (anonymousId) {
            await DailyUsage.findOneAndUpdate(
                { anonymousId, date: today },
                { $inc: { runs: 1 }, $set: { updatedAt: new Date() } },
                { upsert: true, new: true }
            );
        }

        // Increment monthly usage (only for authenticated users)
        if (userId) {
            await MonthlyUsage.findOneAndUpdate(
                { userId, month },
                { $inc: { runs: 1 }, $set: { plan, updatedAt: new Date() } },
                { upsert: true, new: true }
            );
        }

        return true;
    } catch (error) {
        console.error('Error incrementing run:', error);
        return false;
    }
}

/**
 * Check if user/visitor can perform a run based on their quota
 * Returns { allowed: boolean, reason?: string, monthlyRemaining?: number }
 */
async function checkQuota(user, req) {
    // Master accounts bypass all limits
    if (user && (user.isMasterAccount || user.email === 'adamtpangelinan@gmail.com')) {
        return {
            allowed: true,
            reason: 'unlimited',
            monthlyRemaining: Infinity
        };
    }

    const anonymousId = user ? null : generateAnonymousId(req);
    const userId = user ? user._id : null;
    const plan = user ? user.plan : 'free';

    // Get monthly usage
    const monthlyRuns = await getMonthlyRuns(userId);

    // Check monthly quota for free users
    if (plan === 'free') {
        const monthlyRemaining = FREE_RUNS_PER_MONTH - monthlyRuns;

        if (monthlyRuns >= FREE_RUNS_PER_MONTH) {
            return {
                allowed: false,
                reason: 'monthly_quota_exceeded',
                monthlyRemaining: 0,
                quota: FREE_RUNS_PER_MONTH,
                plan: 'free'
            };
        }

        return {
            allowed: true,
            reason: 'free_tier',
            monthlyRemaining,
            quota: FREE_RUNS_PER_MONTH
        };
    }

    // Paid users: 1000 runs/month with grace
    const monthlyRemaining = PAID_MONTHLY_SOFT_LIMIT - monthlyRuns;

    // Hard block at PAID_MONTHLY_HARD_LIMIT (20% grace over limit)
    if (monthlyRuns >= PAID_MONTHLY_HARD_LIMIT) {
        return {
            allowed: false,
            reason: 'monthly_quota_exceeded',
            monthlyRemaining: 0,
            monthlyLimit: PAID_MONTHLY_SOFT_LIMIT,
            monthlyUsed: monthlyRuns,
            showUpsell: true,
            message: `You've exceeded your 1000 run limit this month. It resets on the 1st.`
        };
    }

    // Show soft warning at SHOW_WARNING_AT (900 runs)
    if (monthlyRuns >= SHOW_WARNING_AT) {
        return {
            allowed: true,
            reason: 'approaching_limit',
            monthlyRemaining,
            monthlyLimit: PAID_MONTHLY_SOFT_LIMIT,
            monthlyUsed: monthlyRuns,
            showWarning: true,
            warningMessage: `You've used ${monthlyRuns} of ${PAID_MONTHLY_SOFT_LIMIT} runs this month.`
        };
    }

    // All good
    return {
        allowed: true,
        reason: 'paid_tier',
        monthlyRemaining,
        monthlyLimit: PAID_MONTHLY_SOFT_LIMIT,
        monthlyUsed: monthlyRuns
    };
}

/**
 * Record a run (call this after successful analysis)
 */
async function recordRun(user, req) {
    const anonymousId = user ? null : generateAnonymousId(req);
    const userId = user ? user._id : null;
    const plan = user ? user.plan : 'free';

    await incrementRun(userId, anonymousId, plan);

    // Fire telemetry event
    console.log(`[Telemetry] run_ok - User: ${user?.email || 'anonymous'}, Plan: ${plan}`);
}

/**
 * Get usage summary for display
 */
async function getUsageSummary(user, req) {
    const monthlyRuns = user ? await getMonthlyRuns(user._id) : 0;
    const plan = user ? user.plan : 'free';

    if (plan === 'free') {
        return {
            plan: 'free',
            monthlyRuns,
            monthlyQuota: FREE_RUNS_PER_MONTH,
            monthlyRemaining: Math.max(0, FREE_RUNS_PER_MONTH - monthlyRuns)
        };
    }

    // Paid: show limit and remaining
    return {
        plan,
        monthlyRuns,
        monthlyLimit: PAID_MONTHLY_SOFT_LIMIT,
        monthlyRemaining: Math.max(0, PAID_MONTHLY_SOFT_LIMIT - monthlyRuns),
        showWarning: monthlyRuns >= SHOW_WARNING_AT
    };
}

module.exports = {
    getDailyRuns,
    getMonthlyRuns,
    incrementRun,
    checkQuota,
    recordRun,
    getUsageSummary,
    generateAnonymousId,
    FREE_RUNS_PER_MONTH,
    PAID_MONTHLY_SOFT_LIMIT,
    PAID_MONTHLY_HARD_LIMIT
};