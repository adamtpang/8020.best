const express = require('express');
const router = express.Router();
const { upgradeUserPlan, downgradeUserPlan } = require('../services/planService');
const User = require('../src/models/User');
const rawBody = require('raw-body');

/**
 * Stripe webhook handler
 * Handles payment link completion and subscription events
 *
 * Setup instructions:
 * 1. Create Stripe Payment Links at https://dashboard.stripe.com/payment-links
 * 2. Set up webhook at https://dashboard.stripe.com/webhooks
 * 3. Add webhook URL: https://yourdomain.com/api/stripe/webhook
 * 4. Subscribe to events: checkout.session.completed, customer.subscription.deleted
 * 5. Copy webhook secret to STRIPE_WEBHOOK_SECRET in .env
 */

router.post('/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // For MVP with Payment Links, we'll use a simplified approach
    // TODO: Implement full Stripe webhook signature verification for production

    try {
        const event = req.body;

        console.log('[Stripe Webhook] Received event:', event.type);

        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompleted(event.data.object);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionCanceled(event.data.object);
                break;

            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('[Stripe Webhook] Error:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * Handle successful checkout from Payment Link
 */
async function handleCheckoutCompleted(session) {
    try {
        const customerEmail = session.customer_details?.email || session.customer_email;

        if (!customerEmail) {
            console.error('[Stripe] No customer email in session');
            return;
        }

        // Find user by email
        const user = await User.findOne({ email: customerEmail });

        if (!user) {
            console.log(`[Stripe] User not found for email: ${customerEmail}. Creating placeholder...`);
            // TODO: Create user or queue for manual assignment
            return;
        }

        // Determine plan from amount (this is simplified for Payment Links)
        const amountTotal = session.amount_total / 100; // Convert cents to dollars
        let plan = 'free';

        if (amountTotal >= 10) {
            plan = 'pro';
        } else if (amountTotal >= 5) {
            plan = 'light';
        }

        // Upgrade user
        await upgradeUserPlan(user._id, plan, {
            customerId: session.customer,
            subscriptionId: session.subscription,
            renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 days
        });

        console.log(`[Stripe] User ${user.email} upgraded to ${plan}`);
    } catch (error) {
        console.error('[Stripe] Error handling checkout:', error);
    }
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCanceled(subscription) {
    try {
        const user = await User.findOne({ stripeSubscriptionId: subscription.id });

        if (!user) {
            console.log(`[Stripe] No user found for subscription: ${subscription.id}`);
            return;
        }

        await downgradeUserPlan(user._id);

        console.log(`[Stripe] User ${user.email} downgraded to free (subscription canceled)`);
    } catch (error) {
        console.error('[Stripe] Error handling cancellation:', error);
    }
}

/**
 * Handle subscription updates (plan changes, renewals)
 */
async function handleSubscriptionUpdated(subscription) {
    try {
        const user = await User.findOne({ stripeSubscriptionId: subscription.id });

        if (!user) {
            console.log(`[Stripe] No user found for subscription: ${subscription.id}`);
            return;
        }

        // Update renewal date
        if (subscription.current_period_end) {
            user.planRenewsAt = new Date(subscription.current_period_end * 1000);
            await user.save();
            console.log(`[Stripe] Updated renewal date for ${user.email}`);
        }
    } catch (error) {
        console.error('[Stripe] Error handling subscription update:', error);
    }
}

/**
 * Get Stripe payment link for a plan (for frontend)
 */
router.get('/payment-link/:plan', (req, res) => {
    const { plan } = req.params;
    const { getStripeLink } = require('../services/planService');

    const link = getStripeLink(plan);

    if (!link) {
        return res.status(404).json({ error: 'Plan not found' });
    }

    res.json({ link });
});

/**
 * Get all plans with pricing info
 */
router.get('/plans', (req, res) => {
    const { getAllPlans } = require('../services/planService');
    const plans = getAllPlans();

    res.json({ success: true, plans });
});

module.exports = router;