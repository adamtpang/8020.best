// Vercel Serverless Function for AI task ranking
const Replicate = require('replicate');

// Initialize Replicate
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const MODEL_ID = 'anthropic/claude-3.5-sonnet';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function* streamAnalysis(tasks, userPriorities = null) {
  const BATCH_SIZE = 10;

  let priorityContext = '';
  if (userPriorities && userPriorities.trim()) {
    priorityContext = `\n\nUser's Life Priorities (use these to determine task importance):
${userPriorities}

When analyzing tasks, consider how each task aligns with these personal priorities. Tasks that directly support these priorities should be considered higher impact.`;
  }

  for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
    const batch = tasks.slice(i, i + BATCH_SIZE);

    const prompt = `You are an expert in the 80/20 principle. Your goal is to analyze a batch of tasks and determine their impact.${priorityContext}

Here is the batch of tasks to analyze:
${batch.map((t, idx) => `${i + idx + 1}. ${t}`).join('\n')}

For each task, assign an "impact_score" from 0 to 100 based on its potential for high impact${userPriorities ? ' and alignment with the user\'s life priorities' : ''} and provide brief "reasoning".

CRITICAL INSTRUCTION: In the "task" field, you MUST return the EXACT original task text character-for-character without any modifications, paraphrasing, summarizing, or changes. Copy it exactly as provided above. Only provide your analysis in the "impact_score" and "reasoning" fields.

Return the output as individual, newline-separated JSON objects. Each object must have three keys: "task", "impact_score", and "reasoning". Do not include them in a list, and do not add any other text, explanations, or markdown.

Example of expected output:
{"task": "Write a book", "impact_score": 95, "reasoning": "High long-term value and personal fulfillment."}
{"task": "Check email", "impact_score": 20, "reasoning": "Low impact routine task."}
`;

    try {
      const tokenLimit = Math.max(2048, batch.length * 100);
      const stream = await replicate.stream(MODEL_ID, {
        input: {
          prompt: prompt,
          max_tokens: tokenLimit,
        }
      });

      for await (const event of stream) {
        yield event;
      }

      if (i + BATCH_SIZE < tasks.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`Error processing batch:`, error);

      // Fallback for failed batch
      for (const task of batch) {
        const fallbackEvent = {
          event: 'output',
          data: JSON.stringify({
            task: task,
            impact_score: 50,
            reasoning: 'Fallback analysis due to API error'
          })
        };
        yield fallbackEvent;
      }
    }
  }
}

module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tasks, userPriorities } = req.body;

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ error: 'No tasks provided' });
    }

    // Set headers for SSE streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let buffer = '';

    for await (const event of streamAnalysis(tasks, userPriorities)) {
      if (event && typeof event === 'object' && event.toString) {
        const chunk = event.toString();
        buffer += chunk;

        // Try to parse complete JSON objects
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim().startsWith('{')) {
            res.write(`data: ${JSON.stringify({ type: 'chunk', content: line })}\n\n`);
          }
        }
      }
    }

    // Send any remaining buffer
    if (buffer.trim()) {
      res.write(`data: ${JSON.stringify({ type: 'chunk', content: buffer })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Error in rank-tasks:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
    res.end();
  }
};
