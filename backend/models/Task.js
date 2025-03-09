const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    tasks: {
        list1: {
            type: [String],
            default: []
        },
        list2: {
            type: [String],
            default: []
        },
        list3: {
            type: [String],
            default: []
        }
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Create a compound index for faster queries
taskSchema.index({ userId: 1, lastUpdated: -1 });

module.exports = mongoose.model('Task', taskSchema);