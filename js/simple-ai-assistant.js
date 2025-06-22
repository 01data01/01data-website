/**
 * Simple AI Assistant
 * A lightweight version for quick testing and basic functionality
 */

class SimpleAIAssistant {
    constructor() {
        this.userEmail = null;
        this.apiKey = null;
        this.isConnected = false;
        this.baseUrl = '/.netlify/functions';
        
        console.log('Simple AI Assistant initialized');
    }

    // Initialize with user email
    async initialize(userEmail) {
        this.userEmail = userEmail;
        
        try {
            // Get API key assignment
            const keyResult = await this.assignAPIKey();
            if (keyResult.success) {
                this.apiKey = keyResult.apiKey;
                this.isConnected = true;
                console.log('AI Assistant connected successfully');
                return { success: true, message: 'Connected to Claude AI' };
            } else {
                throw new Error(keyResult.error);
            }
        } catch (error) {
            console.error('Failed to initialize AI Assistant:', error);
            return { success: false, error: error.message };
        }
    }

    // Assign API key from backend
    async assignAPIKey() {
        if (!this.userEmail) {
            return { success: false, error: 'User email not provided' };
        }

        try {
            const response = await fetch(`${this.baseUrl}/assign-api-key`, {
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
                return { 
                    success: true, 
                    apiKey: data.apiKey, 
                    isNewUser: data.isNewUser 
                };
            } else {
                throw new Error(data.error || 'Failed to assign API key');
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Send message to Claude
    async sendMessage(message) {
        if (!this.isConnected) {
            const initResult = await this.initialize(this.userEmail);
            if (!initResult.success) {
                return { success: false, error: initResult.error };
            }
        }

        try {
            const response = await fetch(`${this.baseUrl}/claude-chat`, {
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
                return { 
                    success: true, 
                    response: data.response,
                    usage: data.usage 
                };
            } else {
                throw new Error(data.error || 'Failed to get response');
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Test connection
    async testConnection() {
        const testMessage = "Hello! Please respond with 'Connection successful' to confirm the API is working.";
        const result = await this.sendMessage(testMessage);
        
        if (result.success) {
            return { 
                success: true, 
                message: 'Claude API connection successful!',
                response: result.response 
            };
        } else {
            return { 
                success: false, 
                error: result.error 
            };
        }
    }

    // Quick task parsing (simple fallback)
    parseTaskQuickly(userInput) {
        const task = {
            id: Date.now().toString(),
            title: userInput.trim(),
            description: '',
            dueDate: null,
            dueTime: null,
            priority: 'medium',
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        const lowerInput = userInput.toLowerCase();

        // Simple date detection
        if (lowerInput.includes('today')) {
            task.dueDate = new Date().toISOString().split('T')[0];
        } else if (lowerInput.includes('tomorrow')) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            task.dueDate = tomorrow.toISOString().split('T')[0];
        }

        // Simple priority detection
        if (lowerInput.includes('urgent') || lowerInput.includes('important')) {
            task.priority = 'high';
        } else if (lowerInput.includes('low priority')) {
            task.priority = 'low';
        }

        return task;
    }

    // AI-powered task parsing
    async parseTaskWithAI(userInput) {
        const prompt = `Parse this task request into a structured format: "${userInput}"

Please respond with a JSON object containing:
- title: clean task title
- description: any additional details
- dueDate: YYYY-MM-DD format if a date is mentioned, or null
- priority: "high", "medium", or "low" based on urgency
- category: work/personal/health etc, or null

Respond only with the JSON object.`;

        const result = await this.sendMessage(prompt);
        
        if (result.success) {
            try {
                // Extract JSON from response
                const jsonMatch = result.response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const taskData = JSON.parse(jsonMatch[0]);
                    return {
                        id: Date.now().toString(),
                        title: taskData.title || userInput,
                        description: taskData.description || '',
                        dueDate: taskData.dueDate || null,
                        dueTime: null,
                        priority: taskData.priority || 'medium',
                        status: 'pending',
                        category: taskData.category || null,
                        createdAt: new Date().toISOString()
                    };
                }
            } catch (error) {
                console.warn('Failed to parse AI response, using fallback:', error);
            }
        }
        
        // Fallback to simple parsing
        return this.parseTaskQuickly(userInput);
    }

    // Get status
    getStatus() {
        return {
            isConnected: this.isConnected,
            userEmail: this.userEmail,
            hasApiKey: !!this.apiKey
        };
    }
}

// Export for use
window.SimpleAIAssistant = SimpleAIAssistant;

// Create a global instance for easy testing
window.simpleAI = new SimpleAIAssistant();