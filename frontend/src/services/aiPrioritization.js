import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
    baseURL: API_URL,
    timeout: 90000, // 90 seconds for potentially long AI analysis
});

/**
 * Establishes a connection to the backend to stream ranked tasks.
 * Uses Server-Sent Events (SSE) to receive data.
 *
 * @param {string[]} tasks - An array of task strings.
 * @param {function} onData - Callback function to handle incoming task data.
 * @param {function} onError - Callback function to handle errors.
 * @param {function} onClose - Callback function for when the stream closes.
 * @returns {EventSource} The EventSource instance to allow for closing the connection.
 */
export const streamRankedTasks = (tasks, userPriorities, { onData, onError, onClose }, authToken = null) => {
    // Prepare headers
    const headers = {
        'Content-Type': 'application/json',
    };
    
    // Add auth token if provided
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    // Create a fetch request for the streaming endpoint
    fetch('/api/ai/rank-tasks', {
        method: 'POST',
        headers,
        body: JSON.stringify({ tasks, userPriorities }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to start analysis');
        }
        return response.body;
    })
    .then(body => {
        const reader = body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        function readChunk() {
            return reader.read().then(({ done, value }) => {
                if (done) {
                    // Process any remaining complete JSON objects in buffer
                    if (buffer.trim()) {
                        processBuffer();
                    }
                    onClose?.();
                    return;
                }

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(line => line.trim());
                
                console.log('Raw chunk received:', chunk);

                for (const line of lines) {
                    console.log('Processing line:', line);
                    
                    // Handle Server-Sent Events format
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            console.log('Parsed SSE data:', data);
                            
                            if (data.type === 'chunk') {
                                // Add chunk content to buffer
                                buffer += data.content;
                                console.log('Buffer now:', buffer);
                                
                                // Try to extract complete JSON objects from buffer
                                processBuffer();
                            } else if (data.type === 'end') {
                                // Process any remaining complete JSON objects in buffer
                                processBuffer();
                                onClose?.();
                                return;
                            } else if (data.type === 'error') {
                                onError?.(new Error(data.message));
                                return;
                            }
                        } catch (e) {
                            console.error('Error parsing SSE chunk:', e);
                        }
                    } 
                    // Handle raw JSON lines (direct from AI)
                    else if (line.trim().startsWith('{') && line.trim().endsWith('}')) {
                        try {
                            const taskData = JSON.parse(line.trim());
                            console.log('Parsed raw JSON task data:', taskData);
                            onData?.(taskData);
                        } catch (e) {
                            console.error('Error parsing raw JSON line:', e, line);
                        }
                    }
                }

                return readChunk();
            });
        }
        
        function processBuffer() {
            // Look for complete JSON objects in the buffer
            let braceCount = 0;
            let start = -1;
            
            for (let i = 0; i < buffer.length; i++) {
                if (buffer[i] === '{') {
                    if (braceCount === 0) {
                        start = i;
                    }
                    braceCount++;
                } else if (buffer[i] === '}') {
                    braceCount--;
                    if (braceCount === 0 && start >= 0) {
                        // Found a complete JSON object
                        const jsonStr = buffer.substring(start, i + 1);
                        try {
                            const taskData = JSON.parse(jsonStr);
                            console.log('Parsed complete task data:', taskData);
                            onData?.(taskData);
                        } catch (e) {
                            console.error('Error parsing complete JSON:', e, jsonStr);
                        }
                        
                        // Remove processed part from buffer
                        buffer = buffer.substring(i + 1);
                        
                        // Restart processing from the beginning of the remaining buffer
                        if (buffer.includes('{')) {
                            processBuffer();
                        }
                        return;
                    }
                }
            }
        }

        return readChunk();
    })
    .catch(error => {
        onError?.(error);
    });

    // Return a mock EventSource-like object for compatibility
    return {
        close: () => {
            // In a real implementation, you'd want to abort the fetch
            console.log('Stream closed');
        }
    };
};
// This is a temporary solution until the EventSource is fully implemented.
export const getRankedTasks = async (tasks, userContext = {}) => {
    try {
        const response = await fetch('/api/ai/rank-tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tasks }),
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching ranked tasks:', error);
        return {
            error: true,
            message: error.message || 'Failed to connect to the ranking service.',
            vital_few: [],
            trivial_many: [],
        };
    }
};
