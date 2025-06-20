/**
 * AI Chat Module
 * Handles AI chat interface and Claude API integration
 */

class AIChatModule {
    constructor() {
        this.initialized = false;
        this.connectionStatus = 'disconnected';
        this.currentChatId = null;
        this.chatHistory = [];
        this.currentMessages = [];
    }

    /**
     * Initialize AI Chat module
     */
    initialize() {
        if (this.initialized) return;
        
        try {
            console.log('Initializing AI Chat Module...');
            
            this.setupEventListeners();
            this.updateConnectionStatus();
            this.loadChatHistory();
            this.createNewChat(); // Start with a new chat
            
            this.initialized = true;
            console.log('AI Chat Module initialized successfully');
            
        } catch (error) {
            console.error('AI Chat Module Initialization error:', error);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        console.log('Setting up AI Chat event listeners...');
        
        // Chat input
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            console.log('Found chatInput element');
            
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSendMessage();
                }
            });
        } else {
            console.error('chatInput element not found!');
        }

        // Send button
        const sendBtn = document.getElementById('sendChatBtn');
        if (sendBtn) {
            console.log('Found sendChatBtn element');
            
            sendBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Send button clicked!');
                this.handleSendMessage();
            });
        } else {
            console.error('sendChatBtn element not found!');
        }

        // New chat button
        const newChatBtn = document.getElementById('newChatBtn');
        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => {
                this.saveCurrentChat();
                this.createNewChat();
            });
        }

        // Clear chat button
        const clearChatBtn = document.getElementById('clearChatBtn');
        if (clearChatBtn) {
            clearChatBtn.addEventListener('click', () => {
                this.clearAllChats();
            });
        }
    }

    /**
     * Handle send message
     */
    async handleSendMessage() {
        console.log('handleSendMessage called');
        
        const chatInput = document.getElementById('chatInput');
        if (!chatInput) {
            console.error('Chat input not found');
            return;
        }

        const message = chatInput.value.trim();
        console.log('Message to send:', message);
        
        if (!message) {
            console.log('Empty message, not sending');
            return;
        }

        try {
            // Clear input
            chatInput.value = '';
            
            // Add user message to chat
            this.addMessageToChat('user', message);
            
            // Show typing indicator
            this.showTypingIndicator();
            
            // Send to AI using streaming
            await this.sendToAIStreaming(message);
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.hideTypingIndicator();
            this.addMessageToChat('assistant', 'Sorry, I encountered an error. Please try again.');
        }
    }

    /**
     * Add message to chat
     */
    addMessageToChat(role, content) {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) {
            console.error('Chat messages container not found');
            return;
        }

        const messageElement = document.createElement('div');
        messageElement.className = `message ${role}-message`;
        
        const avatar = role === 'user' ? '👤' : '🤖';
        const timestamp = new Date().toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
        });

        messageElement.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-text">${this.formatMessage(content)}</div>
                <div class="message-timestamp">${timestamp}</div>
            </div>
        `;

        messagesContainer.appendChild(messageElement);
        this.scrollToBottom();

        // Add message to current conversation
        this.currentMessages.push({
            role: role,
            content: content,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Format message content
     */
    formatMessage(content) {
        return content
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }

    /**
     * Show typing indicator
     */
    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;

        // Remove existing typing indicator
        this.hideTypingIndicator();

        const typingElement = document.createElement('div');
        typingElement.className = 'message ai-message typing-indicator';
        typingElement.id = 'typingIndicator';
        typingElement.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;

        messagesContainer.appendChild(typingElement);
        this.scrollToBottom();
    }

    /**
     * Hide typing indicator
     */
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    /**
     * Scroll to bottom of chat
     */
    scrollToBottom() {
        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    /**
     * Send message to AI
     */
    async sendToAI(message) {
        console.log('Sending to AI:', message);
        
        // Check if AI service is available
        if (window.aiService && window.aiService.initialized) {
            try {
                console.log('Using AI service');
                const response = await window.aiService.chat(message, 'default');
                return response;
            } catch (error) {
                console.error('AI service error:', error);
                return `Error: ${error.message}`;
            }
        } else {
            // Mock response for testing
            console.log('AI service not available, using mock response');
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
            
            const responses = [
                `I received your message: "${message}". I'm here to help with your productivity and task management!`,
                `Thanks for your message about "${message}". How can I assist you further?`,
                `I understand you're asking about "${message}". I can help you organize tasks, schedule meetings, and manage projects.`
            ];
            
            return responses[Math.floor(Math.random() * responses.length)];
        }
    }

    /**
     * Send message to AI using streaming
     */
    async sendToAIStreaming(message) {
        console.log('Sending to AI with streaming:', message);
        
        // Check if AI service is available
        if (window.aiService && window.aiService.initialized) {
            try {
                console.log('Using AI service with streaming');
                console.log('AI service connection status:', window.aiService.connectionStatus);
                
                // Create a streaming message element
                const streamingMessage = this.createStreamingMessage();
                
                await window.aiService.chatStream(message, this.currentChatId, (chunk, fullContent) => {
                    console.log('Received chunk:', chunk);
                    this.updateStreamingMessage(streamingMessage, chunk, fullContent);
                });
                
                // Finish streaming animation
                this.finishStreamingMessage(streamingMessage);
                
                // Hide typing indicator after streaming is complete
                this.hideTypingIndicator();
                
                // Get the final content and add to current messages
                const finalContent = streamingMessage.querySelector('.message-text').textContent;
                this.currentMessages.push({
                    role: 'assistant',
                    content: finalContent,
                    timestamp: new Date().toISOString()
                });
                
            } catch (error) {
                console.error('AI service streaming error:', error);
                this.hideTypingIndicator();
                this.addMessageToChat('assistant', `Error: ${error.message}`);
            }
        } else {
            // Mock streaming response for testing
            console.log('AI service not available, using mock streaming response');
            
            this.hideTypingIndicator();
            const streamingMessage = this.createStreamingMessage();
            
            const fullResponse = `I received your message: "${message}". I'm here to help with your productivity and task management! I can assist you with organizing tasks, scheduling meetings, creating projects, and providing intelligent insights about your workflow.`;
            
            // Simulate streaming by adding text word by word for better effect
            let currentText = '';
            const words = fullResponse.split(' ');
            
            for (let i = 0; i < words.length; i++) {
                const word = words[i] + (i < words.length - 1 ? ' ' : '');
                currentText += word;
                this.updateStreamingMessage(streamingMessage, word, currentText);
                await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50)); // Realistic typing delay
            }
            
            // Finish streaming animation
            this.finishStreamingMessage(streamingMessage);
            
            // Add to current messages
            this.currentMessages.push({
                role: 'assistant',
                content: fullResponse,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Create new chat
     */
    createNewChat() {
        // Generate new chat ID
        this.currentChatId = this.generateChatId();
        this.currentMessages = [];

        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            messagesContainer.innerHTML = `
                <div class="message ai-message">
                    <div class="message-avatar">🤖</div>
                    <div class="message-content">
                        <p>Hello! I'm your AI assistant. I can help you manage tasks, schedule appointments, and organize your projects. Try saying something like:</p>
                        <ul>
                            <li>"Schedule a meeting with the team tomorrow at 2pm"</li>
                            <li>"What do I have planned for next week?"</li>
                            <li>"Create a project for the new website redesign"</li>
                        </ul>
                    </div>
                </div>
            `;
        }

        // Add welcome message to current messages
        this.currentMessages.push({
            role: 'assistant',
            content: "Hello! I'm your AI assistant. I can help you manage tasks, schedule appointments, and organize your projects.",
            timestamp: new Date().toISOString()
        });

        this.updateHistoryDisplay();
    }

    /**
     * Update connection status
     */
    updateConnectionStatus() {
        const statusIndicator = document.querySelector('.status-indicator');
        const statusText = document.querySelector('.chat-status');
        
        // Check AI service status
        if (window.aiService && window.aiService.connectionStatus === 'connected') {
            this.connectionStatus = 'connected';
        } else {
            this.connectionStatus = 'disconnected';
        }
        
        if (statusIndicator) {
            statusIndicator.className = `status-indicator ${this.connectionStatus === 'connected' ? 'online' : 'offline'}`;
        }
        
        if (statusText) {
            statusText.textContent = this.connectionStatus === 'connected' ? 'Claude AI Ready' : 'Claude AI Disconnected';
        }
    }

    /**
     * Create streaming message element
     */
    createStreamingMessage() {
        console.log('Creating streaming message element');
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) {
            console.error('Chat messages container not found');
            return null;
        }

        // Hide typing indicator
        this.hideTypingIndicator();

        const messageElement = document.createElement('div');
        messageElement.className = 'message assistant-message streaming';
        
        const timestamp = new Date().toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
        });

        messageElement.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <div class="message-text"></div>
                <div class="message-timestamp">${timestamp}</div>
            </div>
        `;

        messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
        
        console.log('Streaming message element created successfully');
        return messageElement;
    }

    /**
     * Update streaming message content
     */
    updateStreamingMessage(messageElement, chunk, fullContent) {
        if (!messageElement) return;
        
        const messageText = messageElement.querySelector('.message-text');
        if (messageText) {
            messageText.innerHTML = this.formatMessage(fullContent);
            this.scrollToBottom();
        }
    }

    /**
     * Finish streaming message
     */
    finishStreamingMessage(messageElement) {
        if (!messageElement) return;
        
        // Remove streaming class to stop the pulse animation
        messageElement.classList.remove('streaming');
    }

    /**
     * Save current chat to history
     */
    saveCurrentChat() {
        if (!this.currentChatId || this.currentMessages.length <= 1) return;

        const userEmail = this.getCurrentUserEmail();
        if (!userEmail) return;

        // Get first user message for title
        const firstUserMessage = this.currentMessages.find(msg => msg.role === 'user');
        const title = firstUserMessage ? 
            firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '') :
            'New Conversation';

        const chatData = {
            id: this.currentChatId,
            title: title,
            messages: this.currentMessages,
            timestamp: new Date().toISOString(),
            userEmail: userEmail
        };

        // Add to history
        this.chatHistory.unshift(chatData);

        // Keep only last 50 conversations
        if (this.chatHistory.length > 50) {
            this.chatHistory = this.chatHistory.slice(0, 50);
        }

        // Save to localStorage
        this.saveChatHistory();
        this.updateHistoryDisplay();
    }

    /**
     * Load chat history from localStorage
     */
    loadChatHistory() {
        const userEmail = this.getCurrentUserEmail();
        if (!userEmail) return;

        const storageKey = `chatHistory_${userEmail}`;
        this.chatHistory = window.Utils.loadFromStorage(storageKey, []);
    }

    /**
     * Save chat history to localStorage
     */
    saveChatHistory() {
        const userEmail = this.getCurrentUserEmail();
        if (!userEmail) return;

        const storageKey = `chatHistory_${userEmail}`;
        window.Utils.saveToStorage(storageKey, this.chatHistory);
    }

    /**
     * Update history display in sidebar
     */
    updateHistoryDisplay() {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;

        if (this.chatHistory.length === 0) {
            historyList.innerHTML = `
                <div class="empty-history">
                    <div class="empty-icon">💭</div>
                    <p>No conversations yet</p>
                    <span>Start chatting to see history</span>
                </div>
            `;
            return;
        }

        historyList.innerHTML = this.chatHistory.map(chat => `
            <div class="history-item ${chat.id === this.currentChatId ? 'active' : ''}" 
                 data-chat-id="${chat.id}">
                <div class="history-item-title">${chat.title}</div>
                <div class="history-item-date">${this.formatDate(chat.timestamp)}</div>
                <div class="history-item-actions">
                    <button class="history-action-btn load-chat" data-chat-id="${chat.id}" title="Load chat">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                        </svg>
                    </button>
                    <button class="history-action-btn delete-chat" data-chat-id="${chat.id}" title="Delete chat">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3,6 5,6 21,6"></polyline>
                            <path d="m19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners for history items
        this.setupHistoryEventListeners();
    }

    /**
     * Setup event listeners for history items
     */
    setupHistoryEventListeners() {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;

        // Load chat buttons
        const loadButtons = historyList.querySelectorAll('.load-chat');
        loadButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const chatId = button.getAttribute('data-chat-id');
                this.loadChat(chatId);
            });
        });

        // Delete chat buttons
        const deleteButtons = historyList.querySelectorAll('.delete-chat');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const chatId = button.getAttribute('data-chat-id');
                this.deleteChat(chatId);
            });
        });

        // History item clicks
        const historyItems = historyList.querySelectorAll('.history-item');
        historyItems.forEach(item => {
            item.addEventListener('click', () => {
                const chatId = item.getAttribute('data-chat-id');
                this.loadChat(chatId);
            });
        });
    }

    /**
     * Load a specific chat from history
     */
    loadChat(chatId) {
        const chat = this.chatHistory.find(c => c.id === chatId);
        if (!chat) return;

        // Save current chat if it has messages
        if (this.currentMessages.length > 1) {
            this.saveCurrentChat();
        }

        // Load the selected chat
        this.currentChatId = chatId;
        this.currentMessages = [...chat.messages];

        // Display messages
        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
            
            chat.messages.forEach(message => {
                const messageElement = document.createElement('div');
                messageElement.className = `message ${message.role}-message`;
                
                const avatar = message.role === 'user' ? '👤' : '🤖';
                const timestamp = new Date(message.timestamp).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit' 
                });

                messageElement.innerHTML = `
                    <div class="message-avatar">${avatar}</div>
                    <div class="message-content">
                        <div class="message-text">${this.formatMessage(message.content)}</div>
                        <div class="message-timestamp">${timestamp}</div>
                    </div>
                `;

                messagesContainer.appendChild(messageElement);
            });

            this.scrollToBottom();
        }

        this.updateHistoryDisplay();
    }

    /**
     * Delete a chat from history
     */
    deleteChat(chatId) {
        if (confirm('Are you sure you want to delete this conversation?')) {
            this.chatHistory = this.chatHistory.filter(chat => chat.id !== chatId);
            this.saveChatHistory();
            this.updateHistoryDisplay();

            // If we deleted the current chat, create a new one
            if (this.currentChatId === chatId) {
                this.createNewChat();
            }
        }
    }

    /**
     * Clear all chats
     */
    clearAllChats() {
        if (confirm('Are you sure you want to delete all conversations? This cannot be undone.')) {
            this.chatHistory = [];
            this.saveChatHistory();
            this.createNewChat();
        }
    }

    /**
     * Generate unique chat ID
     */
    generateChatId() {
        return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get current user email
     */
    getCurrentUserEmail() {
        if (window.authModule && window.authModule.getCurrentUser()) {
            return window.authModule.getCurrentUser().email;
        }
        return null;
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'long' });
        if (diffDays < 30) return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    /**
     * Cleanup module
     */
    cleanup() {
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