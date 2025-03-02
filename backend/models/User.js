const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
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
    // Lists for task storage
    list1: {
        type: Array,
        default: []
    },
    list2: {
        type: Array,
        default: []
    },
    list3: {
        type: Array,
        default: []
    },
    // Credits for AI task analysis
    credits: {
        type: Number,
        default: 100 // Start with 100 free credits
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', UserSchema);