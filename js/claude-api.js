/**
 * Claude API Integration for Intelligent Assistant
 * Handles AI-powered task processing and chat functionality
 */

class ClaudeAPI {
    constructor() {
        this.apiKey = localStorage.getItem('claude_api_key') || null;
        this.baseUrl = 'https://api.anthropic.com/v1';
        this.model = 'claude-3-5-sonnet-20241022';
        this.maxTokens = 1000;
    }

    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('claude_api_key', key);
    }

    async parseTask(userInput, currentDate = new Date()) {
        if (!this.apiKey) {
            throw new Error('Claude API key not configured');
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
            throw error;
        }
    }

    buildTaskParsingPrompt(userInput, currentDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const timeStr = currentDate.toTimeString().split(' ')[0];
        
        return `You are a task parsing assistant. Parse the following user input into a structured task format.

Current date and time: ${dateStr} ${timeStr}

User input: "${userInput}"

Please respond with a JSON object containing these fields:
- title: The main task description (required)
- description: Additional details (optional)
- dueDate: Date in YYYY-MM-DD format (null if not specified)
- dueTime: Time in HH:MM format (null if not specified)
- priority: "high", "medium", or "low" (default: "medium")
- category: Task category if identifiable (optional)

Rules:
1. Extract dates relative to current date ("today", "tomorrow", "next week", "Monday", etc.)
2. Extract times in 24-hour format
3. Identify priority from keywords like "urgent", "important", "asap", "low priority"
4. Clean up the title by removing date/time references
5. If you can't determine a field, use null or the default value

Example inputs and outputs:
- "Meeting with John tomorrow at 2pm" → {"title": "Meeting with John", "dueDate": "2024-01-16", "dueTime": "14:00", "priority": "medium"}
- "Urgent: Call client about project" → {"title": "Call client about project", "priority": "high"}
- "Buy groceries when I have time" → {"title": "Buy groceries", "priority": "low"}

Respond only with the JSON object, no additional text.`;
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
                max_tokens: this.maxTokens,
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
            return "I apologize, but I encountered an error processing your request. Please check your API key and try again.";
        }
    }

    buildChatPrompt(message, context) {
        const { tasks = [], projects = [], currentDate = new Date() } = context;
        
        const dateStr = currentDate.toISOString().split('T')[0];
        const tasksSummary = this.buildTasksSummary(tasks, dateStr);
        
        return `You are an intelligent personal assistant helping with task and project management.

Current date: ${dateStr}
Current tasks summary: ${tasksSummary}

User message: "${message}"

Instructions:
1. Be helpful, concise, and actionable
2. If the user wants to create a task, suggest using the "Add Task" feature or natural language input
3. If asked about tasks, provide relevant information from the context
4. If asked about scheduling, reference their current tasks and suggest optimal timing
5. Be proactive in suggesting improvements to their productivity
6. Keep responses conversational and friendly

Respond naturally and helpfully to assist with their task management needs.`;
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

        const response = await fetch(`${this.baseUrl}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
        }

        return await response.json();
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    // Test API connection
    async testConnection() {
        if (!this.apiKey) {
            return { success: false, error: 'No API key configured' };
        }

        try {
            const response = await this.makeRequest('messages', {
                model: this.model,
                max_tokens: 10,
                messages: [
                    {
                        role: 'user',
                        content: 'Hello'
                    }
                ]
            });

            return { success: true, message: 'API connection successful' };
        } catch (error) {
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

// Enhanced IntelligentAssistant integration
if (window.IntelligentAssistant) {
    // Extend the IntelligentAssistant class with Claude API functionality
    const originalClass = window.IntelligentAssistant;
    
    class EnhancedIntelligentAssistant extends originalClass {
        constructor() {
            super();
            this.claudeAPI = new ClaudeAPI();
        }

        async parseTaskWithAI(text) {
            try {
                const task = await this.claudeAPI.parseTask(text, new Date());
                return task;
            } catch (error) {
                console.error('AI parsing failed, falling back to local parsing:', error);
                return this.parseTaskLocally(text);
            }
        }

        async processWithAI(message) {
            try {
                const context = {
                    tasks: this.tasks,
                    projects: this.projects,
                    currentDate: new Date()
                };
                
                return await this.claudeAPI.processMessage(message, context);
            } catch (error) {
                console.error('AI processing failed:', error);
                return "I apologize, but I'm having trouble connecting to the AI service. Please check your API key in settings or try again later.";
            }
        }

        async updateAISuggestions() {
            const container = document.getElementById('aiSuggestions');
            
            // Try to get AI-powered suggestions
            try {
                const aiSuggestions = await this.claudeAPI.generateSuggestions(this.tasks, new Date());
                
                if (aiSuggestions.length > 0) {
                    container.innerHTML = '';
                    aiSuggestions.forEach(suggestion => {
                        const suggestionElement = document.createElement('div');
                        suggestionElement.className = 'suggestion-item';
                        suggestionElement.innerHTML = `
                            <div class="suggestion-icon">${suggestion.icon || '💡'}</div>
                            <div class="suggestion-content">
                                <div class="suggestion-title">${suggestion.title}</div>
                                <div class="suggestion-description">${suggestion.description}</div>
                            </div>
                        `;
                        container.appendChild(suggestionElement);
                    });
                    return;
                }
            } catch (error) {
                console.error('Failed to get AI suggestions:', error);
            }
            
            // Fallback to local suggestions
            super.updateAISuggestions();
        }

        async testAIConnection() {
            const result = await this.claudeAPI.testConnection();
            
            if (result.success) {
                this.showNotification('AI connection successful!', 'success');
            } else {
                this.showNotification(`AI connection failed: ${result.error}`, 'error');
            }
            
            return result;
        }
    }
    
    // Replace the global class
    window.IntelligentAssistant = EnhancedIntelligentAssistant;
}

// Export for use in other modules
window.ClaudeAPI = ClaudeAPI;