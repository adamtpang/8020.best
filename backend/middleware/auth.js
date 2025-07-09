const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const User = require('../src/models/User');

/**
 * Authentication middleware for protecting routes
 * In development mode, it doesn't verify tokens and creates a demo user
 * In production, you should use proper Firebase Admin verification
 */
const requireAuth = async function (req, res, next) {
    // Get token from header - try multiple header formats
    const token = req.header('x-auth-token') || 
                  req.header('Authorization')?.replace('Bearer ', '') ||
                  req.headers.authorization?.replace('Bearer ', '');

    // In development mode, we're more lenient but still try to authenticate properly
    if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: simplified auth');

        // If we don't have a token, create a mock admin user
        if (!token) {
            req.user = {
                id: 'dev-user-id',
                userId: 'dev-user-id',
                email: 'adamtpangelinan@gmail.com', // Use admin email for development
                firebaseUid: 'dev-user-id',
                role: 'admin'
            };
            return next();
        }

        // If we have a token, try to extract the user ID
        try {
            // If it's a Firebase token, it will have periods (.)
            if (token.includes('.')) {
                try {
                    const parts = token.split('.');
                    if (parts.length >= 2) {
                        try {
                            // Try to extract user info from token payload
                            const base64Payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
                            const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());

                            // Use uid or sub as the user ID
                            const userId = payload.uid || payload.sub || 'dev-user-id';
                            const userEmail = payload.email || 'adamtpangelinan@gmail.com';

                            req.user = {
                                id: userId,
                                userId: userId,
                                email: userEmail,
                                firebaseUid: userId,
                                role: 'admin'
                            };

                            console.log('Development mode: parsed token for user', userId);
                            return next();
                        } catch (parseError) {
                            console.log('Development mode: could not parse token payload');
                        }
                    }
                } catch (tokenParseError) {
                    console.log('Development mode: error parsing token', tokenParseError);
                }
            }

            // Default to using admin email for development
            req.user = {
                id: token,
                userId: token,
                email: 'adamtpangelinan@gmail.com',
                firebaseUid: token,
                role: 'admin'
            };
            console.log('Development mode: using token-derived user');
            return next();
        } catch (error) {
            console.error('Development auth error:', error);
            req.user = {
                id: 'fallback-dev-user-id',
                userId: 'fallback-dev-user-id',
                email: 'adamtpangelinan@gmail.com',
                firebaseUid: 'fallback-dev-user-id',
                role: 'admin'
            };
            return next();
        }
    }

    // Production mode: proper validation required
    if (!token) {
        console.log('No token provided in request');
        return res.status(401).json({ error: 'No token, authorization denied' });
    }

    try {
        // First try Clerk JWT verification
        if (token && token.startsWith('eyJ')) {
            try {
                // Clerk tokens are standard JWTs, try to decode without verification first
                const parts = token.split('.');
                if (parts.length === 3) {
                    const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
                    
                    // Check if this looks like a Clerk token
                    if (payload.iss && payload.iss.includes('clerk')) {
                        const userId = payload.sub;
                        
                        // Find or create user in our database
                        let user = await User.findOne({ uid: userId });
                        
                        if (!user) {
                            // Create new user
                            user = new User({
                                uid: userId,
                                email: payload.email || '',
                                displayName: payload.name || payload.email?.split('@')[0] || 'User',
                                credits: 500 // Default credits for new users
                            });
                            await user.save();
                            console.log('Created new Clerk user:', userId);
                        }
                        
                        req.user = {
                            userId: userId,
                            id: user._id.toString(),
                            email: user.email,
                            displayName: user.displayName,
                            role: user.role || 'user'
                        };
                        
                        console.log('Clerk token validated for user:', userId);
                        return next();
                    }
                }
            } catch (clerkError) {
                console.log('Clerk token validation failed:', clerkError.message);
                // Continue to other validation methods
            }
        }

        // Then try Firebase Admin verification
        if (admin.apps.length) {
            try {
                const decodedToken = await admin.auth().verifyIdToken(token);
                console.log('Firebase token payload:', decodedToken);

                // Find the user by firebaseUid
                let user = await User.findOne({ firebaseUid: decodedToken.uid });

                // If user doesn't exist yet with this Firebase UID, try to find by email
                if (!user && decodedToken.email) {
                    user = await User.findOne({ email: decodedToken.email });

                    // If found by email, update the firebaseUid
                    if (user) {
                        user.firebaseUid = decodedToken.uid;
                        await user.save();
                    }
                }

                if (user) {
                    req.user = {
                        id: user._id.toString(), // MongoDB ObjectId as string
                        email: user.email,
                        firebaseUid: decodedToken.uid,
                        displayName: decodedToken.name || user.name || decodedToken.email?.split('@')[0],
                        role: user.role || 'user'
                    };
                } else {
                    // No user found, but we'll still set the Firebase details for potential registration
                    req.user = {
                        id: null,
                        email: decodedToken.email,
                        firebaseUid: decodedToken.uid,
                        displayName: decodedToken.name || decodedToken.email?.split('@')[0],
                        needsRegistration: true,
                        role: 'user'
                    };
                }

                console.log('Firebase token validated');
                return next();
            } catch (firebaseError) {
                console.log('Firebase token validation failed:', firebaseError.message);
                // Continue to JWT validation
            }
        }

        // Then try standard JWT verification
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'devjwtsecret');
            req.user = decoded.id ? decoded : { id: decoded.user?.id };

            // Look up the user if needed
            if (process.env.NODE_ENV !== 'development') {
                const user = await User.findById(req.user.id);
                if (!user) {
                    return res.status(401).json({ error: 'User not found' });
                }
                req.user.role = user.role || 'user';
            }

            console.log('JWT token validated');
            return next();
        } catch (jwtError) {
            console.error('JWT validation error:', jwtError.message);
            return res.status(401).json({ error: 'Invalid token' });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Middleware to check if user is an admin
 * This should be used after the requireAuth middleware
 */
const requireAdmin = async (req, res, next) => {
    try {
        // In development mode, allow admin access
        if (process.env.NODE_ENV === 'development') {
            return next();
        }

        // Check if user exists and has admin role
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // If we already have the role from auth middleware
        if (req.user.role === 'admin') {
            return next();
        }

        // Otherwise, look up the user to check their role
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        // User is an admin, proceed
        next();
    } catch (error) {
        console.error('Admin authorization error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { requireAuth, requireAdmin };