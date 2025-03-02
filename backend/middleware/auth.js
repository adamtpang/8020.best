const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware for protecting routes
 * Uses JSON Web Tokens to verify user identity
 */
module.exports = async function (req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if no token
    if (!token) {
        return res.status(401).json({ error: 'No token, authorization denied' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user by ID
        const user = await User.findById(decoded.user.id);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Add user to request object
        req.user = decoded.user;
        next();
    } catch (err) {
        console.error('Auth middleware error:', err.message);
        res.status(401).json({ error: 'Token is not valid' });
    }
};