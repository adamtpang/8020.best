const replicate = require('replicate');
const AsyncLock = require('async-lock');

// Rate limiter using async-lock
const lock = new AsyncLock();

async function analyzeTask(task, retries = 5) {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            // Use async-lock to limit concurrent API calls
            return await lock.acquire('api', async () => {
                const prompt = `Task: ${task}

Analyze this task carefully and categorize it as ONE of:
- important_urgent (critical tasks that need immediate attention)
- important (valuable tasks that contribute to long-term goals)
- unimportant (tasks that can be eliminated)

Consider:
- Important = high value, impacts goals, meaningful outcome
- Urgent = time-sensitive, needs immediate attention
Answer with ONLY the category name.`;

                const input = {
                    prompt: prompt,
                    max_tokens: 5,
                    temperature: 0.1,
                    system_prompt: "You are an expert at the Eisenhower Matrix method of task prioritization. You carefully evaluate tasks based on their importance (value and impact) and urgency (time sensitivity). Important tasks contribute to long-term goals or have meaningful impact. Urgent tasks need immediate attention. If a task is neither important nor urgent, categorize it as unimportant."
                };

                const output = await replicate.run(
                    "meta/meta-llama-3-70b-instruct",
                    { input }
                );

                // Clean and normalize the response
                let category = '';
                if (Array.isArray(output)) {
                    category = output.join('').trim().toLowerCase();
                } else {
                    category = String(output).trim().toLowerCase();
                }
                category = category.replace('category:', '').trim();

                // Map to standardized categories
                if (category.includes('important_urgent') || (category.includes('important') && category.includes('urgent'))) {
                    return { importance: 1, urgency: 1 };
                } else if (category.includes('important')) {
                    return { importance: 1, urgency: 0 };
                } else {
                    return { importance: 0, urgency: 0 };
                }
            }, { timeout: 15000 }); // 15 second timeout

        } catch (error) {
            console.error(`Attempt ${attempt + 1}/${retries} failed:`, error);
            if (attempt === retries - 1) {
                return { importance: 0, urgency: 0 }; // Default to unimportant after all retries
            }
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
    }
}

async function analyzeTasks(tasks) {
    const results = [];
    for (const task of tasks) {
        try {
            const result = await analyzeTask(task);
            results.push(result);
        } catch (error) {
            console.error(`Error analyzing task "${task}":`, error);
            results.push({ importance: 0, urgency: 0 }); // Default to unimportant if analysis fails
        }
    }
    return results;
}

module.exports = {
    analyzeTasks
};