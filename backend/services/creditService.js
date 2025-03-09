const User = require('../models/User');

/**
 * Check if a user has sufficient credits for an operation
 * @param {string} userId - User ID
 * @param {number} requiredCredits - Number of credits required for the operation
 * @returns {Promise<boolean>} - Whether the user has sufficient credits
 */
const hasEnoughCredits = async (userId, requiredCredits = 1) => {
    try {
        // If userId is an object with _id property, use that (for compatibility with Mongoose documents)
        const id = userId._id ? userId._id : userId;

        const user = await User.findById(id);
        if (!user) {
            throw new Error('User not found');
        }

        return (user.credits || 0) >= requiredCredits;
    } catch (error) {
        console.error('Error checking credits:', error);
        return false;
    }
};

/**
 * Deduct credits from a user's account
 * @param {string} userId - User ID
 * @param {number} amount - Number of credits to deduct
 * @returns {Promise<number>} - Remaining credits after deduction
 */
const deductCredits = async (userId, amount = 1) => {
    try {
        // If userId is an object with _id property, use that (for compatibility with Mongoose documents)
        const id = userId._id ? userId._id : userId;

        const user = await User.findByIdAndUpdate(
            id,
            { $inc: { credits: -amount } },
            { new: true }
        );

        if (!user) {
            throw new Error('User not found');
        }

        return user.credits;
    } catch (error) {
        console.error('Error deducting credits:', error);
        throw error;
    }
};

/**
 * Add credits to a user's account
 * @param {string} userId - User ID
 * @param {number} amount - Number of credits to add
 * @returns {Promise<number>} - New credit balance
 */
const addCredits = async (userId, amount) => {
    try {
        // If userId is an object with _id property, use that (for compatibility with Mongoose documents)
        const id = userId._id ? userId._id : userId;

        const user = await User.findByIdAndUpdate(
            id,
            { $inc: { credits: amount } },
            { new: true }
        );

        if (!user) {
            throw new Error('User not found');
        }

        return user.credits;
    } catch (error) {
        console.error('Error adding credits:', error);
        throw error;
    }
};

/**
 * Get a user's current credit balance
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Current credit balance
 */
const getCredits = async (userId) => {
    try {
        // If userId is an object with _id property, use that (for compatibility with Mongoose documents)
        const id = userId._id ? userId._id : userId;

        const user = await User.findById(id);
        if (!user) {
            throw new Error('User not found');
        }

        return user.credits || 0;
    } catch (error) {
        console.error('Error getting credits:', error);
        throw error;
    }
};

module.exports = {
    hasEnoughCredits,
    deductCredits,
    addCredits,
    getCredits
};