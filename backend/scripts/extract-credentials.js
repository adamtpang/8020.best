/**
 * Script to extract credentials from serviceAccountKey.json into environment variables format
 *
 * Usage: node extract-credentials.js
 *
 * This will read the serviceAccountKey.json file and output environment variable
 * declarations that you can copy into your .env file
 */

const fs = require('fs');
const path = require('path');

// Path to the service account key file
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

try {
    // Read and parse the service account key file
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    // Create the environment variable declarations
    const envVars = [
        `# Firebase/Google Cloud credentials extracted from serviceAccountKey.json`,
        `# Generated on ${new Date().toISOString()}`,
        ``,
        `FIREBASE_PROJECT_ID=${serviceAccount.project_id}`,
        `FIREBASE_CLIENT_EMAIL=${serviceAccount.client_email}`,
        `FIREBASE_PRIVATE_KEY="${serviceAccount.private_key.replace(/\n/g, '\\n')}"`,
        ``,
        `# If needed, here are additional fields from your serviceAccountKey.json:`,
        `# FIREBASE_TYPE=${serviceAccount.type}`,
        `# FIREBASE_PRIVATE_KEY_ID=${serviceAccount.private_key_id}`,
        `# FIREBASE_AUTH_URI=${serviceAccount.auth_uri}`,
        `# FIREBASE_TOKEN_URI=${serviceAccount.token_uri}`,
        `# FIREBASE_AUTH_PROVIDER_X509_CERT_URL=${serviceAccount.auth_provider_x509_cert_url}`,
        `# FIREBASE_CLIENT_X509_CERT_URL=${serviceAccount.client_x509_cert_url}`,
    ].join('\n');

    // Output the environment variables
    console.log('\n=== Environment Variables for .env file ===\n');
    console.log(envVars);
    console.log('\n=== Copy the variables above to your .env file ===\n');

    // Also write to a temporary file
    const outputPath = path.join(__dirname, '..', '.env.credentials');
    fs.writeFileSync(outputPath, envVars);
    console.log(`Variables have also been written to: ${outputPath}`);
    console.log('You can append them to your .env file with:');
    console.log(`cat ${outputPath} >> .env`);

} catch (error) {
    console.error('Error reading or parsing the service account file:');
    console.error(error);
    process.exit(1);
}