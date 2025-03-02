const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create a payment intent for credit purchase
router.post('/create-payment-intent', auth, async (req, res) => {
    try {
        const { creditPackage } = req.body;

        // Define credit packages and their costs
        const packages = {
            small: { credits: 100, amount: 100 }, // $1 for 100 credits
            large: { credits: 1100, amount: 1000 }, // $10 for 1100 credits (10% bonus)
        };

        // Validate package selection
        if (!packages[creditPackage]) {
            return res.status(400).json({ error: 'Invalid credit package' });
        }

        // Create a payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: packages[creditPackage].amount,
            currency: 'usd',
            metadata: {
                userId: req.user.id,
                creditPackage,
                credits: packages[creditPackage].credits
            }
        });

        res.json({
            clientSecret: paymentIntent.client_secret
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Handle successful payment webhook and add credits to user
router.post('/payment-success', async (req, res) => {
    try {
        const { paymentIntentId } = req.body;

        // Verify the payment intent
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === 'succeeded') {
            const { userId, credits } = paymentIntent.metadata;

            // Add credits to user
            await User.findByIdAndUpdate(
                userId,
                { $inc: { credits: Number(credits) } },
                { new: true }
            );

            res.json({ success: true });
        } else {
            res.status(400).json({ error: 'Payment not successful' });
        }
    } catch (error) {
        console.error('Error handling payment success:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user's current credit balance
router.get('/credits', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('credits');
        res.json({ credits: user.credits || 0 });
    } catch (error) {
        console.error('Error fetching credit balance:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;