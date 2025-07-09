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
    credits: {
        type: Number,
        default: 500 // $5 worth of credits (500 = $5 at $0.01 per credit)
    },
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
        }
    },
    selectedModel: {
        type: String,
        default: 'claude-3.5-sonnet',
        enum: ['claude-3.5-sonnet', 'gpt-4o-mini', 'llama-3.1-70b']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastUsed: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);