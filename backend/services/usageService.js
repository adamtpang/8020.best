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
const FREE_RUNS_PER_DAY = parseInt(process.env.FREE_RUNS_PER_DAY || '5', 10);
const LIGHT_MONTHLY_SOFT_LIMIT = parseInt(process.env.LIGHT_MONTHLY_SOFT_LIMIT || '300', 10);
const PRO_MONTHLY_SOFT_LIMIT = parseInt(process.env.PRO_MONTHLY_SOFT_LIMIT || '1000', 10);
const OVERAGE_GRACE_PERCENT = parseInt(process.env.OVERAGE_GRACE_PERCENT || '20', 10);

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
 * Returns { allowed: boolean, reason?: string, dailyRemaining?: number, monthlyRemaining?: number }
 */
async function checkQuota(user, req) {
    // Master accounts bypass all limits
    if (user && (user.isMasterAccount || user.email === 'adamtpangelinan@gmail.com')) {
        return {
            allowed: true,
            reason: 'unlimited',
            dailyRemaining: Infinity,
            monthlyRemaining: Infinity
        };
    }

    const anonymousId = user ? null : generateAnonymousId(req);
    const userId = user ? user._id : null;
    const plan = user ? user.plan : 'free';

    // Get current usage
    const dailyRuns = await getDailyRuns(userId, anonymousId);
    const monthlyRuns = user ? await getMonthlyRuns(userId) : 0;

    // Check daily quota for free users (auth or anon)
    if (plan === 'free') {
        const dailyRemaining = FREE_RUNS_PER_DAY - dailyRuns;

        if (dailyRuns >= FREE_RUNS_PER_DAY) {
            return {
                allowed: false,
                reason: 'daily_quota_exceeded',
                dailyRemaining: 0,
                quota: FREE_RUNS_PER_DAY
            };
        }

        return {
            allowed: true,
            reason: 'free_tier',
            dailyRemaining,
            quota: FREE_RUNS_PER_DAY
        };
    }

    // Check monthly soft-limits for paid users
    let monthlyLimit;
    if (plan === 'light') {
        monthlyLimit = LIGHT_MONTHLY_SOFT_LIMIT;
    } else if (plan === 'pro') {
        monthlyLimit = PRO_MONTHLY_SOFT_LIMIT;
    } else {
        monthlyLimit = FREE_RUNS_PER_DAY * 30; // Fallback
    }

    const graceLimit = Math.floor(monthlyLimit * (1 + OVERAGE_GRACE_PERCENT / 100));
    const monthlyRemaining = monthlyLimit - monthlyRuns;

    // Hard block if over grace limit
    if (monthlyRuns >= graceLimit) {
        return {
            allowed: false,
            reason: 'monthly_quota_exceeded',
            monthlyRemaining: 0,
            monthlyLimit,
            monthlyUsed: monthlyRuns,
            showUpsell: true
        };
    }

    // Soft warning if over limit but within grace
    if (monthlyRuns >= monthlyLimit) {
        return {
            allowed: true,
            reason: 'monthly_quota_warning',
            monthlyRemaining,
            monthlyLimit,
            monthlyUsed: monthlyRuns,
            showWarning: true,
            warningMessage: `You've used ${monthlyRuns} of ${monthlyLimit} runs this month. Consider upgrading for more capacity.`
        };
    }

    // All good
    return {
        allowed: true,
        reason: 'paid_tier',
        monthlyRemaining,
        monthlyLimit,
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
    if (!user) {
        // Anonymous user
        const anonymousId = generateAnonymousId(req);
        const dailyRuns = await getDailyRuns(null, anonymousId);
        return {
            plan: 'free',
            dailyRuns,
            dailyQuota: FREE_RUNS_PER_DAY,
            dailyRemaining: Math.max(0, FREE_RUNS_PER_DAY - dailyRuns)
        };
    }

    const plan = user.plan || 'free';
    const dailyRuns = await getDailyRuns(user._id);
    const monthlyRuns = await getMonthlyRuns(user._id);

    if (plan === 'free') {
        return {
            plan,
            dailyRuns,
            dailyQuota: FREE_RUNS_PER_DAY,
            dailyRemaining: Math.max(0, FREE_RUNS_PER_DAY - dailyRuns)
        };
    }

    const monthlyLimit = plan === 'light' ? LIGHT_MONTHLY_SOFT_LIMIT : PRO_MONTHLY_SOFT_LIMIT;

    return {
        plan,
        monthlyRuns,
        monthlyLimit,
        monthlyRemaining: Math.max(0, monthlyLimit - monthlyRuns),
        percentUsed: Math.min(100, Math.round((monthlyRuns / monthlyLimit) * 100))
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
    FREE_RUNS_PER_DAY,
    LIGHT_MONTHLY_SOFT_LIMIT,
    PRO_MONTHLY_SOFT_LIMIT
};