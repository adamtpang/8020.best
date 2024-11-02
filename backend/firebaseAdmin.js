// firebaseAdmin.js

const admin = require('firebase-admin');

// Update the path to point to your JSON file
const serviceAccount = require('./config/firebaseServiceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
