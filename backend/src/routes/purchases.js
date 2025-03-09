const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const config = require('../config');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key');

// Credit package definitions
const CREDIT_PACKAGES = {
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

/**
 * @route GET /api/purchases/credit-packages
 * @desc Get available credit packages
 * @access Public
 */
router.get('/credit-packages', (req, res) => {
  res.json({ packages: CREDIT_PACKAGES });
});

/**
 * @route POST /api/purchases/buy-credits
 * @desc Create a Stripe checkout session to buy credits
 * @access Private
 */
router.post('/buy-credits', requireAuth, async (req, res) => {
  try {
    const { packageId, successUrl, cancelUrl } = req.body;
    const userId = req.user.id;

    // Validate package exists
    if (!CREDIT_PACKAGES[packageId]) {
      return res.status(400).json({ error: 'Invalid package selected' });
    }

    const selectedPackage = CREDIT_PACKAGES[packageId];

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: selectedPackage.name,
              description: `${selectedPackage.credits} AI credits for 8020.best`,
            },
            unit_amount: Math.round(selectedPackage.price * 100), // Stripe expects amounts in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        packageId,
        credits: selectedPackage.credits
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

/**
 * @route POST /api/purchases/webhook
 * @desc Stripe webhook handler for successful payments
 * @access Public (secured by Stripe signature)
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;

  // Verify webhook signature
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock_key'
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      const { userId, credits } = session.metadata;

      // Add credits to user account
      const user = await User.findById(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Update user's credits
      user.credits = (user.credits || 0) + parseInt(credits, 10);
      await user.save();

      console.log(`Added ${credits} credits to user ${userId}, new balance: ${user.credits}`);
    } catch (error) {
      console.error('Error processing successful payment:', error);
      return res.status(500).send('Error processing webhook');
    }
  }

  res.status(200).json({ received: true });
});

/**
 * @route GET /api/purchases/check-success
 * @desc Check if a purchase was successful and update user credits
 * @access Private
 */
router.get('/check-success', requireAuth, async (req, res) => {
  try {
    // Refresh user data to get updated credit balance
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      credits: user.credits || 0
    });
  } catch (error) {
    console.error('Error checking purchase status:', error);
    res.status(500).json({ error: 'Failed to check purchase status' });
  }
});

module.exports = router;