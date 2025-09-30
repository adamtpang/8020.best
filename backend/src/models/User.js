const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    uid: {
        type: String,
        required: true,
        unique: true
    },
    displayName: {
        type: String
    },
    authProvider: {
        type: String,
        enum: ['google', 'github', 'firebase', 'local'],
        default: 'firebase'
    },
    // Profile info
    profilePicture: {
        type: String,
        default: null
    },
    // Credits system
    credits: {
        type: Number,
        default: 1000 // New users get 1000 free credits
    },
    totalCreditsUsed: {
        type: Number,
        default: 0
    },
    totalCreditsEarned: {
        type: Number,
        default: 1000 // Track initial credits
    },
    // Account type & Pricing Plan
    accountType: {
        type: String,
        enum: ['free', 'premium', 'master'],
        default: 'free'
    },
    isMasterAccount: {
        type: Boolean,
        default: false
    },
    // Pricing plan: 'free' (5/month), 'paid' ($5/mo unlimited)
    plan: {
        type: String,
        enum: ['free', 'paid'],
        default: 'free'
    },
    planStartedAt: {
        type: Date,
        default: null
    },
    planRenewsAt: {
        type: Date,
        default: null
    },
    stripeCustomerId: {
        type: String,
        default: null
    },
    stripeSubscriptionId: {
        type: String,
        default: null
    },
    // Life priorities - the key feature for persistent storage
    lifePriorities: {
        priority1: {
            type: String,
            default: ''
        },
        priority2: {
            type: String,
            default: ''
        },
        priority3: {
            type: String,
            default: ''
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    },
    // App preferences
    selectedModel: {
        type: String,
        default: 'claude-3.5-sonnet',
        enum: ['claude-3.5-sonnet', 'gpt-4o-mini', 'llama-3.1-70b']
    },
    theme: {
        type: String,
        enum: ['light', 'dark', 'auto'],
        default: 'dark'
    },
    // Usage tracking
    usage: {
        totalAnalyses: {
            type: Number,
            default: 0
        },
        lastAnalysisDate: {
            type: Date,
            default: null
        },
        monthlyAnalyses: {
            type: Number,
            default: 0
        },
        monthlyResetDate: {
            type: Date,
            default: Date.now
        }
    },
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastUsed: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date,
        default: Date.now
    }
});

// Methods
userSchema.methods.hasUnlimitedCredits = function() {
    return this.isMasterAccount || this.email === 'adamtpangelinan@gmail.com';
};

userSchema.methods.canPerformAnalysis = function(creditCost = 10) {
    return this.hasUnlimitedCredits() || this.credits >= creditCost;
};

userSchema.methods.deductCredits = function(amount = 10) {
    if (this.hasUnlimitedCredits()) {
        return true; // No deduction for master accounts
    }
    if (this.credits >= amount) {
        this.credits -= amount;
        this.totalCreditsUsed += amount;
        return true;
    }
    return false;
};

userSchema.methods.addCredits = function(amount) {
    this.credits += amount;
    this.totalCreditsEarned += amount;
};

userSchema.methods.getPrioritiesText = function() {
    const priorities = [];
    if (this.lifePriorities.priority1) priorities.push(`1. ${this.lifePriorities.priority1}`);
    if (this.lifePriorities.priority2) priorities.push(`2. ${this.lifePriorities.priority2}`);
    if (this.lifePriorities.priority3) priorities.push(`3. ${this.lifePriorities.priority3}`);
    return priorities.length > 0 ? priorities.join('\n') : null;
};

userSchema.methods.hasPriorities = function() {
    return !!(this.lifePriorities.priority1 || this.lifePriorities.priority2 || this.lifePriorities.priority3);
};

userSchema.methods.resetMonthlyUsage = function() {
    const now = new Date();
    const resetDate = this.usage.monthlyResetDate;
    const monthDiff = (now.getFullYear() - resetDate.getFullYear()) * 12 + (now.getMonth() - resetDate.getMonth());
    
    if (monthDiff >= 1) {
        this.usage.monthlyAnalyses = 0;
        this.usage.monthlyResetDate = now;
    }
};

module.exports = mongoose.model('User', userSchema);