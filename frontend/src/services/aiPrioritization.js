import axios from 'axios';
import { auth } from '../firebase-config';

// Use the environment variable for the base URL
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create an axios instance with the proper base URL
const aiAxiosInstance = axios.create({
    baseURL: baseURL.replace(/\/api$/, ''), // Remove '/api' if it exists at the end
    timeout: 30000, // 30 seconds timeout
    headers: {
        'Content-Type': 'application/json',
    }
});

// Add auth token to requests
aiAxiosInstance.interceptors.request.use(async (config) => {
    const user = auth.currentUser;
    if (user) {
        const token = await user.getIdToken();
        config.headers['x-auth-token'] = token;
    }
    return config;
});

// Progress tracking
let progressCallbacks = [];

// Add startTime to keep track of when the analysis started
let startTime = null;

/**
 * Register a callback to receive progress updates
 * @param {Function} callback - Function to call with progress updates
 * @returns {Function} Function to unregister the callback
 */
export const onProgressUpdate = (callback) => {
    if (typeof callback === 'function') {
        progressCallbacks.push(callback);
        return () => {
            progressCallbacks = progressCallbacks.filter(cb => cb !== callback);
        };
    }
    return () => { };
};

/**
 * Update progress and notify all registered callbacks
 *
 * @param {number} completed - Number of completed tasks
 * @param {number} total - Total number of tasks
 */
const updateProgress = (completed, total) => {
    // Initialize startTime when we start processing
    if (completed === 0 && total > 0) {
        startTime = Date.now();
    }

    const progress = {
        completed,
        total,
        percent: total > 0 ? Math.round((completed / total) * 100) : 0,
        startTime // Include startTime in the progress object
    };

    progressCallbacks.forEach(callback => {
        try {
            callback(progress);
        } catch (error) {
            console.error('Error in progress callback:', error);
        }
    });
};

/**
 * Analyze tasks using the AI service
 *
 * @param {Array} tasks - List of tasks to analyze
 * @returns {Object} Analysis results
 */
export const analyzeTasks = async (tasks) => {
    if (!tasks || tasks.length === 0) return {};

    // Reset progress
    updateProgress(0, tasks.length);

    // Use mock analysis in development mode
    if (import.meta.env.MODE === 'development') {
        return mockAnalysis(tasks);
    }

    try {
        // Process tasks in batches for better progress tracking
        const results = {};

        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];

            try {
                // Send task to backend for analysis
                const response = await aiAxiosInstance.post('/api/ai/analyze-task', { task });
                results[task] = response.data.result;
            } catch (error) {
                console.error(`Error analyzing task "${task}":`, error);
                results[task] = { important: false, urgent: false };
            }

            // Update progress
            updateProgress(i + 1, tasks.length);
        }

        return results;
    } catch (error) {
        console.error('Error analyzing tasks:', error);
        throw error;
    }
};

/**
 * Mock analysis for development testing
 *
 * @param {Array} tasks - List of tasks to analyze
 * @returns {Object} Mock analysis results
 */
const mockAnalysis = async (tasks) => {
    const results = {};

    // For each task, simulate processing and create mock results
    for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];

        // Simulate processing time (300-700ms)
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));

        // Check for special cases that should always be important
        // Looking for URLs/links and potentially tweetable ideas
        const containsURL = /https?:\/\/\S+/.test(task) ||
            /www\.\S+/.test(task) ||
            task.includes('.com') ||
            task.includes('.org') ||
            task.includes('.net');

        const isPotentiallyTweetable = task.length < 280 &&
            (task.startsWith('"') ||
                task.includes('idea:') ||
                task.includes('tweet') ||
                task.includes('share') ||
                /^[A-Z].*[.!?]$/.test(task)); // Complete thought

        // If this is a URL or tweetable idea, make it important but not urgent
        if (containsURL || isPotentiallyTweetable) {
            results[task] = {
                important: true,
                urgent: false
            };

            // Update progress
            updateProgress(i + 1, tasks.length);
            continue;
        }

        // Otherwise use a random distribution for the 2x2 matrix
        const rand = Math.random();
        let isImportant, isUrgent;

        if (rand < 0.25) {
            // Important + Urgent
            isImportant = true;
            isUrgent = true;
        } else if (rand < 0.5) {
            // Important + Not Urgent
            isImportant = true;
            isUrgent = false;
        } else if (rand < 0.75) {
            // Not Important + Urgent
            isImportant = false;
            isUrgent = true;
        } else {
            // Not Important + Not Urgent
            isImportant = false;
            isUrgent = false;
        }

        results[task] = {
            important: isImportant,
            urgent: isUrgent
        };

        // Update progress
        updateProgress(i + 1, tasks.length);
    }

    return results;
};

/**
 * Categorize tasks based on analysis
 *
 * @param {Array} tasks - Original tasks
 * @param {Object} analysis - Analysis results from AI
 * @returns {Object} Categorized tasks
 */
export const categorizeTasks = (tasks, analysis) => {
    const importantUrgent = [];
    const importantNotUrgent = [];
    const notImportantUrgent = [];
    const notImportantNotUrgent = [];

    tasks.forEach(task => {
        if (!task.trim()) return; // Skip empty tasks

        const result = analysis[task];
        if (!result) {
            // If no analysis, put in Not Important + Not Urgent by default
            notImportantNotUrgent.push(task);
            return;
        }

        if (result.important && result.urgent) {
            importantUrgent.push(task);
        } else if (result.important && !result.urgent) {
            importantNotUrgent.push(task);
        } else if (!result.important && result.urgent) {
            notImportantUrgent.push(task);
        } else {
            notImportantNotUrgent.push(task);
        }
    });

    return {
        importantUrgent,
        importantNotUrgent,
        notImportantUrgent,
        notImportantNotUrgent
    };
};
