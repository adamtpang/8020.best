/**
 * Plan management service
 * Handles plan logic and Stripe subscription management
 */

const User = require('../src/models/User');

const PLANS = {
    free: {
        name: 'Free',
        price: 0,
        dailyLimit: parseInt(process.env.FREE_RUNS_PER_DAY || '5', 10),
        monthlyLimit: null,
        features: ['5 runs per day', 'Basic 80/20 analysis']
    },
    light: {
        name: 'Light',
        price: 5,
        dailyLimit: null,
        monthlyLimit: parseInt(process.env.LIGHT_MONTHLY_SOFT_LIMIT || '300', 10),
        features: ['300 runs per month', 'Priority support', 'Advanced analysis']
    },
    pro: {
        name: 'Pro',
        price: 10,
        dailyLimit: null,
        monthlyLimit: parseInt(process.env.PRO_MONTHLY_SOFT_LIMIT || '1000', 10),
        features: ['1000 runs per month', 'Priority support', 'Advanced analysis', 'Export to Notion/Calendar']
    }
};

const STRIPE_LINKS = {
    light: process.env.STRIPE_LINK_LIGHT || 'https://buy.stripe.com/REPLACE_LIGHT',
    pro: process.env.STRIPE_LINK_PRO || 'https://buy.stripe.com/REPLACE_PRO'
};

/**
 * Get plan details
 */
function getPlanDetails(planName) {
    return PLANS[planName] || PLANS.free;
}

/**
 * Get user's current plan
 */
function getUserPlan(user) {
    if (!user) return 'free';
    return user.plan || 'free';
}

/**
 * Get Stripe payment link for a plan
 */
function getStripeLink(planName) {
    return STRIPE_LINKS[planName] || null;
}

/**
 * Upgrade user to paid plan (called from Stripe webhook)
 */
async function upgradeUserPlan(userId, plan, stripeData = {}) {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        user.plan = plan;
        user.planStartedAt = new Date();
        user.planRenewsAt = stripeData.renewsAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 days
        user.stripeCustomerId = stripeData.customerId || user.stripeCustomerId;
        user.stripeSubscriptionId = stripeData.subscriptionId || user.stripeSubscriptionId;

        await user.save();

        console.log(`[Telemetry] checkout_success_${plan} - User: ${user.email}`);

        return user;
    } catch (error) {
        console.error('Error upgrading user plan:', error);
        throw error;
    }
}

/**
 * Downgrade user to free plan (cancellation)
 */
async function downgradeUserPlan(userId) {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        user.plan = 'free';
        user.planStartedAt = null;
        user.planRenewsAt = null;
        user.stripeSubscriptionId = null;

        await user.save();

        console.log(`[Telemetry] plan_downgraded - User: ${user.email}`);

        return user;
    } catch (error) {
        console.error('Error downgrading user plan:', error);
        throw error;
    }
}

/**
 * Check if user's plan is active and not expired
 */
function isPlanActive(user) {
    if (!user || user.plan === 'free') return true;

    // If no renewal date set, assume active
    if (!user.planRenewsAt) return true;

    // Check if expired
    const now = new Date();
    return now < user.planRenewsAt;
}

/**
 * Get all plan options for pricing page
 */
function getAllPlans() {
    return {
        free: {
            ...PLANS.free,
            stripeLink: null
        },
        light: {
            ...PLANS.light,
            stripeLink: STRIPE_LINKS.light
        },
        pro: {
            ...PLANS.pro,
            stripeLink: STRIPE_LINKS.pro
        }
    };
}

module.exports = {
    getPlanDetails,
    getUserPlan,
    getStripeLink,
    upgradeUserPlan,
    downgradeUserPlan,
    isPlanActive,
    getAllPlans,
    PLANS,
    STRIPE_LINKS
};