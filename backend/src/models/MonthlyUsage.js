const mongoose = require('mongoose');

/**
 * MonthlyUsage model
 * Tracks monthly runs per user for paid tier soft-limit enforcement
 */
const monthlyUsageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Store month as YYYY-MM string for easy indexing
    month: {
        type: String,
        required: true
    },
    runs: {
        type: Number,
        default: 0
    },
    plan: {
        type: String,
        enum: ['free', 'light', 'pro'],
        default: 'free'
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
monthlyUsageSchema.index({ userId: 1, month: 1 }, { unique: true });
monthlyUsageSchema.index({ month: 1 });

// Update timestamp on save
monthlyUsageSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('MonthlyUsage', monthlyUsageSchema);