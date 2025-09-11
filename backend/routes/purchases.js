const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const User = require('../src/models/User');
const { requireAuth } = require('../middleware/auth');

// Initialize Stripe with the API key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key');

/**
 * @route GET /api/purchases/credit-packages
 * @desc Get available credit packages (mock data for now)
 * @access Public
 */
router.get('/credit-packages', (req, res) => {
    // Return mock data for now
    const mockPackages = {
        credit_small: {
            id: 'credit_small',
            name: '300 Credits',
            price: 4.99,
            credits: 300,
            description: 'Good for occasional use (300 note analyses)'
        },
        credit_medium: {
            id: 'credit_medium',
            name: '1,000 Credits',
            price: 9.99,
            credits: 1000,
            description: 'Best value for regular users (1,000 note analyses)'
        },
        credit_large: {
            id: 'credit_large',
            name: '5,000 Credits',
            price: 34.99,
            credits: 5000,
            description: 'Ideal for power users (5,000 note analyses)'
        }
    };

    res.json({ packages: mockPackages });
});

/**
 * @route POST /api/purchases/create-checkout-session
 * @desc Create a Stripe checkout session for credit purchase
 * @access Private
 */
router.post('/create-checkout-session', requireAuth, async (req, res) => {
    try {
        const { packageId } = req.body;
        const userId = req.user?.id || req.user?.userId;

        // Get user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Define price mapping
        const packages = {
            credit_small: { priceId: 'price_credit_small_299', credits: 300 },
            credit_medium: { priceId: 'price_credit_medium_999', credits: 1000 },
            credit_large: { priceId: 'price_credit_large_3499', credits: 5000 }
        };

        const selectedPackage = packages[packageId];
        if (!selectedPackage) {
            return res.status(400).json({ error: 'Invalid package' });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: selectedPackage.priceId,
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/credits`,
            client_reference_id: userId,
            metadata: {
                userId: userId,
                packageId: packageId,
                credits: selectedPackage.credits.toString()
            }
        });

        res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});

/**
 * @route POST /api/purchases/webhook
 * @desc Handle Stripe webhooks
 * @access Public (but verified)
 */
router.post('/webhook', (req, res, next) => {
    // Use raw middleware for this route only
    express.raw({type: 'application/json'})(req, res, next);
}, async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.log(`Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        try {
            const userId = session.client_reference_id;
            const credits = parseInt(session.metadata.credits);

            const user = await User.findById(userId);
            if (user) {
                user.addCredits(credits);
                await user.save();
                console.log(`Added ${credits} credits to user ${user.email}`);
            }
        } catch (error) {
            console.error('Error processing webhook:', error);
        }
    }

    res.json({received: true});
});

/**
 * @route GET /api/purchases/session-status
 * @desc Check the status of a checkout session
 * @access Private
 */
router.get('/session-status/:sessionId', requireAuth, async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
        
        if (session.payment_status === 'paid') {
            const userId = session.client_reference_id;
            const credits = parseInt(session.metadata.credits);
            
            // Double check that credits were added
            const user = await User.findById(userId);
            
            res.json({
                success: true,
                status: session.payment_status,
                credits: credits,
                userCredits: user ? user.credits : 0
            });
        } else {
            res.json({
                success: false,
                status: session.payment_status
            });
        }
    } catch (error) {
        console.error('Error checking session status:', error);
        res.status(500).json({ error: 'Failed to check session status' });
    }
});

module.exports = router;