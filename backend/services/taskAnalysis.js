/**
 * Simple task analysis service
 *
 * This version supports two modes:
 * 1. Direct classification with simple rules
 * 2. Using Anthropic's Claude models via Replicate API
 */
const Replicate = require('replicate');
const dotenv = require('dotenv');
const { isValidUrl } = require('../utils/textUtils');

// Load environment variables
dotenv.config();

// Default model configuration - can be changed via .env
const DEFAULT_MODEL = "anthropic/claude-3.5-haiku";
const MODEL_CONFIG = {
    "anthropic/claude-3.5-haiku": {
        version: "20240307", // This needs to be updated as new versions are released
        maxTokens: 20
    },
    "anthropic/claude-3.7-sonnet": {
        version: "20240827",
        maxTokens: 10
    }
};

// Get model settings from env vars or use defaults
const REPLICATE_MODEL = process.env.REPLICATE_MODEL || DEFAULT_MODEL;
const MODEL_VERSION = process.env.REPLICATE_MODEL_VERSION || MODEL_CONFIG[REPLICATE_MODEL]?.version;
const MAX_TOKENS = process.env.REPLICATE_MAX_TOKENS || MODEL_CONFIG[REPLICATE_MODEL]?.maxTokens || 20;

// Initialize Replicate with API token if available
const replicate = process.env.REPLICATE_API_TOKEN
    ? new Replicate({ auth: process.env.REPLICATE_API_TOKEN })
    : null;

/**
 * Analyze a single task and classify it based on importance and urgency
 *
 * @param {string} task - The task to analyze
 * @returns {Object} - Classification result with importance and urgency flags
 */
async function analyzeTask(task) {
    // Check if Replicate API is available
    if (replicate && process.env.NODE_ENV === 'production') {
        try {
            return await analyzeWithReplicate(task);
        } catch (error) {
            console.error('Error with Replicate API, falling back to simple classification:', error);
            return simpleClassify(task);
        }
    }

    // Use simple classification as fallback or for development
    return simpleClassify(task);
}

/**
 * Analyze a task using Anthropic's Claude via Replicate
 *
 * @param {string} task - The task to analyze
 * @returns {Object} - Classification with importance and urgency flags
 */
async function analyzeWithReplicate(task) {
    try {
        const prompt = `Task: "${task}"

Classify this task using two simple questions:

1. Is this IMPORTANT? (Does it matter for long-term goals or wellbeing?)
   - Examples: Career tasks, health matters, securing valuables, financial planning

2. Is this URGENT? (Does it need immediate attention or have a deadline?)
   - Examples: Bills due soon, emergencies, deadlines

IMPORTANT GUIDELINES:
- Links/URLs should ALWAYS be considered IMPORTANT (but not urgent)
- Ideas worth sharing or tweeting should ALWAYS be considered IMPORTANT (but not urgent)
- Notes or content to save for later reference should be considered IMPORTANT (but not urgent)

Reply with only one of:
- "important_urgent" - if YES to both questions
- "important" - if YES to importance but NO to urgency
- "unimportant" - if NO to importance`;

        const input = {
            prompt: prompt,
            max_tokens: parseInt(MAX_TOKENS, 10),
            system_prompt: "You are a productivity assistant. Classify each task as 'important_urgent' (do now), 'important' (do next), or 'unimportant' (do never). Tasks involving personal security, documents, finances, wellbeing, links/URLs, and ideas worth sharing should be considered important."
        };

        // Create a prediction using the configured model
        const prediction = await replicate.predictions.create({
            version: `${REPLICATE_MODEL}:${MODEL_VERSION}`,
            input: input
        });

        // Wait for the prediction to complete
        const output = await replicate.wait(prediction);

        // Parse the output
        let category = '';
        if (output && output.output) {
            category = String(output.output).trim().toLowerCase();
        } else {
            category = String(output).trim().toLowerCase();
        }

        // Clean up the category
        category = category.replace(/^category:?\s*/i, '').trim();

        // Convert to the standard format
        if (category.includes('important_urgent')) {
            return { importance: 1, urgency: 1 };
        } else if (category.includes('important')) {
            return { importance: 1, urgency: 0 };
        } else {
            return { importance: 0, urgency: 0 };
        }
    } catch (error) {
        console.error(`Error analyzing with Replicate: ${error.message}`);
        throw error;
    }
}

/**
 * Simple rule-based classifier for tasks
 *
 * @param {string} task - The task to analyze
 * @returns {Object} - Classification with importance and urgency flags
 */
function simpleClassify(task) {
    // In development mode, we'll use a simple random classification
    // with a slight bias toward important and non-urgent tasks

    // Generate random importance with 60% chance of being important
    const isImportant = Math.random() < 0.6;

    // Generate random urgency with 30% chance of being urgent
    const isUrgent = Math.random() < 0.3;

    return {
        importance: isImportant ? 1 : 0,
        urgency: isUrgent ? 1 : 0
    };
}

/**
 * Analyze multiple tasks
 *
 * @param {Array} tasks - Array of tasks to analyze
 * @returns {Object} - Analysis results keyed by task
 */
async function analyzeTasks(tasks) {
    const results = {};
    for (const task of tasks) {
        try {
            // Simulate processing delay in development for better UX testing
            if (process.env.NODE_ENV === 'development') {
                await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));
            }

            const result = await analyzeTask(task);
            results[task] = {
                important: result.importance === 1,
                urgent: result.urgency === 1
            };
        } catch (error) {
            console.error(`Error analyzing task "${task}":`, error);
            results[task] = {
                important: false,
                urgent: false
            }; // Default to unimportant if analysis fails
        }
    }
    return results;
}

/**
 * Builds a prompt for analyzing a single task
 * @param {string} task - The task to analyze
 * @returns {string} The prompt for the AI model
 */
function buildTaskPrompt(task) {
    return `Analyze this note and decide if it's important and if it's urgent, for placement in an Eisenhower Matrix:

"${task}"

Answer two simple questions:
1. Is this important? (Things that contribute to long-term goals, well-being, or meaningful outcomes)
2. Is this urgent? (Things that require immediate attention or have deadlines)

URLs and creative ideas should be classified as important but not urgent.

Reply with ONLY a JSON object in this format:
{"importance": 0 or 1, "urgency": 0 or 1}`;
}

/**
 * Builds a prompt for analyzing multiple tasks at once
 * @param {Array<string>} tasks - Array of tasks to analyze
 * @returns {string} The prompt for the AI model
 */
function buildMultiTaskPrompt(tasks) {
    const tasksFormatted = tasks.map((task, index) =>
        `${index + 1}. "${task}"`
    ).join('\n');

    return `Analyze each note below and decide if it's important and if it's urgent, for placement in an Eisenhower Matrix:

${tasksFormatted}

For each note, answer two simple questions:
1. Is this important? (Things that contribute to long-term goals, well-being, or meaningful outcomes)
2. Is this urgent? (Things that require immediate attention or have deadlines)

URLs and creative ideas should be classified as important but not urgent.

Reply with ONLY a JSON object where the keys are the note numbers and the values contain importance and urgency:
{
  "1": {"importance": 0 or 1, "urgency": 0 or 1},
  "2": {"importance": 0 or 1, "urgency": 0 or 1},
  ...and so on
}`;
}

/**
 * Parses the AI response for a single task
 * @param {string} response - The AI model response
 * @returns {Object} Parsed result with importance and urgency
 */
function parseResponse(response) {
    try {
        // Extract JSON object from response
        const jsonMatch = response.match(/{.*}/s);
        if (!jsonMatch) {
            console.error('No JSON found in response:', response);
            return { importance: 0, urgency: 0 };
        }

        const jsonResponse = JSON.parse(jsonMatch[0]);
        return {
            importance: jsonResponse.importance,
            urgency: jsonResponse.urgency
        };
    } catch (error) {
        console.error('Error parsing response:', error, response);
        return { importance: 0, urgency: 0 };
    }
}

/**
 * Parses the AI response for multiple tasks
 * @param {string} response - The AI model response
 * @param {Array<string>} tasks - Original array of tasks
 * @returns {Object} Object with results for each task
 */
function parseMultiTaskResponse(response, tasks) {
    try {
        // Extract JSON object from response
        const jsonMatch = response.match(/{.*}/s);
        if (!jsonMatch) {
            console.error('No JSON found in response:', response);
            return { results: {} };
        }

        const jsonResponse = JSON.parse(jsonMatch[0]);
        const results = {};

        // Convert from numbered format to task-keyed format
        tasks.forEach((task, index) => {
            const taskNumber = (index + 1).toString();
            if (jsonResponse[taskNumber]) {
                results[task] = {
                    important: jsonResponse[taskNumber].importance === 1,
                    urgent: jsonResponse[taskNumber].urgency === 1
                };
            } else {
                // Default if missing
                results[task] = { important: false, urgent: false };
            }
        });

        return { results };
    } catch (error) {
        console.error('Error parsing multi-task response:', error, response);
        // Return empty results on error
        return { results: {} };
    }
}

/**
 * Utility function to determine if a task is a URL
 * Uses the imported isValidUrl function
 * @param {string} task - The task to check
 * @returns {boolean} True if the task is a URL
 */
function isTaskUrl(task) {
    return isValidUrl(task);
}

/**
 * Estimates token usage for a given text
 * This is a simple estimation (4 characters ≈ 1 token on average)
 * In production, you would get the actual token count from the API
 * @param {string} text - The text to estimate tokens for
 * @returns {number} Estimated token count
 */
function estimateTokens(text) {
    return Math.ceil(text.length / 4);
}

module.exports = {
    analyzeTasks,
    analyzeTask,
    isTaskUrl
};