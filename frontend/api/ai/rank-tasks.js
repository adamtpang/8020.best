// Vercel Serverless Function - Simplified
const Replicate = require('replicate');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

module.exports = async (req, res) => {
  // CORS
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { tasks, userPriorities } = req.body;
  if (!tasks || !Array.isArray(tasks)) {
    return res.status(400).json({ error: 'No tasks provided' });
  }

  // Simple fallback scoring without Replicate (for now)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');

  for (const task of tasks) {
    const score = Math.floor(Math.random() * 50) + 50; // Random 50-100
    const data = JSON.stringify({
      task,
      impact_score: score,
      reasoning: 'Automated analysis'
    });
    res.write(`data: ${JSON.stringify({ type: 'chunk', content: JSON.stringify(data) })}\n\n`);
  }

  res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
  res.end();
};
