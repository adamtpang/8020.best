import axiosInstance from "./api";

// Throttling mechanism
let throttleTimeout = null;
let lastAnalysisTime = 0;
const THROTTLE_WAIT = 2000; // 2 seconds

/**
 * Analyze tasks using the AI service with credit tracking
 *
 * @param {Array} tasks - List of tasks to analyze
 * @returns {Object} Analysis results and credit information
 */
export const analyzeTasks = async (tasks) => {
    if (!tasks || tasks.length === 0) return {};

    // Check if we need to throttle
    const now = Date.now();
    const timeElapsed = now - lastAnalysisTime;

    if (timeElapsed < THROTTLE_WAIT) {
        // Clear any existing timeout
        if (throttleTimeout) {
            clearTimeout(throttleTimeout);
        }

        // Wait for the remaining throttle time
        return new Promise((resolve) => {
            throttleTimeout = setTimeout(async () => {
                const result = await makeAnalysisRequest(tasks);
                resolve(result);
            }, THROTTLE_WAIT - timeElapsed);
        });
    }

    // No throttling needed, make the request immediately
    return makeAnalysisRequest(tasks);
};

/**
 * Make the actual API request for analysis
 *
 * @param {Array} tasks - List of tasks to analyze
 * @returns {Object} Analysis results and credit information
 */
const makeAnalysisRequest = async (tasks) => {
    try {
        lastAnalysisTime = Date.now();
        const token = localStorage.getItem('token');

        const response = await axiosInstance.post('/api/ai/analyze-tasks',
            { tasks },
            { headers: { 'x-auth-token': token } }
        );

        // Store credits info in localStorage for display
        if (response.data.credits) {
            localStorage.setItem('credits', response.data.credits.remaining);
        }

        return response.data.results;
    } catch (error) {
        console.error('Error analyzing tasks:', error);

        // Handle credit-related errors
        if (error.response && error.response.status === 403) {
            // Show credit purchase dialog
            localStorage.setItem('showCreditPurchase', 'true');
            localStorage.setItem('creditsNeeded', error.response.data.creditsNeeded);
        }

        throw error;
    }
};

/**
 * Categorize tasks based on analysis
 *
 * @param {Array} tasks - Original tasks
 * @param {Object} analysis - Analysis results from AI
 * @returns {Object} Categorized tasks
 */
export const categorizeTasks = (tasks, analysis) => {
    const important = [];
    const urgent = [];
    const regular = [];

    tasks.forEach(task => {
        const result = analysis[task];
        if (!result) {
            regular.push(task);
            return;
        }

        if (result.urgent) {
            urgent.push(task);
        } else if (result.important) {
            important.push(task);
        } else {
            regular.push(task);
        }
    });

    return { important, urgent, regular };
};
