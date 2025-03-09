const mongoose = require('mongoose');

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        default: function () {
            // In development mode, provide a default name
            if (isDevelopment && !this.name && this.email) {
                return this.email.split('@')[0] || 'Firebase User';
            }
            return undefined; // Let validation handle it in production
        }
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        default: function () {
            // In development mode, provide a default email
            if (isDevelopment && !this.email && this.firebaseUid) {
                return `${this.firebaseUid}@example.com`;
            }
            return undefined; // Let validation handle it in production
        }
    },
    password: {
        type: String,
        // Only require password if no firebaseUid is provided
        required: function () {
            return !this.firebaseUid;
        },
        default: function () {
            // In development mode, provide a default password
            if (isDevelopment && !this.password && this.firebaseUid) {
                // Just a placeholder - this isn't secure but it's only for development
                return 'firebase-auth-user';
            }
            return undefined; // Let validation handle it in production
        }
    },
    firebaseUid: {
        type: String,
        unique: true,
        sparse: true
    },
    hasPurchased: {
        type: Boolean,
        default: false
    },
    purchaseDate: {
        type: Date,
        default: null
    },
    stripeSessionId: {
        type: String,
        default: null
    },
    credits: {
        type: Number,
        default: 0
    },
    taskLists: {
        regular: [String],
        important: [String],
        urgent: [String]
    },
    lastSynced: {
        type: Date,
        default: null
    },
    registeredAt: {
        type: Date,
        default: Date.now
    },
    // API usage tracking
    apiUsage: {
        replicate: {
            totalCalls: {
                type: Number,
                default: 0
            },
            totalTokens: {
                type: Number,
                default: 0
            },
            totalLines: {
                type: Number,
                default: 0
            },
            lastUsed: {
                type: Date,
                default: null
            }
        }
    },
    // User limits and restrictions
    apiLimits: {
        isRestricted: {
            type: Boolean,
            default: false
        },
        maxDailyLines: {
            type: Number,
            default: 1000 // Default limit of 1000 lines per day
        },
        maxMonthlyTokens: {
            type: Number,
            default: 100000 // Default limit of 100K tokens per month
        }
    },
    // Role for admin access
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    }
});

module.exports = mongoose.model('User', UserSchema);