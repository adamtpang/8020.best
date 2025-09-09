#!/usr/bin/env node

/**
 * Master Account Setup Script
 * 
 * This script sets up a master account with unlimited credits.
 * Run with: node scripts/setup-master-account.js <email>
 * 
 * Example: node scripts/setup-master-account.js adamtpangelinan@gmail.com
 */

require('dotenv').config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
});

const mongoose = require('mongoose');
const User = require('../src/models/User');

async function setupMasterAccount(email) {
    if (!email) {
        console.error('Error: Please provide an email address');
        console.log('Usage: node scripts/setup-master-account.js <email>');
        process.exit(1);
    }

    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB successfully');

        // Find or create the user
        let user = await User.findOne({ email });
        
        if (user) {
            console.log(`User found: ${user.email}`);
            
            // Update existing user to master account
            user.accountType = 'master';
            user.isMasterAccount = true;
            user.credits = 999999; // Set high credit count for visual purposes
            
            await user.save();
            console.log(`✅ Successfully upgraded ${email} to master account!`);
        } else {
            // Create new master user
            console.log(`User not found. Creating new master account for ${email}...`);
            
            user = new User({
                email,
                uid: `master-${Date.now()}`, // Temporary UID, will be updated on first login
                displayName: email.split('@')[0],
                accountType: 'master',
                isMasterAccount: true,
                credits: 999999,
                authProvider: 'firebase'
            });

            await user.save();
            console.log(`✅ Successfully created master account for ${email}!`);
        }

        // Display account details
        console.log('\n📊 Account Details:');
        console.log(`   Email: ${user.email}`);
        console.log(`   Account Type: ${user.accountType}`);
        console.log(`   Master Account: ${user.isMasterAccount ? '✅ Yes' : '❌ No'}`);
        console.log(`   Credits: ${user.credits.toLocaleString()}`);
        console.log(`   Created: ${user.createdAt.toISOString()}`);
        
        console.log('\n🎉 Master account setup complete!');
        console.log('   • This account now has unlimited credits');
        console.log('   • All credit checks will be bypassed');
        console.log('   • Perfect for development and testing');

    } catch (error) {
        console.error('❌ Error setting up master account:', error);
        process.exit(1);
    } finally {
        // Close the database connection
        await mongoose.connection.close();
        console.log('Database connection closed.');
    }
}

// Get email from command line arguments
const email = process.argv[2];
setupMasterAccount(email);