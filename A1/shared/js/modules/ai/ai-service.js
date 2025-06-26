/**
 * AI Service Module
 * Handles AI API integration, task parsing, and intelligent assistance
 */

class AIService {
    constructor() {
        this.initialized = false;
        this.apiEndpoint = '/.netlify/functions/claude-chat';
        this.connectionStatus = 'disconnected';
        this.requestQueue = [];
        this.isProcessing = false;
        this.userEmail = null;
        this.apiKey = null;
        
        // AI Configuration
        this.config = {
            model: 'claude-3-sonnet-20240229',
            maxTokens: 4000,
            temperature: 0.7,
            timeout: 30000,
            retryAttempts: 3,
            retryDelay: 1000
        };
        
        // Context management
        this.conversationContext = new Map();
        this.systemPrompts = this.initializeSystemPrompts();
    }

    /**
     * Set user email and initialize API
     */
    async setUserEmail(email) {
        this.userEmail = email;
        if (email) {
            await this.initializeUserAPI();
        }
    }

    /**
     * Initialize AI service
     */
    async initialize() {
        if (this.initialized) return;
        
        try {
            console.log('A1: Initializing AI Service...');
            
            // Get user email from auth module or localStorage
            if (window.authModule && window.authModule.getCurrentUser()) {
                this.userEmail = window.authModule.getCurrentUser().email;
                console.log('A1: User email from authModule:', this.userEmail);
                await this.initializeUserAPI();
            } else {
                // Fallback to localStorage for A1 auto-login
                const savedUser = window.utils?.loadFromStorage('user');
                if (savedUser && savedUser.email) {
                    this.userEmail = savedUser.email;
                    console.log('A1: User email from localStorage:', this.userEmail);
                    await this.initializeUserAPI();
                } else {
                    console.log('A1: No user found, AI service will run in disconnected mode');
                    this.connectionStatus = 'disconnected';
                }
            }
            
            this.setupRequestQueue();
            
            this.initialized = true;
            console.log('A1: AI Service initialized successfully. Status:', this.connectionStatus);
            
        } catch (error) {
            console.error('A1: AI Service Initialization error:', error);
            this.connectionStatus = 'error';
        }
    }

    /**
     * Initialize user API key
     */
    async initializeUserAPI() {
        if (!this.userEmail) return;

        // Check if running locally (file:// protocol)
        if (window.location.protocol === 'file:') {
            console.log('Running locally, skipping API key assignment');
            this.connectionStatus = 'disconnected';
            return { apiKey: null, isNewUser: false };
        }

        try {
            const response = await fetch('/.netlify/functions/assign-api-key', {
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
                this.connectionStatus = 'connected';
                console.log(`API key assigned for ${this.userEmail}:`, data.isNewUser ? 'New user' : 'Existing user');
                return data;
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error initializing user API:', error);
            this.connectionStatus = 'error';
            throw error;
        }
    }

    /**
     * Initialize system prompts for A1 PVC Assistant
     */
    initializeSystemPrompts() {
        return {
            chatAssistant: `You are a helpful and knowledgeable AI assistant for A1 PVC Company (Özemek Plastik). 
                Your role is to provide accurate information about the company's products and services.
                
                COMPANY INFORMATION:
                - Company: Özemek Plastik (A1 PVC Brand)
                - Established: 1970s (50+ years of experience)
                - Location: Turkey with 10,000 m² production facility
                - Capacity: 1,000 tons monthly production
                - Export: 50+ countries worldwide
                - Website: https://a1pvcmarket.com/
                - Phone: 0850 888 22 47
                - Email: info@ozemekplastik.com
                
                PRODUCT CATEGORIES:
                1. Kenar Bandi (Edge Banding)
                2. PVC Profiles (Window and Door Systems)
                3. Stor Kapaklari (Blind/Shutter Doors)
                4. Mutfak ve Mobilya Aksesuarlari (Kitchen & Furniture Accessories)
                5. Hotmelt (Hot Melt Adhesives)
                6. Karavan Malzemeleri (Caravan Materials)
                7. Yapi Kimyasallari (Construction Chemicals)
                8. Yapiskanli Vida Tapalari (Adhesive Screw Plugs)
                9. Ahsap Kapi Fitilleri (Wooden Door Strips)
                10. Kapi Esik Citalari (Door Threshold Strips)

                PRODUCT TYPES:
                - Sert PVC Profil (Hard PVC Profiles)
                - Yumuşak PVC Kenar Kapama (Soft PVC Edge Closing)
                - Süpürgelik PVC Profil (Baseboard PVC Profiles)
                - Duşakabin Kapısı (Shower Cabin Doors)
                - Baza PVC Aparat (Base PVC Apparatus)
                
                GUIDELINES:
                1. Respond in Turkish by default, English if customer asks in English
                2. Emphasize company's 50+ years experience and quality
                3. Provide technical details about PVC products when asked
                4. Include contact information when relevant: 0850 888 22 47
                5. Promote company's export capabilities to 50+ countries
                6. When uncertain, suggest contacting customer service
                7. Maintain professional but warm tone
                8. Do not discuss competitors
                9. Focus on product quality and customer service excellence
                10. For detailed specifications, direct to official channels
                
                Always start responses acknowledging you're the A1 PVC Assistant and provide helpful, accurate information about our products and services.`,
            
            taskParsing: `You are an AI assistant specialized in parsing natural language into structured task data. 
                Extract task information and return JSON with: title, description, priority, category, dueDate, time.
                Priority levels: low, medium, high. Categories: Work, Personal, Health, Finance, Education, Other.
                Parse dates naturally (today, tomorrow, next week, etc.) and return in YYYY-MM-DD format.`,
            
            taskSuggestion: `You are a productivity assistant. Analyze user tasks and suggest:
                1. Better task organization
                2. Priority adjustments
                3. Time estimates
                4. Related tasks
                5. Productivity tips
                Focus on actionable, specific advice.`,
            
            projectPlanning: `You are a project management expert. Help users break down projects into:
                1. Clear milestones
                2. Specific tasks
                3. Dependencies
                4. Time estimates
                5. Resource requirements
                Provide structured, actionable project plans.`
        };
    }

    /**
     * Test AI service connection
     */
    async testConnection() {
        try {
            this.connectionStatus = 'connecting';
            
            const testMessage = 'Test connection';
            const response = await this.makeAPIRequest(testMessage, 'chatAssistant');
            
            if (response && response.content) {
                this.connectionStatus = 'connected';
                return true;
            } else {
                throw new Error('Invalid response from AI service');
            }
            
        } catch (error) {
            this.connectionStatus = 'error';
            throw error;
        }
    }

    /**
     * Setup request queue processing
     */
    setupRequestQueue() {
        setInterval(() => {
            this.processRequestQueue();
        }, 1000);
    }

    /**
     * Process request queue
     */
    async processRequestQueue() {
        if (this.isProcessing || this.requestQueue.length === 0) return;
        if (this.connectionStatus !== 'connected') return;

        this.isProcessing = true;
        
        try {
            const request = this.requestQueue.shift();
            const response = await this.executeRequest(request);
            request.resolve(response);
        } catch (error) {
            const request = this.requestQueue.shift();
            request.reject(error);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Parse natural language into task data
     */
    async parseTask(naturalLanguage, userContext = {}) {
        try {
            const prompt = this.buildTaskParsingPrompt(naturalLanguage, userContext);
            const response = await this.queueRequest(prompt, 'taskParsing');
            
            return this.extractTaskData(response.content);
            
        } catch (error) {
            utils.logError('Task Parsing', error);
            // Fallback to basic parsing
            return this.fallbackTaskParsing(naturalLanguage);
        }
    }

    /**
     * Build task parsing prompt
     */
    buildTaskParsingPrompt(text, context) {
        const currentUser = window.authModule?.getCurrentUser();
        const existingTasks = utils.loadFromStorage('tasks', []);
        
        return `${this.systemPrompts.taskParsing}
        
        User input: "${text}"
        
        Context:
        - Current date: ${new Date().toISOString().split('T')[0]}
        - User timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}
        - Existing categories: ${[...new Set(existingTasks.map(t => t.category))].join(', ')}
        ${context.preferredWorkingHours ? `- Preferred working hours: ${context.preferredWorkingHours}` : ''}
        
        Return only valid JSON with the structure: {
            "title": "string",
            "description": "string", 
            "priority": "low|medium|high",
            "category": "string",
            "dueDate": "YYYY-MM-DD or null",
            "time": "HH:MM or null",
            "estimatedDuration": "number in minutes or null"
        }`;
    }

    /**
     * Extract task data from AI response
     */
    extractTaskData(aiResponse) {
        try {
            // Try to parse JSON from response
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const taskData = JSON.parse(jsonMatch[0]);
                
                // Validate and clean the data
                return {
                    title: taskData.title || 'Untitled Task',
                    description: taskData.description || '',
                    priority: ['low', 'medium', 'high'].includes(taskData.priority) ? taskData.priority : 'medium',
                    category: taskData.category || 'General',
                    dueDate: this.validateDate(taskData.dueDate),
                    time: this.validateTime(taskData.time),
                    estimatedDuration: taskData.estimatedDuration || null
                };
            }
        } catch (error) {
            utils.logError('Extract Task Data', error);
        }
        
        // Fallback if parsing fails
        return this.fallbackTaskParsing(aiResponse);
    }

    /**
     * Fallback task parsing
     */
    fallbackTaskParsing(text) {
        return {
            title: text.substring(0, 100),
            description: text.length > 100 ? text : '',
            priority: 'medium',
            category: 'General',
            dueDate: null,
            time: null,
            estimatedDuration: null
        };
    }

    /**
     * Get task suggestions
     */
    async getTaskSuggestions(tasks, userGoals = []) {
        try {
            const prompt = this.buildTaskSuggestionPrompt(tasks, userGoals);
            const response = await this.queueRequest(prompt, 'taskSuggestion');
            
            return this.parseTaskSuggestions(response.content);
            
        } catch (error) {
            utils.logError('Task Suggestions', error);
            return this.getFallbackSuggestions(tasks);
        }
    }

    /**
     * Build task suggestion prompt
     */
    buildTaskSuggestionPrompt(tasks, userGoals) {
        const taskSummary = tasks.slice(0, 20).map(task => ({
            title: task.title,
            priority: task.priority,
            category: task.category,
            completed: task.completed,
            overdue: task.dueDate && new Date(task.dueDate) < new Date()
        }));

        return `${this.systemPrompts.taskSuggestion}
        
        Current tasks: ${JSON.stringify(taskSummary, null, 2)}
        User goals: ${userGoals.join(', ')}
        
        Provide suggestions in JSON format:
        {
            "priorityAdjustments": [{"taskId": "string", "newPriority": "string", "reason": "string"}],
            "organizationTips": ["string"],
            "productivityInsights": ["string"],
            "suggestedTasks": [{"title": "string", "category": "string", "reason": "string"}]
        }`;
    }

    /**
     * Parse task suggestions
     */
    parseTaskSuggestions(aiResponse) {
        try {
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            utils.logError('Parse Task Suggestions', error);
        }
        
        return this.getFallbackSuggestions();
    }

    /**
     * Get fallback suggestions
     */
    getFallbackSuggestions(tasks = []) {
        const overdueTasks = tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date());
        const highPriorityTasks = tasks.filter(t => !t.completed && t.priority === 'high');
        
        return {
            priorityAdjustments: [],
            organizationTips: [
                'Focus on completing overdue tasks first',
                'Break large tasks into smaller, manageable subtasks',
                'Set specific deadlines for tasks without due dates'
            ],
            productivityInsights: [
                overdueTasks.length > 0 ? `You have ${overdueTasks.length} overdue task(s)` : 'Great job staying on schedule!',
                highPriorityTasks.length > 3 ? 'Consider reviewing your high-priority tasks - you might be overcommitting' : '',
                'Regular task reviews help maintain productivity'
            ].filter(Boolean),
            suggestedTasks: []
        };
    }

    /**
     * Chat with AI assistant
     */
    async chat(message, conversationId = 'default', context = {}) {
        try {
            // Build conversation context prompt
            const conversationHistory = this.getConversationContext(conversationId);
            let fullMessage = message;
            
            // Add A1 PVC FAQ context if available
            if (window.faqLoader && window.faqLoader.initialized) {
                const faqContext = window.faqLoader.getAIContext();
                fullMessage = `${faqContext}\n\nUser Question: ${message}`;
            }
            
            // Add conversation history if this is a continuation
            if (conversationHistory.length > 0) {
                const recentHistory = conversationHistory.slice(-6); // Last 3 exchanges
                const historyText = recentHistory.map(entry => `${entry.role}: ${entry.content}`).join('\n');
                fullMessage = `${fullMessage}\n\nPrevious conversation:\n${historyText}`;
            }
            
            const response = await this.makeAPIRequest(fullMessage, 'chatAssistant');
            
            // Store context for conversation continuity
            this.updateConversationContext(conversationId, message, response.content);
            
            return response.content;
            
        } catch (error) {
            utils.logError('AI Chat', error);
            return `Error: ${error.message}`;
        }
    }

    /**
     * Chat with AI assistant using streaming
     */
    async chatStream(message, conversationId = 'default', onChunk = null, context = {}) {
        try {
            // Build conversation context prompt
            const conversationHistory = this.getConversationContext(conversationId);
            let fullMessage = message;
            
            // Add A1 PVC FAQ context if available
            if (window.faqLoader && window.faqLoader.initialized) {
                const faqContext = window.faqLoader.getAIContext();
                fullMessage = `${faqContext}\n\nUser Question: ${message}`;
            }
            
            // Add conversation history if this is a continuation
            if (conversationHistory.length > 0) {
                const recentHistory = conversationHistory.slice(-6); // Last 3 exchanges
                const historyText = recentHistory.map(entry => `${entry.role}: ${entry.content}`).join('\n');
                fullMessage = `${fullMessage}\n\nPrevious conversation:\n${historyText}`;
            }
            
            const response = await this.makeStreamingAPIRequest(fullMessage, 'chatAssistant', onChunk);
            
            // Store context for conversation continuity
            this.updateConversationContext(conversationId, message, response.content);
            
            return response.content;
            
        } catch (error) {
            utils.logError('AI Chat Stream', error);
            throw error;
        }
    }

    /**
     * Build chat prompt
     */
    buildChatPrompt(message, conversationId, context) {
        const conversationHistory = this.getConversationContext(conversationId);
        const user = window.authModule?.getCurrentUser();
        const tasks = utils.loadFromStorage('tasks', []);
        const upcomingTasks = tasks.filter(t => !t.completed && t.dueDate).slice(0, 5);
        
        return `${this.systemPrompts.chatAssistant}
        
        Current context:
        - User: ${user?.name || 'Unknown'}
        - Date: ${new Date().toLocaleDateString()}
        - Upcoming tasks: ${upcomingTasks.map(t => `${t.title} (due: ${t.dueDate})`).join(', ') || 'None'}
        
        ${conversationHistory.length > 0 ? `Conversation history:
        ${conversationHistory.map(entry => `${entry.role}: ${entry.content}`).join('\n')}` : ''}
        
        User message: ${message}
        
        Respond helpfully and suggest specific actions when appropriate.`;
    }

    /**
     * Generate project plan
     */
    async generateProjectPlan(projectDescription, requirements = {}) {
        try {
            const prompt = this.buildProjectPlanningPrompt(projectDescription, requirements);
            const response = await this.queueRequest(prompt, 'projectPlanning');
            
            return this.parseProjectPlan(response.content);
            
        } catch (error) {
            utils.logError('Project Planning', error);
            return this.getFallbackProjectPlan(projectDescription);
        }
    }

    /**
     * Build project planning prompt
     */
    buildProjectPlanningPrompt(description, requirements) {
        return `${this.systemPrompts.projectPlanning}
        
        Project: ${description}
        
        Requirements:
        - Timeline: ${requirements.timeline || 'Not specified'}
        - Budget: ${requirements.budget || 'Not specified'}
        - Team size: ${requirements.teamSize || 'Not specified'}
        - Priority: ${requirements.priority || 'Medium'}
        
        Return a structured project plan in JSON format:
        {
            "title": "string",
            "description": "string",
            "phases": [
                {
                    "name": "string",
                    "description": "string",
                    "tasks": [{"title": "string", "description": "string", "estimatedHours": number}],
                    "duration": "string"
                }
            ],
            "milestones": [{"name": "string", "description": "string", "deadline": "string"}],
            "risks": ["string"],
            "recommendations": ["string"]
        }`;
    }

    /**
     * Parse project plan
     */
    parseProjectPlan(aiResponse) {
        try {
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            utils.logError('Parse Project Plan', error);
        }
        
        return this.getFallbackProjectPlan();
    }

    /**
     * Get fallback project plan
     */
    getFallbackProjectPlan(description = 'New Project') {
        return {
            title: description,
            description: 'Generated project plan',
            phases: [
                {
                    name: 'Planning',
                    description: 'Define requirements and scope',
                    tasks: [
                        { title: 'Define project scope', description: '', estimatedHours: 4 },
                        { title: 'Create timeline', description: '', estimatedHours: 2 }
                    ],
                    duration: '1 week'
                }
            ],
            milestones: [],
            risks: ['Timeline constraints', 'Resource availability'],
            recommendations: ['Regular progress reviews', 'Clear communication plan']
        };
    }

    /**
     * Queue AI request
     */
    async queueRequest(prompt, type = 'chatAssistant') {
        return new Promise((resolve, reject) => {
            this.requestQueue.push({
                prompt,
                type,
                timestamp: Date.now(),
                resolve,
                reject
            });
        });
    }

    /**
     * Execute AI request
     */
    async executeRequest(request) {
        const { prompt, type } = request;
        return await this.makeAPIRequest(prompt, type);
    }

    /**
     * Make API request to Claude
     */
    async makeAPIRequest(message, type = 'chatAssistant', attempt = 0) {
        if (!this.userEmail || !this.apiKey) {
            throw new Error('User not authenticated or API key not available');
        }

        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userEmail: this.userEmail,
                    message: message,
                    apiKey: this.apiKey
                }),
                signal: AbortSignal.timeout(this.config.timeout)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            return {
                content: data.response || '',
                usage: data.usage || {}
            };

        } catch (error) {
            if (attempt < this.config.retryAttempts) {
                await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * (attempt + 1)));
                return this.makeAPIRequest(message, type, attempt + 1);
            }
            
            throw error;
        }
    }

    /**
     * Make streaming API request to Claude (simulated streaming)
     */
    async makeStreamingAPIRequest(message, type = 'chatAssistant', onChunk = null, attempt = 0) {
        if (!this.userEmail || !this.apiKey) {
            throw new Error('User not authenticated or API key not available');
        }

        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userEmail: this.userEmail,
                    message: message,
                    apiKey: this.apiKey,
                    stream: true
                }),
                signal: AbortSignal.timeout(this.config.timeout)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            const fullContent = data.response || '';
            
            // Simulate streaming by sending chunks character by character
            if (onChunk && fullContent) {
                let currentText = '';
                const words = fullContent.split(' ');
                
                for (let i = 0; i < words.length; i++) {
                    const word = words[i] + (i < words.length - 1 ? ' ' : '');
                    currentText += word;
                    
                    if (onChunk) {
                        onChunk(word, currentText);
                    }
                    
                    // Simulate realistic typing speed
                    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
                }
            }

            return {
                content: fullContent,
                usage: data.usage || {}
            };

        } catch (error) {
            if (attempt < this.config.retryAttempts) {
                await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * (attempt + 1)));
                return this.makeStreamingAPIRequest(message, type, onChunk, attempt + 1);
            }
            
            throw error;
        }
    }

    /**
     * Update conversation context
     */
    updateConversationContext(conversationId, userMessage, aiResponse) {
        if (!this.conversationContext.has(conversationId)) {
            this.conversationContext.set(conversationId, []);
        }
        
        const context = this.conversationContext.get(conversationId);
        context.push(
            { role: 'user', content: userMessage },
            { role: 'assistant', content: aiResponse }
        );
        
        // Keep only last 10 exchanges
        if (context.length > 20) {
            context.splice(0, context.length - 20);
        }
    }

    /**
     * Get conversation context
     */
    getConversationContext(conversationId) {
        return this.conversationContext.get(conversationId) || [];
    }

    /**
     * Clear conversation context
     */
    clearConversationContext(conversationId) {
        this.conversationContext.delete(conversationId);
    }

    /**
     * Validate date string
     */
    validateDate(dateStr) {
        if (!dateStr) return null;
        
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return null;
        
        return dateStr;
    }

    /**
     * Validate time string
     */
    validateTime(timeStr) {
        if (!timeStr) return null;
        
        const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timePattern.test(timeStr) ? timeStr : null;
    }

    /**
     * Get connection status
     */
    getConnectionStatus() {
        return this.connectionStatus;
    }

    /**
     * Get queue length
     */
    getQueueLength() {
        return this.requestQueue.length;
    }

    /**
     * Is processing request
     */
    isProcessingRequest() {
        return this.isProcessing;
    }

    /**
     * Clear request queue
     */
    clearQueue() {
        this.requestQueue.forEach(request => {
            request.reject(new Error('Queue cleared'));
        });
        this.requestQueue = [];
    }

    /**
     * Cleanup service
     */
    cleanup() {
        this.clearQueue();
        this.conversationContext.clear();
        this.initialized = false;
    }
}

// Create and export singleton instance
const aiService = new AIService();

// Make it globally accessible
window.aiService = aiService;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = aiService;
}