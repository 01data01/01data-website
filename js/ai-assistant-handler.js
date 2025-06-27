/**
 * AI Assistant Handler
 * Core AI functionality for task management and conversation handling
 */

class AIAssistantHandler {
    constructor() {
        this.apiKey = null;
        this.userEmail = null;
        this.baseUrl = '/.netlify/functions';
        this.maxRetries = 3;
        this.retryDelay = 1000;
        this.requestTimeout = 30000;
        this.requestCache = new Map();
        this.isInitialized = false;
        
        // AI Models configuration
        this.models = {
            chat: 'claude-3-sonnet-20240229',
            taskParsing: 'claude-3-haiku-20240307',
            suggestions: 'claude-3-haiku-20240307'
        };
        
        // Request limits
        this.maxTokens = {
            chat: 1000,
            taskParsing: 300,
            suggestions: 500
        };
        
        console.log('AI Assistant Handler initialized');
    }

    // Initialize the AI assistant with user data
    async initialize(userEmail) {
        if (this.isInitialized && this.userEmail === userEmail) {
            return { success: true, message: 'Already initialized' };
        }

        this.userEmail = userEmail;
        
        try {
            const result = await this.assignAPIKey();
            if (result.success) {
                this.isInitialized = true;
                console.log(`AI Assistant initialized for ${userEmail}`);
                return { success: true, message: 'AI Assistant initialized successfully' };
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Failed to initialize AI Assistant:', error);
            return { success: false, error: error.message };
        }
    }

    // Assign API key automatically from backend
    async assignAPIKey() {
        if (!this.userEmail) {
            return { success: false, error: 'User email not provided' };
        }

        try {
            const response = await this.makeRequestWithRetry(`${this.baseUrl}/assign-api-key`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userEmail: this.userEmail
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.apiKey = data.apiKey;
                console.log(`API key assigned for ${this.userEmail}`);
                return { success: true, apiKey: data.apiKey, isNewUser: data.isNewUser };
            } else {
                throw new Error(data.error || 'Failed to assign API key');
            }
        } catch (error) {
            console.error('Error assigning API key:', error);
            return { success: false, error: error.message };
        }
    }

    // Test AI connection
    async testConnection() {
        if (!this.userEmail) {
            return { success: false, error: 'Please sign in first' };
        }

        if (!this.apiKey) {
            const initResult = await this.initialize(this.userEmail);
            if (!initResult.success) {
                return initResult;
            }
        }

        try {
            const testMessage = "Hello, can you confirm you are Claude AI? Please respond with a brief confirmation.";
            const response = await this.processMessage(testMessage);
            
            if (response.includes('Error:')) {
                return { success: false, error: response };
            }

            return { 
                success: true, 
                message: 'Claude AI connected successfully!',
                response: response 
            };
        } catch (error) {
            console.error('Connection test failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Process chat messages with AI
    async processMessage(message, context = {}) {
        if (!this.apiKey) {
            const initResult = await this.initialize(this.userEmail);
            if (!initResult.success) {
                return `Error: ${initResult.error}`;
            }
        }

        // Check cache for repeated requests
        const cacheKey = `${this.userEmail}-${message}`;
        if (this.requestCache.has(cacheKey)) {
            const cached = this.requestCache.get(cacheKey);
            if (Date.now() - cached.timestamp < 300000) { // 5 minutes cache
                console.log('Returning cached response');
                return cached.response;
            }
        }

        try {
            const response = await this.makeRequestWithRetry(`${this.baseUrl}/claude-chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userEmail: this.userEmail,
                    message: message,
                    apiKey: this.apiKey
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                // Cache the response
                this.requestCache.set(cacheKey, {
                    response: data.response,
                    timestamp: Date.now()
                });
                
                // Limit cache size
                if (this.requestCache.size > 50) {
                    const firstKey = this.requestCache.keys().next().value;
                    this.requestCache.delete(firstKey);
                }
                
                return data.response;
            } else {
                throw new Error(data.error || 'Chat request failed');
            }
        } catch (error) {
            console.error('Error processing message:', error);
            return `Error: ${error.message}`;
        }
    }

    // Parse natural language input into structured task data
    async parseTask(userInput, currentDate = new Date()) {
        if (!this.apiKey) {
            const initResult = await this.initialize(this.userEmail);
            if (!initResult.success) {
                throw new Error(initResult.error);
            }
        }

        const prompt = this.buildTaskParsingPrompt(userInput, currentDate);
        
        try {
            const response = await this.makeRequestWithRetry(`${this.baseUrl}/claude-chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userEmail: this.userEmail,
                    message: prompt,
                    apiKey: this.apiKey
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                return this.parseTaskResponse(data.response);
            } else {
                throw new Error(data.error || 'Task parsing failed');
            }
        } catch (error) {
            console.error('Error parsing task:', error);
            throw error;
        }
    }

    // Build task parsing prompt
    buildTaskParsingPrompt(userInput, currentDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const timeStr = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        return `Parse this task request into JSON format: "${userInput}"

Current date: ${dateStr}
Current time: ${timeStr}

Extract the following information and return ONLY a JSON object:
{
  "title": "clean task title (remove time/date words)",
  "description": "additional details if any",
  "dueDate": "YYYY-MM-DD format or null",
  "dueTime": "HH:MM format (24-hour) or null",
  "priority": "high/medium/low based on urgency words",
  "category": "work/personal/health/etc or null"
}

Rules:
- If "today" mentioned, use current date
- If "tomorrow" mentioned, use next date
- If "next week" mentioned, use date 7 days from now
- If time like "2pm", "14:00", "2:30pm" mentioned, extract to dueTime
- If words like "urgent", "important", "asap" mentioned, set priority to "high"
- If "low priority", "when possible" mentioned, set priority to "low"
- Clean the title by removing time/date references
- Return only the JSON object, no other text`;
    }

    // Parse AI response into task object
    parseTaskResponse(content) {
        try {
            // Clean up the response to extract JSON
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }

            const taskData = JSON.parse(jsonMatch[0]);
            
            // Validate and clean the task data
            return {
                id: this.generateId(),
                title: taskData.title || 'Untitled Task',
                description: taskData.description || '',
                dueDate: taskData.dueDate || null,
                dueTime: taskData.dueTime || null,
                priority: ['high', 'medium', 'low'].includes(taskData.priority) ? taskData.priority : 'medium',
                status: 'pending',
                category: taskData.category || null,
                project: null,
                tags: [],
                createdAt: new Date().toISOString(),
                completedAt: null
            };
        } catch (error) {
            console.error('Error parsing AI response:', error);
            throw new Error('Failed to parse AI response');
        }
    }

    // Generate AI suggestions based on user's tasks
    async generateSuggestions(tasks, currentDate = new Date()) {
        if (!this.apiKey || !tasks || tasks.length === 0) {
            return [];
        }

        const prompt = this.buildSuggestionsPrompt(tasks, currentDate);
        
        try {
            const response = await this.makeRequestWithRetry(`${this.baseUrl}/claude-chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userEmail: this.userEmail,
                    message: prompt,
                    apiKey: this.apiKey
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                return this.parseSuggestionsResponse(data.response);
            } else {
                console.error('Error generating suggestions:', data.error);
                return [];
            }
        } catch (error) {
            console.error('Error generating suggestions:', error);
            return [];
        }
    }

    // Build suggestions prompt
    buildSuggestionsPrompt(tasks, currentDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const tasksSummary = tasks.slice(0, 20).map(task => ({
            title: task.title,
            dueDate: task.dueDate,
            dueTime: task.dueTime,
            priority: task.priority,
            status: task.status
        }));

        return `Analyze the following tasks and provide 3 helpful productivity suggestions.

Current date: ${dateStr}
Tasks: ${JSON.stringify(tasksSummary)}

Provide suggestions as a JSON array with this format:
[
  {
    "type": "suggestion",
    "title": "Suggestion title",
    "description": "Brief helpful description",
    "icon": "single emoji",
    "action": "optional action type"
  }
]

Focus on:
1. Overdue tasks that need attention
2. Tasks without due dates that should be scheduled
3. Scheduling conflicts or optimization opportunities
4. Workload balance and break recommendations
5. Priority adjustments

Return only the JSON array, no other text.`;
    }

    // Parse suggestions response
    parseSuggestionsResponse(content) {
        try {
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const suggestions = JSON.parse(jsonMatch[0]);
                return suggestions.filter(s => s.title && s.description).slice(0, 3);
            }
            return [];
        } catch (error) {
            console.error('Error parsing suggestions:', error);
            return [];
        }
    }

    // Batch process multiple tasks
    async batchParseTask(inputs, currentDate = new Date()) {
        const results = [];
        
        for (const input of inputs) {
            try {
                const task = await this.parseTask(input, currentDate);
                results.push({ success: true, task, input });
            } catch (error) {
                results.push({ success: false, error: error.message, input });
            }
        }
        
        return results;
    }

    // Network request with retry logic
    async makeRequestWithRetry(url, options, retryCount = 0) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);
            
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            if (retryCount < this.maxRetries && (
                error.name === 'AbortError' || 
                error.name === 'TypeError' ||
                (error.response && error.response.status >= 500)
            )) {
                const delay = this.retryDelay * Math.pow(2, retryCount);
                console.log(`Request failed, retrying in ${delay}ms... (attempt ${retryCount + 1}/${this.maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.makeRequestWithRetry(url, options, retryCount + 1);
            }
            throw error;
        }
    }

    // Utility functions
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    // Clear cache
    clearCache() {
        this.requestCache.clear();
        console.log('AI Assistant cache cleared');
    }

    // Get status information
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            hasApiKey: !!this.apiKey,
            userEmail: this.userEmail,
            cacheSize: this.requestCache.size,
            models: this.models
        };
    }
}

// Export for use in other modules
window.AIAssistantHandler = AIAssistantHandler;