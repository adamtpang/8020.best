const { fetch } = require('undici');
global.fetch = fetch;

const Replicate = require('replicate');

const processText = async (text) => {
  try {
    console.log('TextProcessor: Starting text processing');
    console.log('TextProcessor: API Token:', process.env.REPLICATE_API_TOKEN ? 'Present' : 'Missing');

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const progress = [];

    // Step 1: Split into lines and clean up
    let lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    progress.push('Cleaned up text formatting');
    console.log('TextProcessor: Lines after cleanup:', lines);

    // Step 2: Remove duplicates
    const originalLength = lines.length;
    lines = [...new Set(lines)];
    const duplicatesRemoved = originalLength - lines.length;
    if (duplicatesRemoved > 0) {
      progress.push(`Removed ${duplicatesRemoved} duplicate lines`);
    }
    console.log('TextProcessor: Lines after duplicate removal:', lines);

    // Step 3: Sort by length
    lines.sort((a, b) => a.length - b.length);
    progress.push('Sorted lines by length');
    console.log('TextProcessor: Lines after sorting:', lines);

    // Step 4: Extract and remove links
    const linkRegex = /https?:\/\/[^\s]+/g;
    const links = [];
    lines = lines.map(line => {
      const lineLinks = line.match(linkRegex) || [];
      links.push(...lineLinks);
      return line.replace(linkRegex, '').trim();
    }).filter(line => line.length > 0);
    if (links.length > 0) {
      progress.push(`Extracted ${links.length} links`);
    }

    console.log('TextProcessor: Cleaned text lines:', lines);
    console.log('TextProcessor: Extracted links:', links);
    progress.push('Starting AI analysis...');

    // Step 5: Process each line with AI
    const tasks = [];
    const ideas = [];

    for (const line of lines) {
      if (!line) continue;
      console.log('TextProcessor: Starting to process line:', line);

      try {
        console.log('TextProcessor: Creating input for line');
        const input = {
          prompt: `Determine if this is a task (something actionable that needs to be done) or an idea (a concept or non-actionable thought).
                  Only respond with either "TASK" or "IDEA".

                  Text: "${line}"

                  Classification:`,
          temperature: 0.1,
          max_tokens: 10,
          top_p: 0.9
        };

        console.log('TextProcessor: Starting Replicate stream');
        let output = "";
        for await (const event of replicate.stream("meta/llama-2-70b-chat:02e509c789964a7ea8736978a43525956ef40397be9033abf9fd2badfe68c9e3", { input })) {
          console.log('TextProcessor: Received event:', event);
          output += String(event);
        }

        console.log('TextProcessor: AI Response:', output);

        // Clean up and process the result
        const result = output.trim().toUpperCase();
        console.log('TextProcessor: Cleaned result:', result);

        if (result.includes('TASK')) {
          tasks.push(line);
          progress.push(`Classified: "${line.substring(0, 30)}..." as TASK`);
          console.log('TextProcessor: Added to tasks:', line);
        } else if (result.includes('IDEA')) {
          ideas.push(line);
          progress.push(`Classified: "${line.substring(0, 30)}..." as IDEA`);
          console.log('TextProcessor: Added to ideas:', line);
        }

      } catch (streamError) {
        console.error('TextProcessor: Error details:', {
          error: streamError,
          message: streamError.message,
          stack: streamError.stack,
          response: streamError.response?.data
        });

        // Try again after a delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }

      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('TextProcessor: Processing complete');
    console.log('TextProcessor: Final tasks:', tasks);
    console.log('TextProcessor: Final ideas:', ideas);
    console.log('TextProcessor: Final links:', links);

    return {
      links,
      tasks,
      ideas,
      sortedTasks: {
        importantUrgent: [],
        importantNotUrgent: [],
        notImportantUrgent: [],
        notImportantNotUrgent: []
      },
      progress
    };

  } catch (error) {
    console.error('TextProcessor Fatal Error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      fullError: error
    });
    throw error;
  }
};

module.exports = { processText };