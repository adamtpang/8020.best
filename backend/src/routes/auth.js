const express = require('express');
const router = express.Router();
const { User } = require('../models/User');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { verifyToken } = require('../middlewares/authMiddleware');

// Create or update user from Firebase
router.post('/firebase-user', async (req, res) => {
    try {
        const { email, uid, displayName } = req.body;

        // Find or create user
        let user = await User.findOne({ email });
        if (!user) {
            user = new User({
                email,
                uid,
                displayName,
                credits: 100 // Start with 100 free credits
            });
            await user.save();
        }

        res.json({
            message: 'User data synced successfully',
            user: {
                email: user.email,
                credits: user.credits,
                displayName: user.displayName,
                uid: user.uid
            }
        });
    } catch (error) {
        console.error('Error syncing Firebase user:', error);
        res.status(500).json({ message: 'Failed to sync user data' });
    }
});

// Add this route to handle Google OAuth authentication

/**
 * POST /auth/google
 * Authenticate or register a user with Google OAuth
 */
router.post('/google', async (req, res) => {
    try {
        const { tokenId } = req.body;

        if (!tokenId) {
            return res.status(400).json({ message: 'No token provided' });
        }

        // Verify the Google token
        const response = await axios.get(
            `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${tokenId}`
        );

        const { email, sub, name, picture } = response.data;

        if (!email) {
            return res.status(400).json({ message: 'Invalid Google token' });
        }

        // Check if user exists
        let user = await User.findOne({ email });
        let isNewUser = false;

        if (!user) {
            // Create a new user if they don't exist
            isNewUser = true;
            user = new User({
                email,
                name: name || email.split('@')[0],
                googleId: sub,
                profilePicture: picture,
                password: crypto.randomBytes(16).toString('hex'), // Random password for Google users
                role: 'user',
                credits: 1000, // Give new users 1000 credits immediately
                hasPurchased: false
            });

            await user.save();
            console.log(`New user created via Google OAuth: ${email} with 1000 credits`);
        } else {
            // Update existing user with Google info if needed
            user.googleId = sub;
            if (picture && !user.profilePicture) {
                user.profilePicture = picture;
            }
            if (name && !user.name) {
                user.name = name;
            }

            // If user has 0 credits, give them the initial 1000
            if (user.credits === 0) {
                user.credits = 1000;
                console.log(`Updated existing user via Google OAuth: ${email} with 1000 credits`);
            }

            await user.save();
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return user info and token
        res.json({
            token,
            isNewUser,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePicture: user.profilePicture,
                credits: user.credits
            }
        });

    } catch (error) {
        console.error('Google authentication error:', error);
        res.status(500).json({ message: 'Failed to authenticate with Google' });
    }
});

/**
 * GET /auth/me
 * Get current user information
 * Requires authentication
 */
router.get('/me', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePicture: user.profilePicture,
                apiUsage: user.apiUsage,
                apiLimits: user.apiLimits
            }
        });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: 'Failed to fetch user data' });
    }
});

/**
 * POST /auth/register
 * Register a new user with email and password
 */
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide name, email, and password' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Create a new user
        const user = new User({
            name,
            email,
            password, // Will be hashed by the User model pre-save hook
            role: 'user'
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return user info and token
        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Failed to register user' });
    }
});

/**
 * POST /auth/login
 * Login a user with email and password
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Update last login time
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return user info and token
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePicture: user.profilePicture
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Failed to login' });
    }
});

module.exports = router;