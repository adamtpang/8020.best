const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * @route   POST /api/users/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Simple validation
        if (!name || !email || !password) {
            return res.status(400).json({ msg: 'Please enter all fields' });
        }

        // Check for existing user
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Create a new user
        const newUser = new User({
            name,
            email,
            password
        });

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        newUser.password = await bcrypt.hash(password, salt);

        // Save the user
        await newUser.save();

        // Create JWT token
        const token = jwt.sign(
            { id: newUser.id },
            process.env.JWT_SECRET || 'devjwtsecret',
            { expiresIn: 3600 }
        );

        res.json({
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email
            }
        });
    } catch (error) {
        console.error('Error in user registration:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

/**
 * @route   POST /api/users/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Simple validation
        if (!email || !password) {
            return res.status(400).json({ msg: 'Please enter all fields' });
        }

        // Check for existing user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'User does not exist' });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Create JWT token
        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET || 'devjwtsecret',
            { expiresIn: 3600 }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Error in user login:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

/**
 * @route   GET /api/users/me
 * @desc    Get user data
 * @access  Private
 */
router.get('/me', async (req, res) => {
    try {
        // In development mode, return a mock user
        if (process.env.NODE_ENV === 'development') {
            return res.json({
                id: 'dev-user-id',
                name: 'Test User',
                email: 'test@example.com',
                credits: 100,
                role: 'user'
            });
        }

        // Otherwise look up real user
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   POST /api/users/firebase-auth
 * @desc    Register or login a user with Firebase credentials
 * @access  Private (requires Firebase token)
 */
router.post('/firebase-auth', async (req, res) => {
    try {
        console.log('Firebase auth request received:', {
            user: req.user,
            body: req.body
        });

        if (!req.user || !req.user.firebaseUid) {
            return res.status(400).json({ msg: 'No Firebase UID provided' });
        }

        // Check if user already exists with this Firebase UID
        let user = await User.findOne({ firebaseUid: req.user.firebaseUid });

        // If user doesn't exist but we have their email, try to find by email
        if (!user && req.user.email) {
            user = await User.findOne({ email: req.user.email });

            // If user exists by email, update their Firebase UID
            if (user) {
                user.firebaseUid = req.user.firebaseUid;
                if (req.user.displayName && !user.name) {
                    user.name = req.user.displayName;
                }
                await user.save();
            }
        }

        // Create a new user if they don't exist
        if (!user) {
            user = new User({
                name: req.user.displayName || req.user.email.split('@')[0],
                email: req.user.email,
                firebaseUid: req.user.firebaseUid,
                credits: 1000 // Give new users some initial credits
            });
            await user.save();
        }

        // Create JWT token
        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET || 'devjwtsecret',
            { expiresIn: 86400 } // 24 hours
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                credits: user.credits || 0
            }
        });
    } catch (error) {
        console.error('Error in Firebase auth:', error);
        res.status(500).json({ error: 'Server error during Firebase authentication' });
    }
});

/**
 * @route   POST /api/users/save-tasks
 * @desc    Save user task lists
 * @access  Private
 */
router.post('/save-tasks', async (req, res) => {
    try {
        const { regular, important, urgent } = req.body;

        let user;

        // Build update object
        const taskListsUpdate = {
            taskLists: {
                regular: regular || [],
                important: important || [],
                urgent: urgent || []
            },
            lastSynced: new Date()
        };

        // Try to find and update user by MongoDB ID first
        if (req.user.id) {
            try {
                user = await User.findByIdAndUpdate(
                    req.user.id,
                    taskListsUpdate,
                    { new: true, select: 'taskLists lastSynced' }
                );
            } catch (idError) {
                console.log('Error finding by MongoDB ID:', idError.message);
            }
        }

        // If not updated by ID and we have Firebase UID, try that
        if (!user && req.user.firebaseUid) {
            user = await User.findOneAndUpdate(
                { firebaseUid: req.user.firebaseUid },
                taskListsUpdate,
                { new: true, select: 'taskLists lastSynced' }
            );
        }

        // If not found by Firebase UID, try email
        if (!user && req.user.email) {
            user = await User.findOneAndUpdate(
                { email: req.user.email },
                taskListsUpdate,
                { new: true, select: 'taskLists lastSynced' }
            );
        }

        // If no user found and we have Firebase UID, create a new user
        if (!user && req.user.firebaseUid && req.user.email) {
            try {
                // Create a random password for Firebase users
                const password = Math.random().toString(36).slice(-10);
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);

                // Create a name from email if needed
                const userName = req.user.email.split('@')[0] || 'Firebase User';

                // Create new user with tasks
                const newUser = new User({
                    name: userName,
                    email: req.user.email,
                    password: hashedPassword,
                    firebaseUid: req.user.firebaseUid,
                    taskLists: {
                        regular: regular || [],
                        important: important || [],
                        urgent: urgent || []
                    },
                    lastSynced: new Date(),
                    credits: 0
                });

                user = await newUser.save();
                console.log('Created new user during save-tasks:', req.user.email);
            } catch (createError) {
                console.error('Error creating user during save-tasks:', createError);
                // Continue with response
            }
        }

        if (!user) {
            // In development mode, just return success without creating a user
            if (process.env.NODE_ENV === 'development') {
                return res.json({
                    message: 'Dev mode: Tasks saved (but no user found)',
                    regular: regular || [],
                    important: important || [],
                    urgent: urgent || [],
                    lastSynced: new Date(),
                    _devMode: true
                });
            }

            return res.status(404).json({ msg: 'User not found and could not be created' });
        }

        res.json({
            regular: user.taskLists.regular,
            important: user.taskLists.important,
            urgent: user.taskLists.urgent,
            lastSynced: user.lastSynced
        });
    } catch (error) {
        console.error('Error saving tasks:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

/**
 * @route   GET /api/users/tasks
 * @desc    Get user task lists
 * @access  Private
 */
router.get('/tasks', async (req, res) => {
    try {
        // First check if we have authentication info
        if (!req.user) {
            console.log('No user in request object');
            return res.status(401).json({ msg: 'No authentication information' });
        }

        // Debug info
        console.log('Looking for user with:', {
            id: req.user.id || 'none',
            firebaseUid: req.user.firebaseUid || 'none',
            email: req.user.email || 'none'
        });

        let user;

        // Try multiple lookup methods
        // 1. Try MongoDB ID
        if (req.user.id) {
            try {
                user = await User.findById(req.user.id).select('taskLists lastSynced');
                if (user) console.log('Found user by MongoDB ID');
            } catch (idError) {
                console.log('Error finding by MongoDB ID:', idError.message);
            }
        }

        // 2. If not found and we have Firebase UID, try by Firebase UID
        if (!user && req.user.firebaseUid) {
            user = await User.findOne({ firebaseUid: req.user.firebaseUid }).select('taskLists lastSynced');
            if (user) console.log('Found user by Firebase UID');
        }

        // 3. If still not found and we have email, try by email
        if (!user && req.user.email) {
            user = await User.findOne({ email: req.user.email }).select('taskLists lastSynced');
            if (user) console.log('Found user by email');
        }

        if (!user) {
            // If we're in dev mode, create a mock user with empty task lists
            if (process.env.NODE_ENV === 'development') {
                console.log('Dev mode: returning empty task lists for missing user');
                return res.json({
                    regular: [],
                    important: [],
                    urgent: [],
                    lastSynced: null,
                    _devMode: true
                });
            }

            console.log('User not found by any method');
            return res.status(404).json({ msg: 'User not found' });
        }

        // Return task lists or empty arrays if not found
        res.json({
            regular: user.taskLists?.regular || [],
            important: user.taskLists?.important || [],
            urgent: user.taskLists?.urgent || [],
            lastSynced: user.lastSynced
        });
    } catch (error) {
        console.error('Error retrieving tasks:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;