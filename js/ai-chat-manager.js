/**
 * AI Chat Manager
 * Handles chat interface, conversation flow, and AI interactions
 */

class AIChatManager {
    constructor(aiHandler) {
        this.aiHandler = aiHandler;
        this.conversations = [];
        this.currentConversation = null;
        this.isTyping = false;
        this.messageQueue = [];
        this.maxMessages = 100; // Limit conversation history
        this.storageKey = 'assistant_chat_history';
        
        // Chat interface elements
        this.chatContainer = null;
        this.messagesContainer = null;
        this.inputElement = null;
        this.sendButton = null;
        this.historyContainer = null;
        this.isHistoryVisible = false;
        
        // Message templates
        this.templates = {
            welcome: {
                type: 'ai',
                content: `Hello! I'm your AI assistant. I can help you with:
                
• **Task Management** - "Add a meeting tomorrow at 2pm"
• **Schedule Planning** - "What do I have this week?"
• **Project Organization** - "Create a project for website redesign"
• **Productivity Tips** - "How can I be more productive?"

What would you like to do today?`,
                timestamp: new Date().toISOString()
            },
            
            suggestions: [
                "Schedule a meeting with the team tomorrow at 2pm",
                "What tasks do I have due this week?",
                "Create a high-priority task to finish the report",
                "Show me my productivity insights",
                "Help me organize my tasks better"
            ]
        };
        
        this.initializeChatInterface();
        
        // Make this instance globally accessible
        window.chatManager = this;
        
        console.log('AI Chat Manager initialized');
    }

    // Initialize chat interface and event listeners
    initializeChatInterface() {
        this.chatContainer = document.getElementById('ai-chat-view');
        this.messagesContainer = document.getElementById('chatMessages');
        this.inputElement = document.getElementById('chatInput');
        this.sendButton = document.getElementById('sendChatBtn');
        this.historyContainer = document.getElementById('chatHistorySidebar');
        
        if (!this.messagesContainer || !this.inputElement || !this.sendButton) {
            console.warn('Chat interface elements not found');
            return;
        }
        
        // Add event listeners
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        this.inputElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Enable auto-resize for input
        this.inputElement.addEventListener('input', () => {
            this.autoResizeInput();
        });
        
        // Setup chat history controls
        this.setupHistoryControls();
        
        // Initialize with welcome message if chat is empty
        if (this.messagesContainer.children.length <= 1) {
            this.addWelcomeMessage();
        }
        
        // Load conversation history
        this.loadConversationHistory();
    }

    // Setup chat history controls
    setupHistoryControls() {
        const newChatBtn = document.getElementById('newChatBtn');
        const exportChatBtn = document.getElementById('exportChatBtn');
        const clearChatBtn = document.getElementById('clearChatBtn');

        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => this.startNewChat());
        }

        if (exportChatBtn) {
            exportChatBtn.addEventListener('click', () => this.exportChat());
        }

        if (clearChatBtn) {
            clearChatBtn.addEventListener('click', () => this.confirmClearChat());
        }
    }

    // Start a new chat conversation
    startNewChat() {
        // Create new conversation
        this.currentConversation = {
            id: this.generateId(),
            startTime: new Date().toISOString(),
            messages: []
        };
        this.conversations.push(this.currentConversation);

        // Clear messages and add welcome
        this.messagesContainer.innerHTML = '';
        this.addWelcomeMessage();
        
        // Update history display
        this.updateHistoryDisplay();
        
        // Focus input
        this.focus();
    }

    // Update history display in left sidebar
    updateHistoryDisplay() {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;

        if (this.conversations.length === 0) {
            historyList.innerHTML = `
                <div class="empty-history">
                    <div class="empty-icon">💭</div>
                    <p>No conversations yet</p>
                    <span>Start chatting to see history</span>
                </div>
            `;
            return;
        }

        // Sort conversations by most recent
        const sortedConversations = [...this.conversations].sort((a, b) => 
            new Date(b.lastActivity || b.startTime) - new Date(a.lastActivity || a.startTime)
        );

        historyList.innerHTML = sortedConversations.map(conv => {
            const firstUserMessage = conv.messages.find(m => m.type === 'user');
            const title = firstUserMessage ? 
                firstUserMessage.content.substring(0, 40) + (firstUserMessage.content.length > 40 ? '...' : '') :
                'New Conversation';
            
            const date = new Date(conv.startTime).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
            const messageCount = conv.messages.length;
            const isActive = this.currentConversation && conv.id === this.currentConversation.id;

            return `
                <div class="conversation-item ${isActive ? 'active' : ''}" data-conversation-id="${conv.id}">
                    <div class="conversation-title">${title}</div>
                    <div class="conversation-meta">
                        <span class="conversation-date">${date}</span>
                        <span class="conversation-count">${messageCount}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Add click handlers for conversation items
        historyList.querySelectorAll('.conversation-item').forEach(item => {
            item.addEventListener('click', () => {
                const conversationId = item.dataset.conversationId;
                this.loadConversation(conversationId);
            });
        });
    }

    // Load a specific conversation
    loadConversation(conversationId) {
        const conversation = this.conversations.find(c => c.id === conversationId);
        if (!conversation) return;

        this.currentConversation = conversation;
        this.restoreMessages();
        this.updateHistoryDisplay();
    }

    // Confirm clear chat
    confirmClearChat() {
        if (confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
            this.clearChat();
            this.updateHistoryDisplay();
        }
    }

    // Add welcome message to chat
    addWelcomeMessage() {
        this.addMessage(this.templates.welcome);
        this.addSuggestionButtons();
    }

    // Add suggestion buttons for quick actions
    addSuggestionButtons() {
        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.className = 'message ai-message suggestions-message';
        
        suggestionsContainer.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <p class="suggestions-intro">Here are some things you can try:</p>
                <div class="suggestion-buttons">
                    ${this.templates.suggestions.map((suggestion, index) => 
                        `<button class="suggestion-btn" data-suggestion="${suggestion}">
                            <span class="suggestion-icon">${this.getSuggestionIcon(index)}</span>
                            <span class="suggestion-text">${suggestion}</span>
                        </button>`
                    ).join('')}
                </div>
            </div>
        `;
        
        this.messagesContainer.appendChild(suggestionsContainer);
        
        // Add click handlers for suggestion buttons
        suggestionsContainer.querySelectorAll('.suggestion-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const suggestion = btn.dataset.suggestion;
                console.log('Suggestion clicked:', suggestion);
                
                // Add visual feedback - mark as clicked
                btn.classList.add('clicked');
                
                // Disable other suggestion buttons temporarily
                suggestionsContainer.querySelectorAll('.suggestion-btn').forEach(otherBtn => {
                    if (otherBtn !== btn) {
                        otherBtn.style.opacity = '0.5';
                        otherBtn.style.pointerEvents = 'none';
                    }
                });
                
                this.sendSuggestion(suggestion);
            });
        });
        
        this.scrollToBottom();
    }

    // Get icon for suggestion based on index
    getSuggestionIcon(index) {
        const icons = ['📅', '📋', '⚡', '📊', '🎯'];
        return icons[index] || '💡';
    }

    // Send a suggestion as a message
    sendSuggestion(suggestionText) {
        if (!suggestionText || this.isTyping) return;
        
        console.log('Sending suggestion:', suggestionText);
        
        // Fill the input field and trigger visual feedback
        this.inputElement.value = suggestionText;
        
        // Trigger input event to show the text
        this.inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Auto-resize if needed
        this.autoResizeInput();
        
        // Brief delay to show the text in input, then send
        setTimeout(() => {
            this.sendMessage();
        }, 150);
    }

    // Send a new message
    async sendMessage() {
        const messageText = this.inputElement.value.trim();
        if (!messageText || this.isTyping) return;
        
        // Clear input
        this.inputElement.value = '';
        this.autoResizeInput();
        
        // Add user message
        const userMessage = {
            type: 'user',
            content: messageText,
            timestamp: new Date().toISOString()
        };
        
        this.addMessage(userMessage);
        this.saveMessage(userMessage);
        
        // Show typing indicator
        const typingIndicator = this.addTypingIndicator();
        this.isTyping = true;
        
        try {
            // Process message with AI
            const context = this.buildContext();
            const aiResponse = await this.aiHandler.processMessage(messageText, context);
            
            // Remove typing indicator
            if (typingIndicator && typingIndicator.parentNode) {
                typingIndicator.parentNode.removeChild(typingIndicator);
            }
            
            // Add AI response
            const aiMessage = {
                type: 'ai',
                content: aiResponse,
                timestamp: new Date().toISOString()
            };
            
            this.addMessage(aiMessage);
            this.saveMessage(aiMessage);
            
            // Check if the response contains actionable items
            this.processActionableResponse(aiResponse, messageText);
            
        } catch (error) {
            console.error('Error processing message:', error);
            
            // Remove typing indicator
            if (typingIndicator && typingIndicator.parentNode) {
                typingIndicator.parentNode.removeChild(typingIndicator);
            }
            
            // Add error message
            const errorMessage = {
                type: 'ai',
                content: 'I apologize, but I encountered an error processing your request. Please try again or check your connection.',
                timestamp: new Date().toISOString(),
                isError: true
            };
            
            this.addMessage(errorMessage);
        } finally {
            this.isTyping = false;
            this.inputElement.focus();
        }
    }

    // Add a message to the chat interface
    addMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.type}-message ${message.isError ? 'error-message' : ''}`;
        
        const avatar = this.getAvatarForMessage(message);
        const content = this.formatMessageContent(message.content);
        const timestamp = this.formatTimestamp(message.timestamp);
        
        messageElement.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                ${content}
                <div class="message-timestamp">${timestamp}</div>
            </div>
        `;
        
        this.messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
        
        // Limit message history
        this.limitMessageHistory();
        
        return messageElement;
    }

    // Add typing indicator
    addTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'message ai-message typing-indicator';
        
        indicator.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        this.messagesContainer.appendChild(indicator);
        this.scrollToBottom();
        
        return indicator;
    }

    // Get avatar for message type
    getAvatarForMessage(message) {
        if (message.type === 'ai') {
            return '🤖';
        } else if (message.type === 'user') {
            // Try to get user's initial or use default
            if (window.assistant && window.assistant.user && window.assistant.user.name) {
                return window.assistant.user.name.charAt(0).toUpperCase();
            }
            return '👤';
        }
        return '💬';
    }

    // Format message content with markdown-like styling
    formatMessageContent(content) {
        if (!content) return '';
        
        // Convert markdown-like formatting to HTML
        let formatted = content
            // Bold text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Italic text
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Code blocks
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            // Inline code
            .replace(/`(.*?)`/g, '<code>$1</code>')
            // Bullet points
            .replace(/^• (.+)$/gm, '<li>$1</li>')
            // Convert newlines to br tags
            .replace(/\n/g, '<br>');
        
        // Wrap lists in ul tags
        if (formatted.includes('<li>')) {
            formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        }
        
        return `<div class="message-text">${formatted}</div>`;
    }

    // Format timestamp for display
    formatTimestamp(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        
        if (date.toDateString() === now.toDateString()) {
            // Today - show time only
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            // Other days - show date and time
            return date.toLocaleString([], { 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
    }

    // Build context for AI processing
    buildContext() {
        const context = {
            currentDate: new Date().toISOString(),
            recentMessages: this.getRecentMessages(5),
            userInfo: null
        };
        
        // Add user info if available
        if (window.assistant && window.assistant.user) {
            context.userInfo = {
                name: window.assistant.user.name,
                email: window.assistant.user.email
            };
        }
        
        // Add task context if available
        if (window.assistant && window.assistant.tasks) {
            context.tasks = {
                total: window.assistant.tasks.length,
                pending: window.assistant.tasks.filter(t => t.status === 'pending').length,
                overdue: window.assistant.tasks.filter(t => {
                    const today = new Date().toISOString().split('T')[0];
                    return t.dueDate && t.dueDate < today && t.status === 'pending';
                }).length,
                dueToday: window.assistant.tasks.filter(t => {
                    const today = new Date().toISOString().split('T')[0];
                    return t.dueDate === today;
                }).length
            };
        }
        
        return context;
    }

    // Get recent messages for context
    getRecentMessages(count = 5) {
        const messages = Array.from(this.messagesContainer.children)
            .filter(el => el.classList.contains('message') && !el.classList.contains('typing-indicator'))
            .slice(-count * 2) // Get last few user-ai pairs
            .map(el => {
                const isUser = el.classList.contains('user-message');
                const content = el.querySelector('.message-text')?.textContent || '';
                return {
                    type: isUser ? 'user' : 'ai',
                    content: content.trim()
                };
            });
        
        return messages;
    }

    // Process AI response for actionable items
    processActionableResponse(response, originalMessage) {
        const lowerResponse = response.toLowerCase();
        const lowerMessage = originalMessage.toLowerCase();
        
        // Check if response suggests creating a task
        if (lowerResponse.includes('created') || lowerResponse.includes('added')) {
            if (lowerMessage.includes('task') || lowerMessage.includes('remind')) {
                // The AI likely created a task, trigger UI update
                setTimeout(() => {
                    if (window.assistant) {
                        window.assistant.updateDashboard();
                        window.assistant.updateTasksList();
                    }
                }, 500);
            }
        }
        
        // Check if response contains suggestions that can be implemented
        if (lowerResponse.includes('suggestion') || lowerResponse.includes('recommend')) {
            this.addActionButtons(response);
        }
    }

    // Add action buttons based on AI response
    addActionButtons(response) {
        const actions = [];
        
        if (response.toLowerCase().includes('schedule') || response.toLowerCase().includes('calendar')) {
            actions.push({
                text: 'Open Calendar',
                action: () => window.assistant.switchView('calendar')
            });
        }
        
        if (response.toLowerCase().includes('task') || response.toLowerCase().includes('todo')) {
            actions.push({
                text: 'View Tasks',
                action: () => window.assistant.switchView('tasks')
            });
        }
        
        if (actions.length > 0) {
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'message ai-message actions-message';
            
            actionsContainer.innerHTML = `
                <div class="message-avatar">🤖</div>
                <div class="message-content">
                    <div class="action-buttons">
                        ${actions.map(action => 
                            `<button class="action-btn" onclick="this.action()">${action.text}</button>`
                        ).join('')}
                    </div>
                </div>
            `;
            
            // Attach action handlers
            const buttons = actionsContainer.querySelectorAll('.action-btn');
            buttons.forEach((btn, index) => {
                btn.onclick = actions[index].action;
            });
            
            this.messagesContainer.appendChild(actionsContainer);
            this.scrollToBottom();
        }
    }

    // Auto-resize input textarea
    autoResizeInput() {
        if (!this.inputElement) return;
        
        this.inputElement.style.height = 'auto';
        this.inputElement.style.height = Math.min(this.inputElement.scrollHeight, 120) + 'px';
    }

    // Scroll to bottom of chat
    scrollToBottom() {
        if (this.messagesContainer) {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }

    // Limit message history to prevent memory issues
    limitMessageHistory() {
        const messages = this.messagesContainer.children;
        while (messages.length > this.maxMessages) {
            this.messagesContainer.removeChild(messages[0]);
        }
    }

    // Save message to conversation history
    saveMessage(message) {
        if (!this.currentConversation) {
            this.currentConversation = {
                id: this.generateId(),
                startTime: new Date().toISOString(),
                messages: []
            };
            this.conversations.push(this.currentConversation);
        }
        
        this.currentConversation.messages.push(message);
        this.currentConversation.lastActivity = new Date().toISOString();
        
        // Save to localStorage
        this.saveConversationHistory();
        
        // Update history display in sidebar
        this.updateHistoryDisplay();
    }

    // Load conversation history from localStorage
    loadConversationHistory() {
        try {
            const userKey = window.assistant && window.assistant.user ? 
                `chat_history_${window.assistant.user.email}` : 'chat_history_default';
            
            const stored = localStorage.getItem(userKey);
            if (stored) {
                this.conversations = JSON.parse(stored);
                
                // Load the most recent conversation
                if (this.conversations.length > 0) {
                    this.currentConversation = this.conversations[this.conversations.length - 1];
                    
                    // Only restore if it's from today
                    const today = new Date().toDateString();
                    const conversationDate = new Date(this.currentConversation.startTime).toDateString();
                    
                    if (conversationDate === today && this.currentConversation.messages.length > 0) {
                        this.restoreMessages();
                    }
                }
            }
        } catch (error) {
            console.error('Error loading conversation history:', error);
        }
    }

    // Save conversation history to localStorage
    saveConversationHistory() {
        try {
            const userKey = window.assistant && window.assistant.user ? 
                `chat_history_${window.assistant.user.email}` : 'chat_history_default';
            
            // Keep only last 10 conversations to limit storage
            const recentConversations = this.conversations.slice(-10);
            localStorage.setItem(userKey, JSON.stringify(recentConversations));
        } catch (error) {
            console.error('Error saving conversation history:', error);
        }
    }

    // Restore messages from conversation history
    restoreMessages() {
        if (!this.currentConversation || !this.currentConversation.messages) return;
        
        // Clear existing messages except welcome message
        const welcomeMessage = this.messagesContainer.querySelector('.message');
        this.messagesContainer.innerHTML = '';
        if (welcomeMessage) {
            this.messagesContainer.appendChild(welcomeMessage);
        }
        
        // Restore messages
        this.currentConversation.messages.forEach(message => {
            this.addMessage(message);
        });
    }

    // Clear chat history
    clearChat() {
        this.messagesContainer.innerHTML = '';
        this.conversations = [];
        this.currentConversation = null;
        
        // Clear localStorage
        const userKey = window.assistant && window.assistant.user ? 
            `chat_history_${window.assistant.user.email}` : 'chat_history_default';
        localStorage.removeItem(userKey);
        
        // Add welcome message back
        this.addWelcomeMessage();
    }

    // Export chat history
    exportChat() {
        const chatData = {
            conversations: this.conversations,
            exportDate: new Date().toISOString(),
            user: window.assistant && window.assistant.user ? window.assistant.user.email : 'unknown'
        };
        
        const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-history-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    // Focus on chat input
    focus() {
        if (this.inputElement) {
            this.inputElement.focus();
        }
    }

    // Get chat statistics
    getStats() {
        const totalMessages = this.conversations.reduce((total, conv) => total + conv.messages.length, 0);
        const userMessages = this.conversations.reduce((total, conv) => 
            total + conv.messages.filter(m => m.type === 'user').length, 0);
        const aiMessages = totalMessages - userMessages;
        
        return {
            totalConversations: this.conversations.length,
            totalMessages: totalMessages,
            userMessages: userMessages,
            aiMessages: aiMessages,
            currentConversationLength: this.currentConversation ? this.currentConversation.messages.length : 0
        };
    }

    // Utility function
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }
}

// Export for use in other modules
window.AIChatManager = AIChatManager;