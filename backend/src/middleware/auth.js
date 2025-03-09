const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
    });
}

// Middleware to verify Firebase token
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token, authorization denied' });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ error: 'Token is not valid' });
    }
};

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
    const adminEmails = ['adamtpang@gmail.com']; // Keep in sync with frontend
    if (!req.user || !adminEmails.includes(req.user.email)) {
        return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }
    next();
};

module.exports = {
    verifyToken,
    isAdmin
};