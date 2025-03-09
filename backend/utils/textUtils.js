/**
 * Utility functions for text processing
 */

/**
 * Validates if a string is a valid URL
 * @param {string} text - The text to check
 * @returns {boolean} True if the text is a valid URL
 */
function isValidUrl(text) {
    try {
        // Try to create a URL object
        const url = new URL(text);
        // Check if protocol is http or https
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (err) {
        // If URL constructor throws an error, it's not a valid URL
        return false;
    }
}

/**
 * Counts approximate token length of text
 * This is a rough estimate based on common tokenization patterns
 * @param {string} text - The text to estimate tokens for
 * @returns {number} Estimated number of tokens
 */
function estimateTokenCount(text) {
    if (!text) return 0;

    // Simple heuristic: ~4 characters per token on average
    return Math.ceil(text.length / 4);
}

/**
 * Determines if text is likely a tweetable idea
 * @param {string} text - The text to analyze
 * @returns {boolean} True if the text appears to be tweetable
 */
function isTweetable(text) {
    if (!text) return false;

    // Check if the text is shorter than typical tweet length
    return text.length <= 280;
}

module.exports = {
    isValidUrl,
    estimateTokenCount,
    isTweetable
};