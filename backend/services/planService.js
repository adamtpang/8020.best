/**
 * Plan management service
 * Handles plan logic and Stripe subscription management
 */

const User = require('../src/models/User');

const PLANS = {
    free: {
        name: 'Free',
        price: 0,
        monthlyLimit: parseInt(process.env.FREE_RUNS_PER_MONTH || '10', 10),
        features: ['10 runs per month', 'Basic 80/20 analysis']
    },
    paid: {
        name: 'Pro',
        price: 10,
        monthlyLimit: parseInt(process.env.PAID_MONTHLY_SOFT_LIMIT || '1000', 10),
        features: ['1000 runs per month', 'Priority support', 'Advanced analysis']
    }
};

const STRIPE_LINKS = {
    paid: process.env.STRIPE_LINK_PAID || 'https://buy.stripe.com/REPLACE_PAID'
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
        paid: {
            ...PLANS.paid,
            stripeLink: STRIPE_LINKS.paid
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