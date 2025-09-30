const mongoose = require('mongoose');

/**
 * DailyUsage model
 * Tracks daily runs per user for free tier quota enforcement
 */
const dailyUsageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Store date as YYYY-MM-DD string for easy indexing
    date: {
        type: String,
        required: true
    },
    runs: {
        type: Number,
        default: 0
    },
    // For anonymous users (IP + cookie combo)
    anonymousId: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index for fast lookups
dailyUsageSchema.index({ userId: 1, date: 1 }, { unique: true, sparse: true });
dailyUsageSchema.index({ anonymousId: 1, date: 1 }, { sparse: true });
dailyUsageSchema.index({ date: 1 });

// Update timestamp on save
dailyUsageSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('DailyUsage', dailyUsageSchema);