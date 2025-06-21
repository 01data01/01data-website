/**
 * AI Chat Module
 * Handles AI chat interface and Claude API integration
 */

class AIChatModule {
    constructor() {
        this.initialized = false;
        this.connectionStatus = 'disconnected';
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
                this.createNewChat();
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
            
            // Send to AI (mock for now)
            const aiResponse = await this.sendToAI(message);
            
            // Hide typing indicator
            this.hideTypingIndicator();
            
            // Add AI response to chat
            this.addMessageToChat('assistant', aiResponse);
            
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
     * Create new chat
     */
    createNewChat() {
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