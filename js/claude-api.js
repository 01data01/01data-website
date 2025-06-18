/**
 * Claude API Integration for Intelligent Assistant
 * Handles AI-powered task processing and chat functionality
 */

class ClaudeAPI {
    constructor() {
        this.apiKey = localStorage.getItem('claude_api_key') || null;
        this.baseUrl = 'https://api.anthropic.com/v1';
        this.model = 'claude-3-5-sonnet-20241022';
        this.maxTokens = 4000; // Increased for longer responses
        this.mockMode = false; // Force disable mock mode
    }

    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('claude_api_key', key);
    }

    enableMockMode(enabled = true) {
        this.mockMode = enabled;
        localStorage.setItem('claude_mock_mode', enabled.toString());
        console.log('Claude API mock mode:', enabled ? 'enabled' : 'disabled');
    }

    // Mock responses for testing
    getMockTaskResponse(userInput) {
        const lowerInput = userInput.toLowerCase();
        
        let task = {
            id: this.generateId(),
            title: userInput,
            description: '',
            dueDate: null,
            dueTime: null,
            priority: 'medium',
            status: 'pending',
            category: null,
            project: null,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        // Simple parsing logic for demo
        if (lowerInput.includes('tomorrow')) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            task.dueDate = tomorrow.toISOString().split('T')[0];
        }
        
        if (lowerInput.includes('today')) {
            task.dueDate = new Date().toISOString().split('T')[0];
        }

        // Extract time
        const timeMatch = userInput.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
        if (timeMatch) {
            let hour = parseInt(timeMatch[1]);
            const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
            const ampm = timeMatch[3];

            if (ampm && ampm.toLowerCase() === 'pm' && hour !== 12) {
                hour += 12;
            } else if (ampm && ampm.toLowerCase() === 'am' && hour === 12) {
                hour = 0;
            }

            task.dueTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        }

        // Priority detection
        if (lowerInput.includes('urgent') || lowerInput.includes('important')) {
            task.priority = 'high';
        } else if (lowerInput.includes('low priority')) {
            task.priority = 'low';
        }

        // Clean title
        task.title = userInput
            .replace(/\b(today|tomorrow)\b/gi, '')
            .replace(/\b\d{1,2}:?\d{2}?\s*(am|pm)?\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim();

        return task;
    }

    getMockChatResponse(message) {
        return "Mock mode is disabled. This should not appear if using real Claude API.";
    }

    async parseTask(userInput, currentDate = new Date()) {
        if (!this.apiKey && !this.mockMode) {
            throw new Error('Claude API key not configured');
        }

        // Use mock mode for testing or when API is unavailable
        if (this.mockMode || !this.apiKey) {
            console.log('Using mock task parsing for:', userInput);
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
            return this.getMockTaskResponse(userInput);
        }

        const prompt = this.buildTaskParsingPrompt(userInput, currentDate);
        
        try {
            const response = await this.makeRequest('messages', {
                model: this.model,
                max_tokens: this.maxTokens,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            });

            const content = response.content[0].text;
            return this.parseTaskResponse(content);
        } catch (error) {
            console.error('Error parsing task with Claude:', error);
            
            // Fallback to mock response on API failure
            console.log('Falling back to mock task parsing');
            return this.getMockTaskResponse(userInput);
        }
    }

    buildTaskParsingPrompt(userInput, currentDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const timeStr = currentDate.toTimeString().split(' ')[0];
        
        return `Parse this task: "${userInput}" into JSON format with title, description, dueDate (${dateStr} format), dueTime (HH:MM), priority (high/medium/low). Current date: ${dateStr}. Respond only with JSON.`;
    }

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
                createdAt: new Date().toISOString(),
                completedAt: null
            };
        } catch (error) {
            console.error('Error parsing Claude response:', error);
            throw new Error('Failed to parse AI response');
        }
    }

    async processMessage(message, context = {}) {
        if (!this.apiKey) {
            return "Please configure your Claude API key in settings to enable AI features.";
        }

        const prompt = this.buildChatPrompt(message, context);
        
        try {
            const response = await this.makeRequest('messages', {
                model: this.model,
                max_tokens: 2000, // Increased for longer responses
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            });

            return response.content[0].text;
        } catch (error) {
            console.error('Error processing message with Claude:', error);
            return `Error: ${error.message}`;
        }
    }

    buildChatPrompt(message, context) {
        return message; // Send user message directly to Claude without any restrictions
    }

    buildTasksSummary(tasks, currentDate) {
        if (!tasks || tasks.length === 0) {
            return "No tasks currently scheduled.";
        }

        const today = tasks.filter(t => t.dueDate === currentDate);
        const overdue = tasks.filter(t => t.dueDate && t.dueDate < currentDate && t.status === 'pending');
        const pending = tasks.filter(t => t.status === 'pending');
        const completed = tasks.filter(t => t.status === 'completed');

        let summary = `Total tasks: ${tasks.length} (${pending.length} pending, ${completed.length} completed)`;
        
        if (today.length > 0) {
            summary += `. Today: ${today.length} task(s)`;
        }
        
        if (overdue.length > 0) {
            summary += `. Overdue: ${overdue.length} task(s)`;
        }

        return summary;
    }

    async makeRequest(endpoint, data) {
        if (!this.apiKey) {
            throw new Error('API key not configured');
        }

        try {
            console.log('Making request to:', `${this.baseUrl}/${endpoint}`);
            console.log('Request data:', data);
            
            const response = await fetch(`${this.baseUrl}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify(data)
            });

            console.log('Response received:', response);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Fetch error details:', error);
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error: Unable to connect to Claude API. This might be due to CORS restrictions when running from a browser.');
            }
            throw error;
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    // Test API connection
    async testConnection() {
        if (!this.apiKey) {
            return { success: false, error: 'No API key configured' };
        }

        // Validate API key format
        if (!this.apiKey.startsWith('sk-ant-')) {
            return { success: false, error: 'Invalid API key format. Claude API keys should start with "sk-ant-"' };
        }

        try {
            const response = await this.makeRequest('messages', {
                model: this.model,
                max_tokens: 50,
                messages: [
                    {
                        role: 'user',
                        content: 'Say hello and confirm you are Claude AI'
                    }
                ]
            });

            return { success: true, message: 'Claude API connected successfully! Response: ' + response.content[0].text };
        } catch (error) {
            console.error('Connection test failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Batch process multiple tasks
    async batchParseTs(inputs, currentDate = new Date()) {
        const results = [];
        
        for (const input of inputs) {
            try {
                const task = await this.parseTask(input, currentDate);
                results.push({ success: true, task });
            } catch (error) {
                results.push({ success: false, error: error.message, input });
            }
        }
        
        return results;
    }

    // Generate task suggestions based on user's schedule
    async generateSuggestions(tasks, currentDate = new Date()) {
        if (!this.apiKey) {
            return [];
        }

        const prompt = `Based on the following task schedule, suggest 3 productivity improvements or task suggestions:

Current date: ${currentDate.toISOString().split('T')[0]}
Tasks: ${JSON.stringify(tasks.slice(0, 20))} // Limit to avoid token limits

Provide suggestions in JSON format:
[
  {"type": "suggestion", "title": "Suggestion title", "description": "Brief description", "icon": "emoji"},
  ...
]

Focus on:
1. Identifying scheduling conflicts
2. Suggesting optimal timing for tasks
3. Recommending task prioritization
4. Finding time for breaks or important tasks
5. Identifying overdue items that need attention

Respond only with the JSON array.`;

        try {
            const response = await this.makeRequest('messages', {
                model: this.model,
                max_tokens: 500,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            });

            const content = response.content[0].text;
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            return [];
        } catch (error) {
            console.error('Error generating suggestions:', error);
            return [];
        }
    }
}

// Simple logging for debugging
console.log('Claude API script loaded, ClaudeAPI class available:', !!window.ClaudeAPI);

// Export for use in other modules
window.ClaudeAPI = ClaudeAPI;