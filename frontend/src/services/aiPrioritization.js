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
    
    // Use Railway backend URL directly
    const API_BASE_URL = 'https://8020best-production.up.railway.app';
    
    // Create a fetch request for the streaming endpoint
    fetch(`${API_BASE_URL}/api/ai/rank-tasks`, {
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
                console.log('Raw chunk received (first 200 chars):', chunk.substring(0, 200));
                
                // Add chunk to buffer immediately
                buffer += chunk;
                
                // Process all lines in the buffer
                const lines = buffer.split('\n');
                buffer = ''; // Clear buffer, we'll add back incomplete lines
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    
                    if (!line) continue;
                    
                    // Handle Server-Sent Events format
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            console.log('Parsed SSE data:', data);
                            
                            if (data.type === 'chunk') {
                                // SSE chunk contains content to be parsed
                                const content = data.content;
                                const contentLines = content.split('\n');
                                
                                for (const contentLine of contentLines) {
                                    const trimmed = contentLine.trim();
                                    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                                        try {
                                            const taskData = JSON.parse(trimmed);
                                            console.log('Parsed task from SSE chunk:', taskData);
                                            onData?.(taskData);
                                        } catch (e) {
                                            console.error('Error parsing JSON from SSE:', e, trimmed);
                                        }
                                    }
                                }
                            } else if (data.type === 'end') {
                                // Process any remaining buffer content
                                if (buffer.trim()) {
                                    processBuffer();
                                }
                                onClose?.();
                                return;
                            } else if (data.type === 'error') {
                                onError?.(new Error(data.message));
                                return;
                            }
                        } catch (e) {
                            console.error('Error parsing SSE line:', e, line);
                        }
                    }
                    // Handle raw JSON lines
                    else if (line.startsWith('{')) {
                        // Check if this is a complete JSON object
                        try {
                            const taskData = JSON.parse(line);
                            console.log('Parsed raw JSON task:', taskData);
                            onData?.(taskData);
                        } catch (e) {
                            // Incomplete JSON, add to buffer for next iteration
                            if (i === lines.length - 1) {
                                // Last line might be incomplete
                                buffer = line;
                            } else {
                                console.error('Error parsing JSON line:', e, line);
                            }
                        }
                    } else {
                        // Unknown format, might be part of multi-line JSON
                        if (i === lines.length - 1) {
                            buffer = line;
                        }
                    }
                }

                return readChunk();
            });
        }
        
        function processBuffer() {
            // Try to extract multiple JSON objects from buffer
            const lines = buffer.split('\n');
            let remainingBuffer = '';
            
            for (const line of lines) {
                const trimmedLine = line.trim();
                
                // Skip empty lines
                if (!trimmedLine) continue;
                
                // Try to parse as complete JSON object
                if (trimmedLine.startsWith('{')) {
                    try {
                        const taskData = JSON.parse(trimmedLine);
                        console.log('Parsed task from buffer:', taskData);
                        onData?.(taskData);
                    } catch (e) {
                        // If parsing fails, it might be incomplete
                        // Add to remaining buffer to process later
                        remainingBuffer += trimmedLine;
                    }
                } else {
                    // Non-JSON line, add to remaining buffer
                    remainingBuffer += line + '\n';
                }
            }
            
            // Update buffer with unparsed content
            buffer = remainingBuffer;
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
        const API_BASE_URL = 'https://8020best-production.up.railway.app';
        const response = await fetch(`${API_BASE_URL}/api/ai/rank-tasks`, {
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
