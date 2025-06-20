/**
 * AI Chat Module
 * Handles AI chat interface, conversation management, and Claude API integration
 */

class AIChatModule {
    constructor() {
        this.initialized = false;
        this.currentConversation = null;
        this.conversations = [];
        this.eventListeners = [];
        this.isTyping = false;
        this.connectionStatus = 'disconnected';
        this.messageQueue = [];
        
        // AI Configuration
        this.aiConfig = {
            provider: 'claude',
            model: 'claude-3-sonnet',
            maxTokens: 4000,
            temperature: 0.7
        };
    }

    /**
     * Initialize AI Chat module
     */
    initialize() {
        if (this.initialized) return;
        
        try {
            console.log('Initializing AI Chat Module...');
            
            this.loadConversations();
            this.setupEventListeners();
            this.setupChatInterface();
            this.initializeAIConnection();
            this.setupMessageHandling();
            
            this.initialized = true;
            console.log('AI Chat Module initialized successfully');
            
        } catch (error) {
            utils.logError('AI Chat Module Initialization', error);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Chat input form
        const chatForm = utils.querySelector('.chat-input-form');
        if (chatForm) {
            const submitListener = utils.addEventListener(chatForm, 'submit', (e) => {
                e.preventDefault();
                this.handleSendMessage();
            });
            this.eventListeners.push(submitListener);
        }

        // Chat input textarea
        const chatInput = utils.querySelector('.chat-input');
        if (chatInput) {
            const keyListener = utils.addEventListener(chatInput, 'keydown', (e) => {
                this.handleInputKeydown(e);
            });
            this.eventListeners.push(keyListener);

            const inputListener = utils.addEventListener(chatInput, 'input', () => {
                this.autoResizeInput();
                this.handleTyping();
            });
            this.eventListeners.push(inputListener);
        }

        // New chat button
        const newChatBtn = utils.querySelector('.new-chat-btn');
        if (newChatBtn) {
            const clickListener = utils.addEventListener(newChatBtn, 'click', () => {
                this.createNewConversation();
            });
            this.eventListeners.push(clickListener);
        }

        // Conversation history items
        this.setupConversationListeners();

        // Chat settings
        this.setupChatSettings();

        // Suggestion buttons
        this.setupSuggestionButtons();
    }

    /**
     * Setup conversation history listeners
     */
    setupConversationListeners() {
        const historyItems = utils.querySelectorAll('.history-item');
        historyItems.forEach(item => {
            const clickListener = utils.addEventListener(item, 'click', (e) => {
                const conversationId = e.currentTarget.dataset.conversationId;
                this.loadConversation(conversationId);
            });
            this.eventListeners.push(clickListener);
        });
    }

    /**
     * Setup chat settings
     */
    setupChatSettings() {
        const settingsBtn = utils.querySelector('.chat-settings-btn');
        if (settingsBtn) {
            const clickListener = utils.addEventListener(settingsBtn, 'click', () => {
                this.showChatSettings();
            });
            this.eventListeners.push(clickListener);
        }
    }

    /**
     * Setup suggestion buttons
     */
    setupSuggestionButtons() {
        const suggestionBtns = utils.querySelectorAll('.suggestion-btn');
        suggestionBtns.forEach(btn => {
            const clickListener = utils.addEventListener(btn, 'click', (e) => {
                const suggestion = e.target.textContent;
                this.handleSuggestionClick(suggestion);
            });
            this.eventListeners.push(clickListener);
        });
    }

    /**
     * Setup chat interface
     */
    setupChatInterface() {
        this.updateConnectionStatus();
        this.displayWelcomeMessage();
        this.updateConversationList();
    }

    /**
     * Initialize AI connection
     */
    async initializeAIConnection() {
        try {
            // Check if AI service is available and user is authenticated
            if (window.aiService && window.authModule && window.authModule.isAuthenticated()) {
                this.connectionStatus = 'connecting';
                this.updateConnectionStatus();
                
                // Wait for AI service to be ready
                if (!window.aiService.userEmail) {
                    const user = window.authModule.getCurrentUser();
                    if (user && user.email) {
                        await window.aiService.setUserEmail(user.email);
                    }
                }
                
                if (window.aiService.connectionStatus === 'connected') {
                    this.connectionStatus = 'connected';
                    console.log('AI connection established');
                } else {
                    throw new Error('AI service not ready');
                }
            } else {
                this.connectionStatus = 'disconnected';
                console.log('AI service not available or user not authenticated');
            }
            
        } catch (error) {
            this.connectionStatus = 'error';
            utils.logError('AI Connection', error);
        } finally {
            this.updateConnectionStatus();
        }
    }

    /**
     * Test AI connection
     */
    async testAIConnection() {
        try {
            // This would test the actual AI service
            // For now, simulate connection test
            await new Promise(resolve => setTimeout(resolve, 1000));
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Update connection status display
     */
    updateConnectionStatus() {
        const statusIndicator = utils.querySelector('.status-indicator');
        const statusText = utils.querySelector('.chat-status');
        
        if (statusIndicator) {
            statusIndicator.className = `status-indicator ${this.connectionStatus}`;
        }
        
        if (statusText) {
            const statusMessages = {
                'connecting': 'Connecting to Claude AI...',
                'connected': 'Claude AI Ready',
                'disconnected': 'Disconnected',
                'error': 'Connection Error'
            };
            statusText.textContent = statusMessages[this.connectionStatus] || 'Unknown Status';
        }
    }

    /**
     * Load conversations from storage
     */
    loadConversations() {
        this.conversations = utils.loadFromStorage('conversations', []);
        if (this.conversations.length === 0) {
            this.createNewConversation();
        } else {
            this.currentConversation = this.conversations[0];
        }
    }

    /**
     * Create new conversation
     */
    createNewConversation() {
        const newConversation = {
            id: utils.generateId('conv'),
            title: 'New Chat',
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.conversations.unshift(newConversation);
        this.currentConversation = newConversation;
        this.saveConversations();
        this.updateConversationList();
        this.clearChatMessages();
        this.displayWelcomeMessage();
    }

    /**
     * Load specific conversation
     */
    loadConversation(conversationId) {
        const conversation = this.conversations.find(conv => conv.id === conversationId);
        if (conversation) {
            this.currentConversation = conversation;
            this.displayConversation(conversation);
            this.updateConversationList();
        }
    }

    /**
     * Display conversation messages
     */
    displayConversation(conversation) {
        const messagesContainer = utils.querySelector('.chat-messages');
        if (!messagesContainer) return;

        this.clearChatMessages();

        if (conversation.messages.length === 0) {
            this.displayWelcomeMessage();
            return;
        }

        conversation.messages.forEach(message => {
            this.displayMessage(message, false);
        });

        this.scrollToBottom();
    }

    /**
     * Update conversation list display
     */
    updateConversationList() {
        const historyList = utils.querySelector('.history-list');
        if (!historyList) return;

        if (this.conversations.length === 0) {
            historyList.innerHTML = '<div class="empty-history">No conversations yet</div>';
            return;
        }

        historyList.innerHTML = this.conversations.map(conv => `
            <div class="history-item ${conv.id === this.currentConversation?.id ? 'active' : ''}" 
                 data-conversation-id="${conv.id}">
                <div class="history-title-text">${utils.truncate(conv.title, 25)}</div>
                <div class="history-preview">${this.getConversationPreview(conv)}</div>
                <div class="history-time">${utils.getRelativeDate(conv.updatedAt)}</div>
                <button class="history-delete-btn" data-conversation-id="${conv.id}" title="Delete">🗑️</button>
            </div>
        `).join('');

        // Re-setup conversation listeners
        this.setupConversationListeners();
        this.setupDeleteListeners();
    }

    /**
     * Setup delete conversation listeners
     */
    setupDeleteListeners() {
        const deleteButtons = utils.querySelectorAll('.history-delete-btn');
        deleteButtons.forEach(btn => {
            const clickListener = utils.addEventListener(btn, 'click', (e) => {
                e.stopPropagation();
                const conversationId = e.target.dataset.conversationId;
                this.deleteConversation(conversationId);
            });
            this.eventListeners.push(clickListener);
        });
    }

    /**
     * Delete conversation
     */
    deleteConversation(conversationId) {
        if (this.conversations.length <= 1) {
            window.mainApp?.showNotification('Cannot delete the last conversation', 'warning');
            return;
        }

        this.conversations = this.conversations.filter(conv => conv.id !== conversationId);
        
        if (this.currentConversation?.id === conversationId) {
            this.currentConversation = this.conversations[0];
            this.loadConversation(this.currentConversation.id);
        }

        this.saveConversations();
        this.updateConversationList();
    }

    /**
     * Get conversation preview text
     */
    getConversationPreview(conversation) {
        if (conversation.messages.length === 0) {
            return 'New conversation';
        }

        const lastMessage = conversation.messages[conversation.messages.length - 1];
        return utils.truncate(lastMessage.content, 50);
    }

    /**
     * Setup message handling
     */
    setupMessageHandling() {
        // Handle message queue processing
        this.processMessageQueue();
    }

    /**
     * Handle input keydown
     */
    handleInputKeydown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleSendMessage();
        }
    }

    /**
     * Auto-resize chat input
     */
    autoResizeInput() {
        const chatInput = utils.querySelector('.chat-input');
        if (chatInput) {
            chatInput.style.height = 'auto';
            chatInput.style.height = Math.min(chatInput.scrollHeight, 150) + 'px';
        }
    }

    /**
     * Handle typing indicator
     */
    handleTyping() {
        if (!this.isTyping) {
            this.isTyping = true;
            // Could show typing indicator to other users if this was collaborative
        }

        // Reset typing indicator after delay
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.isTyping = false;
        }, 1000);
    }

    /**
     * Handle send message
     */
    async handleSendMessage() {
        const chatInput = utils.querySelector('.chat-input');
        if (!chatInput) return;

        const messageText = chatInput.value.trim();
        if (!messageText) return;

        if (this.connectionStatus !== 'connected') {
            window.mainApp?.showNotification('AI is not connected. Please try again later.', 'error');
            return;
        }

        try {
            // Create user message
            const userMessage = {
                id: utils.generateId('msg'),
                role: 'user',
                content: messageText,
                timestamp: new Date().toISOString()
            };

            // Clear input
            chatInput.value = '';
            this.autoResizeInput();

            // Add user message to conversation
            this.addMessageToConversation(userMessage);
            this.displayMessage(userMessage, true);

            // Update conversation title if this is the first message
            if (this.currentConversation.messages.length === 1) {
                this.updateConversationTitle(messageText);
            }

            // Show AI typing indicator
            this.showTypingIndicator();

            // Send to AI and get response
            const aiResponse = await this.sendToAI(messageText);
            
            // Hide typing indicator
            this.hideTypingIndicator();

            if (aiResponse) {
                const aiMessage = {
                    id: utils.generateId('msg'),
                    role: 'assistant',
                    content: aiResponse,
                    timestamp: new Date().toISOString()
                };

                this.addMessageToConversation(aiMessage);
                this.displayMessage(aiMessage, true);
            }

        } catch (error) {
            this.hideTypingIndicator();
            utils.logError('Send Message', error);
            window.mainApp?.showNotification('Failed to send message', 'error');
        }
    }

    /**
     * Add message to current conversation
     */
    addMessageToConversation(message) {
        if (!this.currentConversation) return;

        this.currentConversation.messages.push(message);
        this.currentConversation.updatedAt = new Date().toISOString();
        this.saveConversations();
    }

    /**
     * Update conversation title
     */
    updateConversationTitle(firstMessage) {
        if (!this.currentConversation) return;

        // Generate title from first message
        const title = utils.truncate(firstMessage, 30);
        this.currentConversation.title = title;
        this.saveConversations();
        this.updateConversationList();
    }

    /**
     * Display message in chat
     */
    displayMessage(message, animate = false) {
        const messagesContainer = utils.querySelector('.chat-messages');
        if (!messagesContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.role}-message`;
        messageElement.innerHTML = `
            <div class="message-avatar">${message.role === 'user' ? '👤' : '🤖'}</div>
            <div class="message-content">
                <div class="message-text">${this.formatMessageContent(message.content)}</div>
                <div class="message-timestamp">${this.formatTimestamp(message.timestamp)}</div>
                ${message.role === 'assistant' ? this.generateSuggestionButtons(message.content) : ''}
            </div>
        `;

        messagesContainer.appendChild(messageElement);

        if (animate) {
            utils.animate(messageElement, 'fadeInUp');
        }

        this.scrollToBottom();
    }

    /**
     * Format message content (handle markdown, links, etc.)
     */
    formatMessageContent(content) {
        // Basic formatting - could be enhanced with markdown parser
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    /**
     * Format timestamp
     */
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
        });
    }

    /**
     * Generate suggestion buttons based on AI response
     */
    generateSuggestionButtons(content) {
        // Generate contextual suggestions based on AI response
        const suggestions = this.extractSuggestions(content);
        
        if (suggestions.length === 0) return '';

        return `
            <div class="suggestion-buttons">
                ${suggestions.map(suggestion => 
                    `<button class="suggestion-btn">${suggestion}</button>`
                ).join('')}
            </div>
        `;
    }

    /**
     * Extract suggestions from AI response
     */
    extractSuggestions(content) {
        // Simple suggestion extraction - could be enhanced with AI
        const suggestions = [];
        
        if (content.includes('task') || content.includes('schedule')) {
            suggestions.push('Create a task');
        }
        if (content.includes('meeting') || content.includes('calendar')) {
            suggestions.push('Schedule meeting');
        }
        if (content.includes('remind') || content.includes('notification')) {
            suggestions.push('Set reminder');
        }
        
        return suggestions.slice(0, 3); // Max 3 suggestions
    }

    /**
     * Handle suggestion button click
     */
    handleSuggestionClick(suggestion) {
        const chatInput = utils.querySelector('.chat-input');
        if (chatInput) {
            chatInput.value = suggestion;
            chatInput.focus();
            this.autoResizeInput();
        }
    }

    /**
     * Show typing indicator
     */
    showTypingIndicator() {
        const messagesContainer = utils.querySelector('.chat-messages');
        if (!messagesContainer) return;

        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message ai-message typing-indicator';
        typingIndicator.id = 'typingIndicator';
        typingIndicator.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;

        messagesContainer.appendChild(typingIndicator);
        this.scrollToBottom();
    }

    /**
     * Hide typing indicator
     */
    hideTypingIndicator() {
        const typingIndicator = utils.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    /**
     * Send message to AI
     */
    async sendToAI(message) {
        try {
            // Use the AI service module
            if (window.aiService && window.aiService.initialized) {
                const response = await window.aiService.chat(message, this.currentConversation?.id || 'default');
                return response;
            } else {
                throw new Error('AI service not available');
            }
            
        } catch (error) {
            utils.logError('AI Service Call', error);
            return `Error: ${error.message}`;
        }
    }

    /**
     * Build conversation context for AI
     */
    buildConversationContext() {
        if (!this.currentConversation) return [];
        
        // Return recent messages for context (last 10)
        return this.currentConversation.messages
            .slice(-10)
            .map(msg => ({
                role: msg.role,
                content: msg.content
            }));
    }

    /**
     * Call AI service
     */
    async callAIService(message, context) {
        try {
            // This would integrate with your actual AI service (Claude API, etc.)
            // For now, simulate AI response
            
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing time
            
            // Generate contextual response based on message content
            return this.generateMockAIResponse(message);
            
        } catch (error) {
            throw new Error('AI service unavailable');
        }
    }

    /**
     * Generate mock AI response (placeholder)
     */
    generateMockAIResponse(message) {
        const responses = {
            'task': "I'd be happy to help you manage your tasks! You can create new tasks, set priorities, and organize them by categories. What specific task would you like to work on?",
            'meeting': "I can help you schedule meetings and manage your calendar. Would you like me to help you set up a new meeting or check your availability?",
            'calendar': "Let me help you with your calendar management. I can show you upcoming events, help schedule new ones, or find available time slots.",
            'project': "Project management is one of my specialties! I can help you organize tasks, track progress, and manage deadlines. What project are you working on?",
            'help': "I'm here to assist you with task management, scheduling, project organization, and more. You can ask me to create tasks, schedule meetings, or provide insights about your productivity."
        };

        // Find matching response
        const lowerMessage = message.toLowerCase();
        for (const [key, response] of Object.entries(responses)) {
            if (lowerMessage.includes(key)) {
                return response;
            }
        }

        // Default response
        return "I understand you're asking about: \"" + message + "\". I'm here to help with task management, scheduling, and productivity. How can I assist you further?";
    }

    /**
     * Display welcome message
     */
    displayWelcomeMessage() {
        const welcomeMessage = {
            id: utils.generateId('msg'),
            role: 'assistant',
            content: 'Hello! I\'m your AI assistant, powered by Claude. I can help you manage tasks, schedule meetings, organize projects, and boost your productivity. How can I help you today?',
            timestamp: new Date().toISOString()
        };

        this.displayMessage(welcomeMessage, false);
    }

    /**
     * Clear chat messages
     */
    clearChatMessages() {
        const messagesContainer = utils.querySelector('.chat-messages');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }
    }

    /**
     * Scroll to bottom of chat
     */
    scrollToBottom() {
        const messagesContainer = utils.querySelector('.chat-messages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    /**
     * Save conversations to storage
     */
    saveConversations() {
        utils.saveToStorage('conversations', this.conversations);
    }

    /**
     * Show chat settings modal
     */
    showChatSettings() {
        // Implementation for chat settings modal
        window.mainApp?.showNotification('Chat settings coming soon!', 'info');
    }

    /**
     * Process message queue
     */
    processMessageQueue() {
        if (this.messageQueue.length === 0) return;
        
        // Process queued messages when connection is restored
        setInterval(() => {
            if (this.connectionStatus === 'connected' && this.messageQueue.length > 0) {
                const message = this.messageQueue.shift();
                this.handleSendMessage(message);
            }
        }, 1000);
    }

    /**
     * Cleanup module
     */
    cleanup() {
        this.eventListeners.forEach(listener => {
            if (listener && listener.remove) {
                listener.remove();
            }
        });
        this.eventListeners = [];
        this.initialized = false;
    }
}

// Create and export singleton instance
const aiChatModule = new AIChatModule();

// Make it globally accessible
window.aiChatModule = aiChatModule;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = aiChatModule;
}