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
        // Chat input
        const chatInput = utils.getElementById('chatInput');
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

        // Send chat button
        const sendChatBtn = utils.getElementById('sendChatBtn');
        if (sendChatBtn) {
            const clickListener = utils.addEventListener(sendChatBtn, 'click', (e) => {
                e.preventDefault();
                this.handleSendMessage();
            });
            this.eventListeners.push(clickListener);
        }

        // New chat button
        const newChatBtn = utils.getElementById('newChatBtn');
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
     * Create enhanced chat interface with modern features
     */
    createEnhancedChatInterface() {
        // Enhanced chat input container
        const inputContainer = utils.querySelector('.chat-input-container');
        if (inputContainer) {
            // Add voice input and attachment buttons
            const chatInput = utils.getElementById('chatInput');
            if (chatInput && !utils.querySelector('.input-enhancement-controls')) {
                const enhancementControls = document.createElement('div');
                enhancementControls.className = 'input-enhancement-controls';
                enhancementControls.innerHTML = `
                    <button class="input-control-btn voice-input-btn" title="Voice input">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                            <line x1="12" y1="19" x2="12" y2="23"/>
                            <line x1="8" y1="23" x2="16" y2="23"/>
                        </svg>
                    </button>
                    <button class="input-control-btn attachment-btn" title="Attach file">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                        </svg>
                    </button>
                    <select id="aiModelSelect" class="ai-model-select" title="Select AI model">
                        <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                        <option value="claude-3-haiku">Claude 3 Haiku</option>
                        <option value="claude-3-opus">Claude 3 Opus</option>
                    </select>
                `;
                
                // Insert before send button
                const sendBtn = utils.getElementById('sendChatBtn');
                if (sendBtn) {
                    inputContainer.insertBefore(enhancementControls, sendBtn);
                }
            }
        }

        // Add smart suggestions section to chat main area
        const chatMain = utils.querySelector('.chat-main');
        if (chatMain && !utils.querySelector('.smart-suggestions-section')) {
            const suggestionsSection = document.createElement('div');
            suggestionsSection.className = 'smart-suggestions-section';
            suggestionsSection.innerHTML = `
                <div class="suggestions-header">
                    <h4>Smart Suggestions</h4>
                    <button class="suggestions-toggle-btn" title="Toggle suggestions">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                    </button>
                </div>
                <div class="suggestions-grid" id="smartSuggestions">
                    <!-- Smart suggestions will be populated here -->
                </div>
            `;
            
            // Insert after chat header
            const chatHeader = utils.querySelector('.chat-header');
            if (chatHeader) {
                chatHeader.parentNode.insertBefore(suggestionsSection, chatHeader.nextSibling);
            }
        }
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
        const chatInput = utils.getElementById('chatInput');
        if (chatInput && chatInput.tagName === 'TEXTAREA') {
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
        const chatInput = utils.getElementById('chatInput');
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
        const chatInput = utils.getElementById('chatInput');
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
     * Export chat conversation
     */
    exportChat() {
        if (!this.currentConversation || this.currentConversation.messages.length === 0) {
            window.mainApp?.showNotification('No conversation to export', 'warning');
            return;
        }

        try {
            const chatData = {
                title: this.currentConversation.title,
                exportDate: new Date().toISOString(),
                messages: this.currentConversation.messages.map(msg => ({
                    role: msg.role,
                    content: msg.content,
                    timestamp: msg.timestamp
                }))
            };

            const chatText = this.formatChatForExport(chatData);
            const blob = new Blob([chatText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `chat-${this.currentConversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            window.mainApp?.showNotification('Chat exported successfully', 'success');
        } catch (error) {
            utils.logError('Export Chat', error);
            window.mainApp?.showNotification('Failed to export chat', 'error');
        }
    }

    /**
     * Format chat data for export
     */
    formatChatForExport(chatData) {
        let output = `Chat Export: ${chatData.title}\n`;
        output += `Exported on: ${new Date(chatData.exportDate).toLocaleString()}\n`;
        output += '='.repeat(60) + '\n\n';

        chatData.messages.forEach(msg => {
            const timestamp = new Date(msg.timestamp).toLocaleString();
            const role = msg.role === 'user' ? 'You' : 'AI Assistant';
            output += `[${timestamp}] ${role}:\n${msg.content}\n\n`;
        });

        return output;
    }

    /**
     * Clear all chat conversations
     */
    clearAllChats() {
        if (this.conversations.length === 0) {
            window.mainApp?.showNotification('No conversations to clear', 'info');
            return;
        }

        if (confirm(`Are you sure you want to delete all ${this.conversations.length} conversation(s)? This action cannot be undone.`)) {
            this.conversations = [];
            this.currentConversation = null;
            this.saveConversations();
            this.createNewConversation();
            this.updateConversationList();
            this.clearChatMessages();
            this.displayWelcomeMessage();
            
            window.mainApp?.showNotification('All conversations cleared', 'success');
        }
    }

    /**
     * Show smart suggestions based on context
     */
    showSmartSuggestions() {
        const suggestionsContainer = utils.getElementById('smartSuggestions');
        if (!suggestionsContainer) return;

        // Context-aware suggestions
        const suggestions = [
            {
                icon: '📝',
                title: 'Create Task',
                description: 'Add a new task to your list',
                action: 'create-task'
            },
            {
                icon: '📅',
                title: 'Schedule Meeting',
                description: 'Plan your next meeting',
                action: 'schedule-meeting'
            },
            {
                icon: '📊',
                title: 'Productivity Report',
                description: 'Get insights on your progress',
                action: 'productivity-report'
            },
            {
                icon: '🎯',
                title: 'Set Goals',
                description: 'Define your objectives',
                action: 'set-goals'
            },
            {
                icon: '💡',
                title: 'Get Ideas',
                description: 'Brainstorm solutions',
                action: 'brainstorm'
            },
            {
                icon: '📈',
                title: 'Analyze Data',
                description: 'Review your metrics',
                action: 'analyze-data'
            }
        ];

        suggestionsContainer.innerHTML = suggestions.map(suggestion => `
            <div class="suggestion-card" data-action="${suggestion.action}">
                <div class="suggestion-icon">${suggestion.icon}</div>
                <div class="suggestion-content">
                    <h5 class="suggestion-title">${suggestion.title}</h5>
                    <p class="suggestion-description">${suggestion.description}</p>
                </div>
                <div class="suggestion-arrow">→</div>
            </div>
        `).join('');

        // Add click handlers for suggestion cards
        const cards = suggestionsContainer.querySelectorAll('.suggestion-card');
        cards.forEach(card => {
            const clickListener = utils.addEventListener(card, 'click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleQuickAction(action);
            });
            this.eventListeners.push(clickListener);
        });
    }

    /**
     * Handle quick actions from suggestions
     */
    handleQuickAction(action) {
        const actions = {
            'create-task': 'Help me create a new task for today',
            'schedule-meeting': 'I need to schedule a meeting. Can you help me plan it?',
            'productivity-report': 'Can you give me a productivity report for this week?',
            'set-goals': 'Help me set some goals for this month',
            'brainstorm': 'I need some creative ideas. Can you help me brainstorm?',
            'analyze-data': 'Can you help me analyze my productivity data?'
        };

        const message = actions[action];
        if (message) {
            const chatInput = utils.getElementById('chatInput');
            if (chatInput) {
                chatInput.value = message;
                chatInput.focus();
                this.autoResizeInput();
            }
        }
    }

    /**
     * Start voice input (Web Speech API)
     */
    startVoiceInput() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            window.mainApp?.showNotification('Voice input not supported in this browser', 'warning');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        const voiceBtn = utils.querySelector('.voice-input-btn');
        if (voiceBtn) {
            voiceBtn.classList.add('recording');
            voiceBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v6m0 6v6"/>
                    <path d="m21 12-6-6-6 6-6-6"/>
                </svg>
            `;
        }

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const chatInput = utils.getElementById('chatInput');
            if (chatInput) {
                chatInput.value = transcript;
                this.autoResizeInput();
                chatInput.focus();
            }
        };

        recognition.onerror = (event) => {
            console.error('Voice recognition error:', event.error);
            window.mainApp?.showNotification('Voice input failed', 'error');
        };

        recognition.onend = () => {
            if (voiceBtn) {
                voiceBtn.classList.remove('recording');
                voiceBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                        <line x1="12" y1="19" x2="12" y2="23"/>
                        <line x1="8" y1="23" x2="16" y2="23"/>
                    </svg>
                `;
            }
        };

        recognition.start();
    }

    /**
     * Show attachment options
     */
    showAttachmentOptions() {
        // Create attachment modal
        const modal = document.createElement('div');
        modal.className = 'modal attachment-modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Attach File</h3>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <div class="attachment-options">
                        <div class="attachment-option" data-type="file">
                            <div class="attachment-icon">📎</div>
                            <div class="attachment-text">
                                <h5>Upload File</h5>
                                <p>Attach documents, images, or other files</p>
                            </div>
                        </div>
                        <div class="attachment-option" data-type="image">
                            <div class="attachment-icon">🖼️</div>
                            <div class="attachment-text">
                                <h5>Upload Image</h5>
                                <p>Share screenshots or pictures</p>
                            </div>
                        </div>
                        <div class="attachment-option" data-type="url">
                            <div class="attachment-icon">🔗</div>
                            <div class="attachment-text">
                                <h5>Share URL</h5>
                                <p>Reference a web page or resource</p>
                            </div>
                        </div>
                    </div>
                    <input type="file" id="fileInput" style="display: none;" multiple>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Handle attachment options
        const options = modal.querySelectorAll('.attachment-option');
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.handleAttachment(type);
                modal.remove();
            });
        });
    }

    /**
     * Handle attachment selection
     */
    handleAttachment(type) {
        switch (type) {
            case 'file':
            case 'image':
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.multiple = true;
                if (type === 'image') {
                    fileInput.accept = 'image/*';
                }
                fileInput.addEventListener('change', (e) => {
                    this.processFileAttachment(e.target.files);
                });
                fileInput.click();
                break;
            case 'url':
                const url = prompt('Enter URL:');
                if (url) {
                    this.addUrlAttachment(url);
                }
                break;
        }
    }

    /**
     * Process file attachments
     */
    processFileAttachment(files) {
        Array.from(files).forEach(file => {
            // For now, just add filename to chat input
            const chatInput = utils.getElementById('chatInput');
            if (chatInput) {
                const currentValue = chatInput.value;
                const attachment = `[Attached: ${file.name}] `;
                chatInput.value = currentValue + attachment;
                this.autoResizeInput();
            }
        });
        window.mainApp?.showNotification(`${files.length} file(s) attached`, 'success');
    }

    /**
     * Add URL attachment
     */
    addUrlAttachment(url) {
        const chatInput = utils.getElementById('chatInput');
        if (chatInput) {
            const currentValue = chatInput.value;
            const attachment = `[URL: ${url}] `;
            chatInput.value = currentValue + attachment;
            this.autoResizeInput();
        }
        window.mainApp?.showNotification('URL attached', 'success');
    }

    /**
     * Change AI model
     */
    changeAIModel(model) {
        this.aiConfig.model = model;
        utils.saveToStorage('aiModel', model);
        window.mainApp?.showNotification(`Switched to ${model}`, 'info');
    }

    /**
     * Use suggestion from suggestion cards
     */
    useSuggestion(suggestion) {
        const chatInput = utils.getElementById('chatInput');
        if (chatInput) {
            chatInput.value = suggestion;
            chatInput.focus();
            this.autoResizeInput();
        }
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