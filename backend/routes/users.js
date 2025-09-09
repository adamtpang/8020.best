const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../src/models/User');
const { requireAuth } = require('../middleware/auth');

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
 * @route   POST /api/users/oauth-auth
 * @desc    Register or login a user with OAuth credentials (Firebase/Google/GitHub)
 * @access  Private (requires valid token)
 */
router.post('/oauth-auth', async (req, res) => {
    try {
        const { firebaseUser, provider } = req.body;
        
        if (!firebaseUser || !firebaseUser.uid) {
            return res.status(400).json({ msg: 'No user information provided' });
        }

        // Check if user already exists with this UID
        let user = await User.findOne({ uid: firebaseUser.uid });

        // If user doesn't exist but we have their email, try to find by email
        if (!user && firebaseUser.email) {
            user = await User.findOne({ email: firebaseUser.email });

            // If user exists by email, update their uid
            if (user) {
                user.uid = firebaseUser.uid;
                if (firebaseUser.displayName && !user.displayName) {
                    user.displayName = firebaseUser.displayName;
                }
                if (firebaseUser.photoURL && !user.profilePicture) {
                    user.profilePicture = firebaseUser.photoURL;
                }
                user.authProvider = provider || 'firebase';
                user.lastLogin = new Date();
                await user.save();
            }
        }

        // Create a new user if they don't exist
        if (!user) {
            // Set master account for your email
            const isMaster = firebaseUser.email === 'adamtpangelinan@gmail.com';
            
            user = new User({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                authProvider: provider || 'firebase',
                profilePicture: firebaseUser.photoURL || null,
                credits: 1000, // Give new users 1000 initial credits
                accountType: isMaster ? 'master' : 'free',
                isMasterAccount: isMaster,
                lastLogin: new Date()
            });
            await user.save();
            console.log('Created new OAuth user:', firebaseUser.email, isMaster ? '(MASTER ACCOUNT)' : '');
        } else {
            // Update last login
            user.lastLogin = new Date();
            user.lastUsed = new Date();
            await user.save();
        }

        // Create JWT token
        const token = jwt.sign(
            { id: user._id.toString() },
            process.env.JWT_SECRET || 'devjwtsecret',
            { expiresIn: '7d' } // 7 days
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id.toString(),
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                profilePicture: user.profilePicture,
                credits: user.credits,
                accountType: user.accountType,
                isMasterAccount: user.isMasterAccount,
                lifePriorities: user.lifePriorities,
                selectedModel: user.selectedModel,
                theme: user.theme,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Error in OAuth auth:', error);
        res.status(500).json({ error: 'Server error during OAuth authentication' });
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

// Get user profile
router.get('/profile/:userId', async (req, res) => {
    try {
        const user = await User.findOne({ authProviderId: req.params.userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create or update user profile
router.post('/profile', async (req, res) => {
    try {
        const { authProviderId, email, name, authProvider } = req.body;

        if (!authProviderId || !email || !name || !authProvider) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        let user = await User.findOne({ authProviderId });

        if (user) {
            // Update existing user
            user.email = email;
            user.name = name;
            user.authProvider = authProvider;
            await user.save();
        } else {
            // Create new user
            user = new User({
                authProviderId,
                email,
                name,
                authProvider
            });
            await user.save();
        }

        res.json(user);
    } catch (error) {
        console.error('Error creating/updating user profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update life priorities
router.put('/profile/:userId/priorities', async (req, res) => {
    try {
        const { priority1, priority2, priority3 } = req.body;

        const user = await User.findOne({ authProviderId: req.params.userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.lifePriorities = {
            priority1: priority1?.trim() || '',
            priority2: priority2?.trim() || '',
            priority3: priority3?.trim() || ''
        };

        await user.save();
        res.json(user);
    } catch (error) {
        console.error('Error updating life priorities:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Complete onboarding
router.post('/profile/:userId/complete-onboarding', async (req, res) => {
    try {
        const user = await User.findOne({ authProviderId: req.params.userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.usage.onboardingCompleted = true;
        await user.save();

        res.json({ message: 'Onboarding completed', user });
    } catch (error) {
        console.error('Error completing onboarding:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user preferences
router.put('/profile/:userId/preferences', async (req, res) => {
    try {
        const { theme, taskCountGoal, showTaskBreakdown } = req.body;

        const user = await User.findOne({ authProviderId: req.params.userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (theme) user.preferences.theme = theme;
        if (typeof taskCountGoal === 'number') user.preferences.taskCountGoal = taskCountGoal;
        if (typeof showTaskBreakdown === 'boolean') user.preferences.showTaskBreakdown = showTaskBreakdown;

        await user.save();
        res.json(user);
    } catch (error) {
        console.error('Error updating preferences:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user stats
router.get('/profile/:userId/stats', async (req, res) => {
    try {
        const user = await User.findOne({ authProviderId: req.params.userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const stats = {
            totalAnalyses: user.usage.totalAnalyses,
            lastActiveDate: user.usage.lastActiveDate,
            onboardingCompleted: user.usage.onboardingCompleted,
            hasPriorities: user.hasPriorities(),
            memberSince: user.createdAt
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Clerk authentication routes
const { requireAuth: clerkAuth } = require('../middleware/auth');

// Get user profile (Clerk-compatible)
router.get('/clerk/profile', clerkAuth, async (req, res) => {
    try {
        const user = await User.findOne({ uid: req.user.userId });
        if (!user) {
            // Create user if they don't exist
            const newUser = new User({
                uid: req.user.userId,
                email: req.user.emailAddresses?.[0]?.emailAddress || '',
                displayName: req.user.firstName ? `${req.user.firstName} ${req.user.lastName}`.trim() : ''
            });
            await newUser.save();
            return res.json({
                uid: newUser.uid,
                email: newUser.email,
                displayName: newUser.displayName,
                credits: newUser.credits,
                lifePriorities: newUser.lifePriorities,
                selectedModel: newUser.selectedModel,
                createdAt: newUser.createdAt
            });
        }
        
        res.json({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            credits: user.credits,
            lifePriorities: user.lifePriorities,
            selectedModel: user.selectedModel,
            createdAt: user.createdAt
        });
    } catch (error) {
        console.error('Error fetching Clerk user profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update life priorities (Clerk-compatible)
router.put('/clerk/priorities', clerkAuth, async (req, res) => {
    try {
        const { priority1, priority2, priority3 } = req.body;
        
        const user = await User.findOneAndUpdate(
            { uid: req.user.userId },
            {
                lifePriorities: {
                    priority1: priority1 || '',
                    priority2: priority2 || '',
                    priority3: priority3 || ''
                },
                lastUsed: new Date()
            },
            { new: true, upsert: true }
        );
        
        res.json({ 
            message: 'Priorities updated successfully',
            lifePriorities: user.lifePriorities 
        });
    } catch (error) {
        console.error('Error updating Clerk user priorities:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update selected model (Clerk-compatible)
router.put('/clerk/model', clerkAuth, async (req, res) => {
    try {
        const { selectedModel } = req.body;
        
        if (!['claude-3.5-sonnet', 'gpt-4o-mini', 'llama-3.1-70b'].includes(selectedModel)) {
            return res.status(400).json({ error: 'Invalid model selection' });
        }
        
        const user = await User.findOneAndUpdate(
            { uid: req.user.userId },
            { 
                selectedModel,
                lastUsed: new Date()
            },
            { new: true }
        );
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ 
            message: 'Model updated successfully',
            selectedModel: user.selectedModel 
        });
    } catch (error) {
        console.error('Error updating Clerk user model:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get credit balance (Clerk-compatible)
router.get('/clerk/credits', clerkAuth, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        let user = await User.findOne({ uid: userId });
        
        // In development mode, if we can't find by UID, try by email or create user
        if (!user && process.env.NODE_ENV === 'development') {
            user = await User.findOne({ email: req.user.email });
            
            // If still no user found, create one for development
            if (!user) {
                user = new User({
                    uid: userId || 'dev-user-id',
                    email: req.user.email || 'adamtpangelinan@gmail.com',
                    displayName: req.user.displayName || 'Development User',
                    credits: 999999
                });
                await user.save();
                console.log('Created development user:', user.uid);
            }
        }
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Give admin unlimited credits
        if (user.email === 'adamtpangelinan@gmail.com') {
            user.credits = 999999;
            await user.save();
        }
        
        res.json({ credits: user.credits });
    } catch (error) {
        console.error('Error fetching Clerk user credits:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add credits route for admin
router.post('/clerk/add-credits', clerkAuth, async (req, res) => {
    try {
        const { amount } = req.body;
        const user = await User.findOne({ uid: req.user.userId });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Only allow admin to add credits
        if (user.email !== 'adamtpangelinan@gmail.com') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        user.credits = (user.credits || 0) + (amount || 999999);
        await user.save();
        
        res.json({ 
            message: 'Credits added successfully',
            credits: user.credits 
        });
    } catch (error) {
        console.error('Error adding credits:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route   POST /api/users/priorities
 * @desc    Update user's life priorities
 * @access  Private
 */
router.post('/priorities', requireAuth, async (req, res) => {
    try {
        const { priority1, priority2, priority3 } = req.body;
        
        // Get user ID from different possible sources
        const userId = req.user?.id || req.user?.userId;
        
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Find user by MongoDB ID or UID
        let user = await User.findById(userId);
        if (!user) {
            user = await User.findOne({ uid: userId });
        }
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update priorities
        user.lifePriorities = {
            priority1: (priority1 || '').trim(),
            priority2: (priority2 || '').trim(),
            priority3: (priority3 || '').trim(),
            lastUpdated: new Date()
        };

        await user.save();

        res.json({
            success: true,
            message: 'Priorities updated successfully',
            lifePriorities: user.lifePriorities
        });
    } catch (error) {
        console.error('Error updating priorities:', error);
        res.status(500).json({ error: 'Server error updating priorities' });
    }
});

/**
 * @route   GET /api/users/priorities
 * @desc    Get user's life priorities
 * @access  Private
 */
router.get('/priorities', requireAuth, async (req, res) => {
    try {
        const userId = req.user?.id || req.user?.userId;
        
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Find user by MongoDB ID or UID
        let user = await User.findById(userId);
        if (!user) {
            user = await User.findOne({ uid: userId });
        }
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            lifePriorities: user.lifePriorities || {
                priority1: '',
                priority2: '',
                priority3: '',
                lastUpdated: null
            }
        });
    } catch (error) {
        console.error('Error fetching priorities:', error);
        res.status(500).json({ error: 'Server error fetching priorities' });
    }
});

/**
 * @route   GET /api/users/profile
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/profile', requireAuth, async (req, res) => {
    try {
        const userId = req.user?.id || req.user?.userId;
        
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Find user by MongoDB ID or UID
        let user = await User.findById(userId);
        if (!user) {
            user = await User.findOne({ uid: userId });
        }
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Reset monthly usage if needed
        user.resetMonthlyUsage();
        await user.save();

        res.json({
            success: true,
            user: {
                id: user._id.toString(),
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                profilePicture: user.profilePicture,
                credits: user.credits,
                accountType: user.accountType,
                isMasterAccount: user.isMasterAccount,
                lifePriorities: user.lifePriorities,
                selectedModel: user.selectedModel,
                theme: user.theme,
                usage: user.usage,
                createdAt: user.createdAt,
                lastUsed: user.lastUsed
            }
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Server error fetching profile' });
    }
});

/**
 * @route   POST /api/users/deduct-credits
 * @desc    Deduct credits for AI usage
 * @access  Private
 */
router.post('/deduct-credits', requireAuth, async (req, res) => {
    try {
        const { amount = 10, operation = 'analysis' } = req.body;
        const userId = req.user?.id || req.user?.userId;
        
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Find user by MongoDB ID or UID
        let user = await User.findById(userId);
        if (!user) {
            user = await User.findOne({ uid: userId });
        }
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if user can perform operation
        if (!user.canPerformAnalysis(amount)) {
            return res.status(403).json({ 
                error: 'Insufficient credits',
                credits: user.credits,
                required: amount
            });
        }

        // Deduct credits (unless master account)
        const deducted = user.deductCredits(amount);
        
        // Update usage stats
        user.usage.totalAnalyses += 1;
        user.usage.monthlyAnalyses += 1;
        user.usage.lastAnalysisDate = new Date();
        user.lastUsed = new Date();

        await user.save();

        res.json({
            success: true,
            credits: user.credits,
            deducted: deducted && !user.hasUnlimitedCredits() ? amount : 0,
            hasUnlimitedCredits: user.hasUnlimitedCredits()
        });
    } catch (error) {
        console.error('Error deducting credits:', error);
        res.status(500).json({ error: 'Server error deducting credits' });
    }
});

module.exports = router;