/**
 * Script to check if required environment variables are properly configured
 *
 * Usage: node check-env.js
 *
 * This will verify that all required environment variables are set
 * and can be used to validate your setup after migration from JSON to env vars
 */

require('dotenv').config();

const requiredEnvVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
    'PORT',
    'MONGODB_URI'
];

// Optional env vars (won't fail if missing)
const optionalEnvVars = [
    'FIREBASE_DATABASE_URL',
    'OPENAI_API_KEY',
    'DEFAULT_USER_CREDITS',
    'ADMIN_USER_EMAIL'
];

console.log('\n=== Environment Variable Check ===\n');

// Check required variables
let missingVars = [];
requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        missingVars.push(varName);
        console.log(`❌ Missing required env var: ${varName}`);
    } else {
        // Mask the value for security, only show the first few characters
        const value = process.env[varName];
        const maskedValue = value.length > 8
            ? value.substring(0, 4) + '...' + value.substring(value.length - 4)
            : '****';
        console.log(`✅ Found required env var: ${varName} = ${maskedValue}`);
    }
});

// Check optional variables
console.log('\n--- Optional Variables ---');
optionalEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        console.log(`⚠️ Missing optional env var: ${varName}`);
    } else {
        // Mask the value for security
        const value = process.env[varName];
        const maskedValue = value.length > 8
            ? value.substring(0, 4) + '...' + value.substring(value.length - 4)
            : '****';
        console.log(`✅ Found optional env var: ${varName} = ${maskedValue}`);
    }
});

// Final verdict
if (missingVars.length > 0) {
    console.log('\n❌ Environment check failed! Missing required variables.');
    console.log('Please set them in your .env file or environment.');
    process.exit(1);
} else {
    console.log('\n✅ All required environment variables are set.');
    console.log('Your application should be able to connect to Firebase and other services.');
}