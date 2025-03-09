const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const User = require('../models/User');
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
 * @route POST /api/purchases/buy-credits
 * @desc Simulated endpoint for buying credits (will be implemented later)
 * @access Private
 */
router.post('/buy-credits', requireAuth, (req, res) => {
    // For now, just simulate a successful response
    res.json({
        success: true,
        message: 'Credit purchasing will be implemented later',
        url: '#'
    });
});

/**
 * @route GET /api/purchases/check-success
 * @desc Check if a purchase was successful
 * @access Private
 */
router.get('/check-success', requireAuth, (req, res) => {
    // For now, return a simulated response
    res.json({
        success: true,
        credits: 100,
        message: 'Credits granted (simulated)'
    });
});

module.exports = router;