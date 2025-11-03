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
    
    // Use the proper API URL from environment variables
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

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
        let jsonBuffer = ''; // Buffer to accumulate JSON content from SSE chunks

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
                                // SSE chunk contains partial JSON content - accumulate it
                                jsonBuffer += data.content;
                                
                                // Try to parse complete JSON objects from the buffer
                                let startIndex = 0;
                                let braceCount = 0;
                                let inString = false;
                                let escapeNext = false;
                                
                                for (let i = 0; i < jsonBuffer.length; i++) {
                                    const char = jsonBuffer[i];
                                    
                                    if (escapeNext) {
                                        escapeNext = false;
                                        continue;
                                    }
                                    
                                    if (char === '\\' && inString) {
                                        escapeNext = true;
                                        continue;
                                    }
                                    
                                    if (char === '"' && !escapeNext) {
                                        inString = !inString;
                                        continue;
                                    }
                                    
                                    if (!inString) {
                                        if (char === '{') {
                                            if (braceCount === 0) startIndex = i;
                                            braceCount++;
                                        } else if (char === '}') {
                                            braceCount--;
                                            if (braceCount === 0) {
                                                // Found complete JSON object
                                                const jsonStr = jsonBuffer.substring(startIndex, i + 1);
                                                try {
                                                    const taskData = JSON.parse(jsonStr);
                                                    console.log('Parsed task from accumulated SSE chunks:', taskData);
                                                    onData?.(taskData);
                                                } catch (e) {
                                                    console.error('Error parsing accumulated JSON:', e, jsonStr);
                                                }
                                                // Remove processed JSON from buffer
                                                jsonBuffer = jsonBuffer.substring(i + 1);
                                                i = -1; // Reset loop
                                                startIndex = 0;
                                            }
                                        }
                                    }
                                }
                            } else if (data.type === 'end') {
                                // Process any remaining JSON buffer content
                                if (jsonBuffer.trim()) {
                                    // Try to parse any remaining complete JSON
                                    let startIndex = 0;
                                    let braceCount = 0;
                                    let inString = false;
                                    let escapeNext = false;
                                    
                                    for (let i = 0; i < jsonBuffer.length; i++) {
                                        const char = jsonBuffer[i];
                                        
                                        if (escapeNext) {
                                            escapeNext = false;
                                            continue;
                                        }
                                        
                                        if (char === '\\' && inString) {
                                            escapeNext = true;
                                            continue;
                                        }
                                        
                                        if (char === '"' && !escapeNext) {
                                            inString = !inString;
                                            continue;
                                        }
                                        
                                        if (!inString) {
                                            if (char === '{') {
                                                if (braceCount === 0) startIndex = i;
                                                braceCount++;
                                            } else if (char === '}') {
                                                braceCount--;
                                                if (braceCount === 0) {
                                                    // Found complete JSON object
                                                    const jsonStr = jsonBuffer.substring(startIndex, i + 1);
                                                    try {
                                                        const taskData = JSON.parse(jsonStr);
                                                        console.log('Parsed final task from SSE buffer:', taskData);
                                                        onData?.(taskData);
                                                    } catch (e) {
                                                        console.error('Error parsing final JSON:', e, jsonStr);
                                                    }
                                                }
                                            }
                                        }
                                    }
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
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
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
