/**
 * Enhanced task analysis service with improved AI models and classification
 *
 * Features:
 * 1. Better AI models (GPT-4, Claude-3.5-Sonnet)
 * 2. Improved prompts with examples and reasoning
 * 3. User context integration
 * 4. Confidence scoring
 * 5. Ensemble approach combining multiple methods
 */
const Replicate = require('replicate');
const dotenv = require('dotenv');
const { isValidUrl } = require('../utils/textUtils');

// Load environment variables
dotenv.config();

// Enhanced model configuration with better models
const DEFAULT_MODEL = "openai/gpt-4o-mini"; // Better default model
const MODEL_CONFIG = {
    "openai/gpt-4o-mini": {
        version: "latest",
        maxTokens: 300, // Increased for reasoning
        temperature: 0.1
    },
    "anthropic/claude-3-5-sonnet-20241022": {
        version: "latest",
        maxTokens: 400,
        temperature: 0.1
    },
    "meta/meta-llama-3.1-70b-instruct": {
        version: "latest",
        maxTokens: 250,
        temperature: 0.1
    },
    "openai/gpt-4-turbo": {
        version: "latest",
        maxTokens: 350,
        temperature: 0.1
    }
};

// Get model settings from env vars or use defaults
const REPLICATE_MODEL = process.env.REPLICATE_MODEL || DEFAULT_MODEL;
const MODEL_VERSION = process.env.REPLICATE_MODEL_VERSION || MODEL_CONFIG[REPLICATE_MODEL]?.version;
const MAX_TOKENS = process.env.REPLICATE_MAX_TOKENS || MODEL_CONFIG[REPLICATE_MODEL]?.maxTokens || 300;
const TEMPERATURE = process.env.REPLICATE_TEMPERATURE || MODEL_CONFIG[REPLICATE_MODEL]?.temperature || 0.1;

// Initialize Replicate with API token if available
const replicate = process.env.REPLICATE_API_TOKEN
    ? new Replicate({ auth: process.env.REPLICATE_API_TOKEN })
    : null;

const MODEL_ID = 'anthropic/claude-3.5-sonnet';

/**
 * Enhanced task analysis with ensemble approach
 *
 * @param {string} task - The task to analyze
 * @param {Object} userContext - Optional user context for better classification
 * @returns {Object} - Enhanced classification result with confidence and reasoning
 */
async function analyzeTask(task, userContext = {}) {
    // Run ensemble analysis combining multiple approaches
    const results = await Promise.allSettled([
        analyzeWithAI(task, userContext),
        analyzeWithRules(task, userContext),
        analyzeWithKeywords(task, userContext)
    ]);

    // Combine results using ensemble approach
    return combineEnsembleResults(results, task);
}

/**
 * AI-powered analysis with improved prompts and reasoning
 *
 * @param {string} task - The task to analyze
 * @param {Object} userContext - User context for personalized analysis
 * @returns {Object} - AI analysis result
 */
async function analyzeWithAI(task, userContext = {}) {
    // Check if Replicate API is available
    if (replicate && process.env.NODE_ENV === 'production') {
        try {
            return await analyzeWithReplicate(task, userContext);
        } catch (error) {
            console.error('Error with Replicate API, falling back to intelligent classification:', error);
            return intelligentClassify(task, userContext);
        }
    }

    // Use intelligent classification as fallback
    return intelligentClassify(task, userContext);
}

/**
 * Enhanced AI analysis using Replicate with improved prompts
 *
 * @param {string} task - The task to analyze
 * @param {Object} userContext - User context
 * @returns {Object} - Classification with importance, urgency, confidence, and reasoning
 */
async function analyzeWithReplicate(task, userContext = {}) {
    try {
        const prompt = buildEnhancedPrompt(task, userContext);

        const input = {
            prompt: prompt,
            max_tokens: parseInt(MAX_TOKENS, 10),
            temperature: parseFloat(TEMPERATURE),
            top_p: 0.9,
            system_prompt: "You are an expert productivity consultant specializing in the Eisenhower Decision Matrix."
        };

        // Create a prediction using the configured model
        const prediction = await replicate.predictions.create({
            version: `${REPLICATE_MODEL}:${MODEL_VERSION}`,
            input: input
        });

        // Wait for the prediction to complete
        const output = await replicate.wait(prediction);

        // Parse the enhanced output
        return parseEnhancedResponse(output, 'ai');

    } catch (error) {
        console.error(`Error analyzing with Replicate: ${error.message}`);
        throw error;
    }
}

/**
 * Rule-based classification using heuristics
 *
 * @param {string} task - The task to analyze
 * @param {Object} userContext - User context
 * @returns {Object} - Rule-based classification
 */
function analyzeWithRules(task, userContext = {}) {
    const taskLower = task.toLowerCase();
    let importance = 0;
    let urgency = 0;
    let confidence = 0.6; // Medium confidence for rule-based
    let reasoning = [];

    // Importance rules
    if (isValidUrl(task)) {
        importance = 1;
        confidence += 0.2;
        reasoning.push("Contains URL - knowledge to save");
    }

    // Keywords that indicate importance
    const importantKeywords = [
        'goal', 'project', 'learn', 'skill', 'health', 'finance', 'career',
        'relationship', 'education', 'investment', 'strategy', 'plan'
    ];

    if (importantKeywords.some(keyword => taskLower.includes(keyword))) {
        importance = 1;
        confidence += 0.1;
        reasoning.push("Contains important keywords");
    }

    // Urgency rules
    const urgentKeywords = [
        'deadline', 'due', 'urgent', 'asap', 'emergency', 'immediately',
        'today', 'tomorrow', 'tonight', 'overdue', 'expires'
    ];

    if (urgentKeywords.some(keyword => taskLower.includes(keyword))) {
        urgency = 1;
        confidence += 0.2;
        reasoning.push("Contains urgency indicators");
    }

    // Date patterns indicating urgency
    const datePatterns = [
        /\b(today|tomorrow|tonight)\b/i,
        /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
        /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/, // MM/dd/yyyy
        /\b\d{1,2}-\d{1,2}-\d{2,4}\b/   // MM-dd-yyyy
    ];

    if (datePatterns.some(pattern => pattern.test(task))) {
        urgency = 1;
        confidence += 0.15;
        reasoning.push("Contains date/time references");
    }

    // Low importance indicators
    const lowImportanceKeywords = [
        'maybe', 'someday', 'whenever', 'random', 'browse', 'scroll',
        'social media', 'facebook', 'instagram', 'tiktok'
    ];

    if (lowImportanceKeywords.some(keyword => taskLower.includes(keyword))) {
        importance = 0;
        confidence += 0.1;
        reasoning.push("Contains low-importance indicators");
    }

    return {
        importance,
        urgency,
        confidence: Math.min(confidence, 1.0),
        reasoning: reasoning.join('; '),
        method: 'rules'
    };
}

/**
 * Keyword-based analysis for specific domains
 *
 * @param {string} task - The task to analyze
 * @param {Object} userContext - User context
 * @returns {Object} - Keyword-based classification
 */
function analyzeWithKeywords(task, userContext = {}) {
    const taskLower = task.toLowerCase();
    let importance = 0;
    let urgency = 0;
    let confidence = 0.4; // Lower confidence for keyword-only
    let reasoning = [];

    // Professional/Career importance
    if (/\b(work|job|career|interview|meeting|presentation|deadline|client|boss)\b/i.test(task)) {
        importance = 1;
        confidence += 0.2;
        reasoning.push("Professional/career related");
    }

    // Health importance
    if (/\b(doctor|health|medical|appointment|exercise|diet|mental health)\b/i.test(task)) {
        importance = 1;
        confidence += 0.2;
        reasoning.push("Health related");
    }

    // Financial importance
    if (/\b(pay|bill|tax|invoice|budget|investment|debt|loan|money)\b/i.test(task)) {
        importance = 1;
        confidence += 0.2;
        reasoning.push("Financial matter");
    }

    // Time-sensitive urgency
    if (/\b(expires?|deadline|due|overdue|late|urgent|asap|now)\b/i.test(task)) {
        urgency = 1;
        confidence += 0.3;
        reasoning.push("Time-sensitive language");
    }

    // Creative/Learning (important but not urgent)
    if (/\b(idea|creative|learn|study|read|research|course|skill)\b/i.test(task)) {
        importance = 1;
        urgency = 0;
        confidence += 0.1;
        reasoning.push("Learning/creative development");
    }

    return {
        importance,
        urgency,
        confidence: Math.min(confidence, 1.0),
        reasoning: reasoning.join('; ') || 'Keyword-based analysis',
        method: 'keywords'
    };
}

/**
 * Combine results from ensemble methods
 *
 * @param {Array} results - Results from different analysis methods
 * @param {string} task - Original task for fallback
 * @returns {Object} - Combined result with confidence
 */
function combineEnsembleResults(results, task) {
    const validResults = results
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);

    if (validResults.length === 0) {
        // Fallback to simple classification
        return intelligentClassify(task);
    }

    // Weighted voting system
    let importanceScore = 0;
    let urgencyScore = 0;
    let totalWeight = 0;
    let allReasoning = [];
    let maxConfidence = 0;

    validResults.forEach(result => {
        // Give extra weight to methods that provide specific reasoning (not just "General classification")
        let weight = result.confidence || 0.5;

        if (result.reasoning &&
            !result.reasoning.includes('General classification') &&
            !result.reasoning.includes('Keyword-based analysis')) {
            weight *= 1.5; // 50% bonus for specific reasoning
        }

        importanceScore += result.importance * weight;
        urgencyScore += result.urgency * weight;
        totalWeight += weight;

        if (result.reasoning) {
            allReasoning.push(`${result.method}: ${result.reasoning}`);
        }

        maxConfidence = Math.max(maxConfidence, result.confidence || 0.5);
    });

    // Lower threshold since we now have weighted voting
    const finalImportance = totalWeight > 0 ? (importanceScore / totalWeight) >= 0.4 ? 1 : 0 : 0;
    const finalUrgency = totalWeight > 0 ? (urgencyScore / totalWeight) >= 0.4 ? 1 : 0 : 0;

    return {
        importance: finalImportance,
        urgency: finalUrgency,
        confidence: maxConfidence,
        reasoning: allReasoning.join(' | '),
        methods_used: validResults.map(r => r.method).join(', '),
        ensemble_score: {
            importance_raw: totalWeight > 0 ? importanceScore / totalWeight : 0,
            urgency_raw: totalWeight > 0 ? urgencyScore / totalWeight : 0
        }
    };
}

/**
 * Build enhanced prompt with examples and user context
 *
 * @param {string} task - The task to analyze
 * @param {Object} userContext - User context
 * @returns {string} - Enhanced prompt
 */
function buildEnhancedPrompt(task, userContext = {}) {
    const contextInfo = userContext.goals ? `User's current goals: ${userContext.goals.join(', ')}\n` : '';
    const timeContext = userContext.currentTime ? `Current time context: ${userContext.currentTime}\n` : '';

    return `You are an expert in the Eisenhower Decision Matrix for productivity management.

${contextInfo}${timeContext}

DEFINITIONS:
IMPORTANT = contributes to long-term goals, personal growth, meaningful outcomes, prevents future problems
URGENT = has specific deadline, immediate consequences, becomes worse if delayed

EXAMPLES:
- "Learn Python programming" → Important: YES (skill development), Urgent: NO (no deadline)
- "Pay credit card bill due tomorrow" → Important: YES (financial), Urgent: YES (deadline)
- "Check Instagram" → Important: NO (low value), Urgent: NO (no consequences)
- "Doctor called about test results" → Important: YES (health), Urgent: YES (needs response)
- "https://interesting-article.com" → Important: YES (knowledge), Urgent: NO (can read later)
- "Brainstorm ideas for side project" → Important: YES (growth), Urgent: NO (creative work)

ANALYZE THIS TASK: "${task}"

Consider:
1. Does this align with meaningful long-term goals or well-being?
2. Are there specific time constraints or immediate consequences?
3. What happens if this task is delayed by a week?

Respond with JSON only:
{
  "important": true/false,
  "urgent": true/false,
  "confidence": 0.1-1.0,
  "reasoning": "brief explanation of your decision"
}`;
}

/**
 * Parse enhanced AI response with confidence and reasoning
 *
 * @param {string|Object} response - AI response
 * @param {string} method - Method used for analysis
 * @returns {Object} - Parsed result
 */
function parseEnhancedResponse(response, method = 'ai') {
    try {
        let responseText = '';

        if (typeof response === 'object' && response.output) {
            responseText = Array.isArray(response.output) ? response.output.join('') : response.output;
        } else {
            responseText = String(response);
        }

        // Extract JSON from response
        const jsonMatch = responseText.match(/{[\s\S]*}/);
        if (!jsonMatch) {
            console.error('No JSON found in response:', responseText);
            return { importance: 0, urgency: 0, confidence: 0.3, reasoning: 'Failed to parse response', method };
        }

        const parsed = JSON.parse(jsonMatch[0]);

        return {
            importance: parsed.important ? 1 : 0,
            urgency: parsed.urgent ? 1 : 0,
            confidence: parsed.confidence || 0.7,
            reasoning: parsed.reasoning || 'AI analysis',
            method: method
        };

    } catch (error) {
        console.error('Error parsing enhanced response:', error, response);
        return {
            importance: 0,
            urgency: 0,
            confidence: 0.2,
            reasoning: 'Parse error',
            method: method
        };
    }
}

/**
 * Intelligent rule-based classifier (improved fallback)
 *
 * @param {string} task - The task to analyze
 * @param {Object} userContext - User context
 * @returns {Object} - Classification with reasoning
 */
function intelligentClassify(task, userContext = {}) {
    const taskLower = task.toLowerCase();
    let importance = 0;
    let urgency = 0;
    let confidence = 0.5;
    let reasoning = [];

    // High-importance patterns
    if (isValidUrl(task)) {
        importance = 1;
        reasoning.push("URL/link - knowledge resource");
        confidence += 0.2;
    }

    // Creative content (important, not urgent)
    if (task.match(/^["'].*["']$/) ||
        taskLower.includes('idea') ||
        taskLower.includes('brainstorm') ||
        taskLower.includes('write') ||
        taskLower.includes('create') ||
        taskLower.includes('book') ||
        taskLower.includes('article') ||
        taskLower.includes('blog') ||
        taskLower.includes('project')) {
        importance = 1;
        urgency = 0;
        reasoning.push("Creative/project work");
        confidence += 0.2;
    }

    // Health, finance, career (usually important)
    if (/\b(health|doctor|finance|pay|bill|work|career|job|tax|taxes|money|budget|investment|insurance|medical|appointment)\b/i.test(task)) {
        importance = 1;
        reasoning.push("Health/finance/career matter");
        confidence += 0.2;
    }

    // Urgency indicators
    if (/\b(today|tomorrow|urgent|deadline|due|asap|now)\b/i.test(task)) {
        urgency = 1;
        reasoning.push("Contains urgency indicators");
        confidence += 0.2;
    }

    // Low importance indicators
    if (/\b(maybe|someday|social media|browse|scroll)\b/i.test(task)) {
        importance = 0;
        reasoning.push("Low-priority activity");
        confidence += 0.1;
    }

    // Household/maintenance tasks (not important but could be urgent)
    if (/\b(dishes|clean|laundry|vacuum|trash|garbage|wash|tidy|organize|chores)\b/i.test(task)) {
        importance = 0;
        urgency = 1;
        confidence += 0.2;
        reasoning.push("Household maintenance task");
    }

    // If no specific reasoning was found, apply default logic
    if (reasoning.length === 0) {
        // Better default bias toward important tasks
        importance = Math.random() < 0.6 ? 1 : 0; // 60% chance of important
        urgency = Math.random() < 0.3 ? 1 : 0;    // 30% chance of urgent
        confidence = 0.4;
        reasoning.push("General classification");
    }

    return {
        importance,
        urgency,
        confidence: Math.min(confidence, 1.0),
        reasoning: reasoning.join('; '),
        method: 'intelligent'
    };
}

/**
 * Analyze multiple tasks with enhanced features
 *
 * @param {Array} tasks - Array of tasks to analyze
 * @param {Object} userContext - User context for all tasks
 * @returns {Object} - Analysis results keyed by task
 */
async function analyzeTasks(tasks, userContext = {}) {
    const results = {};

    // Process tasks in parallel for better performance
    const analysisPromises = tasks.map(async (task) => {
        try {
            // Simulate processing delay in development for better UX testing
            if (process.env.NODE_ENV === 'development') {
                await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));
            }

            const result = await analyzeTask(task, userContext);
            return { task, result };
        } catch (error) {
            console.error(`Error analyzing task "${task}":`, error);
            return {
                task,
                result: {
                    importance: 0,
                    urgency: 0,
                    confidence: 0.1,
                    reasoning: 'Analysis failed',
                    method: 'error'
                }
            };
        }
    });

    const analysisResults = await Promise.allSettled(analysisPromises);

    analysisResults.forEach(promiseResult => {
        if (promiseResult.status === 'fulfilled') {
            const { task, result } = promiseResult.value;
            results[task] = {
                important: result.importance === 1,
                urgent: result.urgency === 1,
                confidence: result.confidence,
                reasoning: result.reasoning,
                methods_used: result.methods_used,
                ensemble_score: result.ensemble_score
            };
        }
    });

    return results;
}

/**
 * Utility function to determine if a task is a URL
 * @param {string} task - The task to check
 * @returns {boolean} True if the task is a URL
 */
function isTaskUrl(task) {
    return isValidUrl(task);
}

/**
 * Estimates token usage for a given text
 * @param {string} text - The text to estimate tokens for
 * @returns {number} Estimated token count
 */
function estimateTokens(text) {
    return Math.ceil(text.length / 4);
}

function buildImpactPrompt(task, userContext = {}) {
    const contextInfo = userContext.goals ? `User's current goals: ${userContext.goals.join(', ')}\n` : '';

    return `You are a ruthless productivity expert guided by the 80/20 principle. Your challenge is to evaluate a task and determine its potential impact on generating meaningful results. Not all tasks are created equal.

Ask yourself these questions about the task:
- Which tasks, if completed, will create the biggest positive impact on my goals or well-being?
- Which tasks unlock or simplify many others?
- If I did only one task today, which would make me feel the most accomplished?
- Which tasks align with my highest priorities and values?

Based on this, score the following task on a scale from 0 (no impact) to 100 (highest possible impact).

${contextInfo}
Task: "${task}"

Respond with JSON only, providing a score and brief reasoning.
{
  "impact_score": <0-100>,
  "reasoning": "Your reasoning here."
}`;
}

/**
 * Parses the AI response for impact score
 * @param {string|Object} response - The AI model response
 * @returns {Object} Parsed result with impact_score and reasoning
 */
function parseImpactResponse(response, method = 'ai') {
    try {
        let responseText = '';

        if (typeof response === 'object' && response.output) {
            responseText = Array.isArray(response.output) ? response.output.join('') : response.output;
        } else {
            responseText = String(response);
        }

        const jsonMatch = responseText.match(/{[\s\S]*}/);
        if (!jsonMatch) {
            console.error('No JSON found in AI response:', responseText);
            return { impact_score: 0, reasoning: 'Failed to parse response', method };
        }

        const parsed = JSON.parse(jsonMatch[0]);

        return {
            impact_score: parsed.impact_score || 0,
            reasoning: parsed.reasoning || 'AI analysis',
            method: method
        };

    } catch (error) {
        console.error('Error parsing impact response:', error, response);
        return {
            impact_score: 0,
            reasoning: 'Parse error',
            method: method
        };
    }
}

async function analyzeTaskWithImpact(task, userContext = {}) {
    if (replicate && process.env.NODE_ENV === 'production') {
        try {
            const prompt = buildImpactPrompt(task, userContext);
            const input = {
                prompt: prompt,
                max_tokens: parseInt(MAX_TOKENS, 10),
                temperature: parseFloat(TEMPERATURE),
                top_p: 0.9,
                system_prompt: "You are an 80/20 productivity expert. Your role is to score tasks by impact, not just classify them."
            };

            const prediction = await replicate.predictions.create({
                version: `${REPLICATE_MODEL}:${MODEL_VERSION}`,
                input: input
            });

            const output = await replicate.wait(prediction);
            return parseImpactResponse(output, 'ai');
        } catch (error) {
            console.error(`Replicate API error for task "${task}":`, error);
            // Fallback to intelligent analysis on API error
            return intelligentImpactAnalysis(task, userContext);
        }
    }

    // Default to intelligent analysis in development or if Replicate is not configured
    return intelligentImpactAnalysis(task, userContext);
}

function intelligentImpactAnalysis(task, userContext = {}) {
    const taskLower = task.toLowerCase();
    let score = 20; // Base score for any task
    let reasoning = ['General Task'];

    // High impact keywords
    const highImpact = ['strategy', 'plan', 'foundation', 'launch', 'release', 'publish', 'finalise', 'goals', 'growth', 'revenue', 'critical'];
    if (highImpact.some(k => taskLower.includes(k))) {
        score += 40;
        reasoning.push('High-impact strategic keyword');
    }

    // Creative / Project work
    const creative = ['write', 'create', 'book', 'article', 'project', 'design', 'build'];
    if (creative.some(k => taskLower.includes(k))) {
        score += 25;
        reasoning.push('Creative or project-based work');
    }

    // Financial / Health / Career
    const personal = ['tax', 'taxes', 'money', 'budget', 'health', 'doctor', 'career', 'learn', 'skill'];
    if (personal.some(k => taskLower.includes(k))) {
        score += 20;
        reasoning.push('Related to personal finance, health, or growth');
    }

    // Low impact keywords
    const lowImpact = ['maybe', 'someday', 'browse', 'scroll', 'social media', 'check', 'organize', 'clean', 'dishes'];
    if (lowImpact.some(k => taskLower.includes(k))) {
        score -= 15;
        reasoning.push('Lower-impact or maintenance task');
    }

    // URL is usually for research/learning
    if (isValidUrl(task)) {
        score += 15;
        reasoning.push('Contains a URL, likely for learning or research');
    }

    // Clean up default reasoning if others were added
    if (reasoning.length > 1) {
        reasoning = reasoning.slice(1);
    }

    return {
        impact_score: Math.max(0, Math.min(100, score)),
        reasoning: reasoning.join(', '),
        method: 'intelligent_fallback'
    };
}

async function streamAnalysis(tasks, userPriorities = null) {
    // Create context-aware prompt based on user's life priorities
    let priorityContext = '';
    if (userPriorities && userPriorities.trim()) {
        priorityContext = `\n\nUser's Life Priorities (use these to determine task importance):
${userPriorities}

When analyzing tasks, consider how each task aligns with these personal priorities. Tasks that directly support these priorities should be considered higher impact.`;
    }

    const prompt = `You are an expert in the 80/20 principle. Your goal is to analyze a list of tasks and determine their impact.${priorityContext}

Here is the list of tasks:
${tasks.map(t => `- ${t}`).join('\n')}

For each task, assign an "impact_score" from 0 to 100 based on its potential for high impact${userPriorities ? ' and alignment with the user\'s life priorities' : ''} and provide brief "reasoning".

Return the output as a stream of individual, newline-separated JSON objects. Each object must have three keys: "task", "impact_score", and "reasoning". Do not include them in a list, and do not add any other text, explanations, or markdown.

Start streaming the JSON objects immediately.

Example of a chunk in the stream:
{"task": "Write a book", "impact_score": 95, "reasoning": "High long-term value and personal fulfillment."}
`;

    try {
        const tokenLimit = Math.max(8192, tasks.length * 50);
        console.log(`Starting stream from Replicate with model ${MODEL_ID}...`);
        console.log(`Processing ${tasks.length} tasks with ${tokenLimit} token limit`);
        const stream = await replicate.stream(MODEL_ID, {
            input: {
                prompt: prompt,
                max_tokens: tokenLimit,
            }
        });
        return stream;
    } catch (error) {
        console.error('Error starting Replicate stream:', error);
        throw new Error('Failed to start analysis stream with Replicate AI.');
    }
}

module.exports = {
    analyzeTasks,
    analyzeTask,
    isTaskUrl,
    analyzeWithRules,
    analyzeWithKeywords,
    intelligentClassify,
    analyzeTaskWithImpact,
    intelligentImpactAnalysis,
    streamAnalysis
};