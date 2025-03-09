const admin = require('firebase-admin');

// Initialize Firebase Admin with environment variables
// This is recommended for production environments
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // The private key comes as a string with "\n" characters
        // We need to replace them with actual newlines
        privateKey: process.env.FIREBASE_PRIVATE_KEY
            ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
            : undefined
    })
});

module.exports = admin;