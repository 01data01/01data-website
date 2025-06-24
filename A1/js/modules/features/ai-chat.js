/**
 * AI Chat Module
 * Handles AI chat interface and Claude API integration with voice capabilities
 */

console.log('A1: ai-chat.js script loaded');

// Message UI Controller
class MessageUI {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.messages = [];
    }

    // Create a new message
    createMessage(role, content, options = {}) {
        const messageId = this.generateId();
        const messageElement = document.createElement('div');
        messageElement.className = `message ${role}`;
        messageElement.id = messageId;
        
        if (options.isWelcome) {
            messageElement.classList.add('welcome');
        }
        
        if (options.isStreaming) {
            messageElement.classList.add('streaming');
        }

        const avatar = this.createAvatar(role, options.userInitial);
        const bubble = this.createBubble(content, options);

        messageElement.innerHTML = `
            <div class="message-content-wrapper">
                ${avatar}
                ${bubble}
            </div>
        `;

        // Always append messages to the end for proper chronological order
        this.container.appendChild(messageElement);
        
        // Smooth scroll to bottom
        this.scrollToBottom();

        const messageData = {
            id: messageId,
            role,
            content,
            timestamp: new Date(),
            element: messageElement
        };

        this.messages.push(messageData);
        return messageData;
    }

    // Create avatar based on role
    createAvatar(role, userInitial = 'U') {
        if (role === 'user') {
            return `
                <div class="avatar-container">
                    <div class="user-avatar">${userInitial}</div>
                </div>
            `;
        } else if (role === 'ai' || role === 'assistant') {
            return `
                <div class="avatar-container">
                    <div class="sound-wave-avatar">
                        <div class="wave-bars">
                            <div class="wave-bar"></div>
                            <div class="wave-bar"></div>
                            <div class="wave-bar"></div>
                            <div class="wave-bar"></div>
                            <div class="wave-bar"></div>
                        </div>
                    </div>
                </div>
            `;
        }
        return '';
    }

    // Create message bubble
    createBubble(content, options = {}) {
        let formattedContent = this.formatContent(content);
        
        if (options.isWelcome && options.hint) {
            formattedContent += `<div class="welcome-hint">${options.hint}</div>`;
        }

        return `
            <div class="message-bubble">
                <div class="message-text">${formattedContent}</div>
            </div>
        `;
    }

    // Format message content
    formatContent(content) {
        // Convert line breaks
        content = content.replace(/\n/g, '<br>');
        
        // Convert markdown-style formatting
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
        content = content.replace(/`(.*?)`/g, '<code>$1</code>');
        
        return content;
    }

    // Show typing indicator
    showTyping() {
        const typingId = 'typing-indicator';
        
        // Remove existing typing indicator
        this.hideTyping();
        
        const typingElement = document.createElement('div');
        typingElement.className = 'message ai typing-indicator';
        typingElement.id = typingId;
        
        typingElement.innerHTML = `
            <div class="message-content-wrapper">
                ${this.createAvatar('ai')}
                <div class="message-bubble">
                    <div class="typing-dots">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
            </div>
        `;
        
        this.container.appendChild(typingElement);
        this.scrollToBottom();
        
        return typingId;
    }

    // Hide typing indicator
    hideTyping() {
        const typing = document.getElementById('typing-indicator');
        if (typing) {
            typing.remove();
        }
    }

    // Create streaming message
    createStreamingMessage(role = 'ai') {
        const message = this.createMessage(role, '', { isStreaming: true });
        return message;
    }

    // Update streaming message content
    updateStreamingMessage(messageId, content) {
        const message = this.messages.find(m => m.id === messageId);
        if (message) {
            const textElement = message.element.querySelector('.message-text');
            if (textElement) {
                textElement.innerHTML = this.formatContent(content);
                message.content = content;
                this.scrollToBottom();
            }
        }
    }

    // Finish streaming
    finishStreaming(messageId) {
        const message = this.messages.find(m => m.id === messageId);
        if (message) {
            message.element.classList.remove('streaming');
        }
    }

    // Scroll to bottom
    scrollToBottom() {
        const chatMessages = this.container.closest('.chat-messages');
        if (chatMessages) {
            chatMessages.scrollTo({
                top: chatMessages.scrollHeight,
                behavior: 'smooth'
            });
        }
    }

    // Generate unique ID
    generateId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Clear all messages
    clear() {
        this.container.innerHTML = '';
        this.messages = [];
    }

    // Remove specific message
    removeMessage(messageId) {
        const index = this.messages.findIndex(m => m.id === messageId);
        if (index > -1) {
            this.messages[index].element.remove();
            this.messages.splice(index, 1);
        }
    }
}

class AIChatModule {
    constructor() {
        this.initialized = false;
        this.connectionStatus = 'disconnected';
        this.currentChatId = null;
        this.chatHistory = [];
        this.currentMessages = [];
        this.voiceChat = null;
        this.isVoiceMode = false;
        this.selectedAgent = 'primary'; // Default to primary agent (SMART - uses ELEVENLABS_AGENT_ID_3)
        this.sidebarVisible = true;
        this.messageUI = null; // Add MessageUI instance
        this.firstMessageSent = false; // Track if first message has been sent
    }

    /**
     * Initialize AI Chat module
     */
    initialize() {
        if (this.initialized) return;
        
        try {
            console.log('A1: Initializing AI Chat Module...');
            
            // Initialize MessageUI
            this.messageUI = new MessageUI('chatMessages');
            console.log('A1: MessageUI initialized');
            
            this.setupEventListeners();
            this.initializeVoiceChat();
            this.updateConnectionStatus();
            this.loadChatHistory();
            this.createNewChat(); // Start with a new chat
            this.initializeSidebarState(); // Initialize sidebar visibility
            
            this.initialized = true;
            console.log('A1: AI Chat Module initialized successfully');
            
        } catch (error) {
            console.error('A1: AI Chat Module Initialization error:', error);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        console.log('A1: Setting up AI Chat event listeners...');
        
        // Agent selection buttons
        const agentSmartBtn = document.getElementById('agentSmartBtn');
        const agentElaBtn = document.getElementById('agentElaBtn');
        
        if (agentSmartBtn) {
            agentSmartBtn.addEventListener('click', () => this.selectAgent('primary'));
        }
        
        if (agentElaBtn) {
            agentElaBtn.addEventListener('click', () => this.selectAgent('secondary'));
        }
        
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

        // Sidebar toggle button
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // Clear chat button
        const clearChatBtn = document.getElementById('clearChatBtn');
        if (clearChatBtn) {
            clearChatBtn.addEventListener('click', () => {
                this.clearAllChats();
            });
        }

        // Voice mode toggle button
        const voiceToggleBtn = document.getElementById('voiceToggleBtn');
        if (voiceToggleBtn) {
            console.log('A1: Voice toggle button found, adding click handler');
            voiceToggleBtn.addEventListener('click', () => {
                console.log('A1: Voice toggle button clicked!');
                this.toggleVoiceMode();
            });
        } else {
            console.error('A1: Voice toggle button not found!');
        }

        // Suggestion buttons
        const suggestionButtons = document.querySelectorAll('.suggestion-btn');
        if (suggestionButtons.length > 0) {
            console.log(`A1: Found ${suggestionButtons.length} suggestion buttons, adding click handlers`);
            suggestionButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    const message = button.textContent.trim();
                    console.log(`A1: Suggestion button clicked: "${message}"`);
                    
                    // Set the message in the input field
                    const chatInput = document.getElementById('chatInput');
                    if (chatInput) {
                        chatInput.value = message;
                        
                        // Trigger the send message function
                        this.handleSendMessage();
                    }
                });
            });
        } else {
            console.warn('A1: No suggestion buttons found!');
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
        if (!this.messageUI) {
            console.error('MessageUI not initialized');
            return;
        }

        // Use the new MessageUI instead of manual DOM manipulation
        const userInitial = 'U'; // Could be made dynamic based on user
        this.messageUI.createMessage(role, content, { userInitial });

        // Hide suggestions after first user message
        if (role === 'user' && !this.firstMessageSent) {
            this.hideSuggestions();
            this.firstMessageSent = true;
        }

        // Still save to currentMessages for history
        this.currentMessages.push({
            role: role,
            content: content,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Hide suggestion buttons after first message
     */
    hideSuggestions() {
        const suggestionsContainer = document.querySelector('.input-suggestions');
        if (suggestionsContainer) {
            suggestionsContainer.classList.add('hidden');
        }
    }

    /**
     * Show suggestion buttons (for new chat)
     */
    showSuggestions() {
        const suggestionsContainer = document.querySelector('.input-suggestions');
        if (suggestionsContainer) {
            suggestionsContainer.classList.remove('hidden');
        }
    }


    /**
     * Show typing indicator
     */
    showTypingIndicator() {
        if (!this.messageUI) return;
        return this.messageUI.showTyping();
    }

    /**
     * Hide typing indicator
     */
    hideTypingIndicator() {
        if (!this.messageUI) return;
        this.messageUI.hideTyping();
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
        
        // Add datetime context to the message
        const dateTime = window.utils ? window.utils.getCurrentDateTime() : {
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            day: new Date().toLocaleDateString('en-US', { weekday: 'long' })
        };
        
        const contextualMessage = `Current context: Today is ${dateTime.day}, ${dateTime.date} at ${dateTime.time}. User message: ${message}`;
        
        // Check if AI service is available
        if (window.aiService && window.aiService.initialized) {
            try {
                console.log('Using AI service with streaming');
                console.log('AI service connection status:', window.aiService.connectionStatus);
                
                // Create a streaming message element
                const streamingMessage = this.createStreamingMessage();
                
                await window.aiService.chatStream(contextualMessage, this.currentChatId, (chunk, fullContent) => {
                    console.log('Received chunk:', chunk);
                    this.updateStreamingMessage(streamingMessage, chunk, fullContent);
                });
                
                // Finish streaming animation
                this.finishStreamingMessage(streamingMessage);
                
                // Hide typing indicator after streaming is complete
                this.hideTypingIndicator();
                
                // Get the final content and add to current messages
                const finalContent = streamingMessage.content;
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
        this.firstMessageSent = false; // Reset for new chat

        if (this.messageUI) {
            // Clear the container first
            this.messageUI.clear();
            
            // Show suggestions again for new chat
            this.showSuggestions();
            
            // Detect language from page
            const isTurkish = document.documentElement.lang === 'tr' || window.location.pathname.includes('index-tr');
            
            const welcomeText = isTurkish ? 
                'Hoş Geldiniz! Size nasıl yardımcı olabilirim?' : 
                'Welcome! How can I help you?';
            const hintText = isTurkish ? 
                '💬 Sesli sohbet için tıklayın' : 
                '💬 Click for voice chat';
            
            // Create welcome message using MessageUI
            const welcomeMessage = this.messageUI.createMessage('ai', welcomeText, {
                isWelcome: true,
                hint: hintText
            });
            
            // Add click event listener to the welcome message for voice activation
            setTimeout(() => {
                const welcomeElement = document.getElementById(welcomeMessage.id);
                if (welcomeElement) {
                    const bubble = welcomeElement.querySelector('.message-bubble');
                    if (bubble) {
                        bubble.style.cursor = 'pointer';
                        bubble.title = isTurkish ? 'Sesli sohbeti başlatmak için tıklayın' : 'Click to start voice chat';
                        bubble.addEventListener('click', () => {
                            console.log('A1: Welcome message clicked - starting voice chat');
                            this.toggleVoiceMode();
                        });
                    }
                }
            }, 100);
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
     * Toggle sidebar visibility
     */
    toggleSidebar() {
        const sidebar = document.getElementById('chatSidebar');
        const toggleBtn = document.getElementById('sidebarToggle');
        
        if (!sidebar || !toggleBtn) return;
        
        this.sidebarVisible = !this.sidebarVisible;
        
        if (this.sidebarVisible) {
            sidebar.classList.remove('hidden');
            toggleBtn.innerHTML = '←';
            toggleBtn.classList.remove('sidebar-hidden');
        } else {
            sidebar.classList.add('hidden');
            toggleBtn.innerHTML = '→';
            toggleBtn.classList.add('sidebar-hidden');
        }
        
        // Save preference to localStorage
        localStorage.setItem('sidebarVisible', this.sidebarVisible);
    }

    /**
     * Initialize sidebar state from localStorage
     */
    initializeSidebarState() {
        const savedState = localStorage.getItem('sidebarVisible');
        if (savedState !== null) {
            this.sidebarVisible = savedState === 'true';
            if (!this.sidebarVisible) {
                setTimeout(() => this.toggleSidebar(), 100);
            }
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
     * Create streaming message element
     */
    createStreamingMessage() {
        console.log('Creating streaming message element');
        
        if (!this.messageUI) {
            console.error('MessageUI not initialized');
            return null;
        }

        // Hide typing indicator
        this.hideTypingIndicator();

        const message = this.messageUI.createStreamingMessage('assistant');
        console.log('Streaming message element created successfully');
        return message;
    }

    /**
     * Update streaming message content
     */
    updateStreamingMessage(messageData, chunk, fullContent) {
        if (!messageData || !this.messageUI) return;
        
        this.messageUI.updateStreamingMessage(messageData.id, fullContent);
    }

    /**
     * Finish streaming message
     */
    finishStreamingMessage(messageData) {
        if (!messageData || !this.messageUI) return;
        
        this.messageUI.finishStreaming(messageData.id);
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
        const historyList = document.getElementById('chatHistoryList');
        if (!historyList) return;

        if (this.chatHistory.length === 0) {
            // Detect language from page
            const isTurkish = document.documentElement.lang === 'tr' || window.location.pathname.includes('index-tr');
            const noConversationsText = isTurkish ? 'Henüz konuşma yok' : 'No conversations yet';
            const startChattingText = isTurkish ? 'Geçmişi görmek için sohbet etmeye başlayın' : 'Start chatting to see history';
            
            historyList.innerHTML = `
                <div class="empty-history">
                    <div class="empty-icon">💭</div>
                    <p>${noConversationsText}</p>
                    <span>${startChattingText}</span>
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
        const historyList = document.getElementById('chatHistoryList');
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

        // Check if this chat has user messages to determine if suggestions should be hidden
        const hasUserMessages = chat.messages.some(msg => msg.role === 'user');
        this.firstMessageSent = hasUserMessages;

        // Display messages using MessageUI
        if (this.messageUI) {
            this.messageUI.clear();
            
            // Show/hide suggestions based on chat history
            if (hasUserMessages) {
                this.hideSuggestions();
            } else {
                this.showSuggestions();
            }
            
            chat.messages.forEach(message => {
                this.messageUI.createMessage(message.role, message.content, { userInitial: 'U' });
            });
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
        console.log('A1: Getting current user email...');
        console.log('A1: authModule available:', !!window.authModule);
        
        if (window.authModule && window.authModule.getCurrentUser()) {
            const user = window.authModule.getCurrentUser();
            console.log('A1: Current user:', user);
            return user.email;
        }
        
        // Fallback to check localStorage directly for A1 user
        const savedUser = window.utils.loadFromStorage('user');
        console.log('A1: Saved user from storage:', savedUser);
        if (savedUser && savedUser.email) {
            return savedUser.email;
        }
        
        console.log('A1: No user email found');
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
     * Select agent for voice chat
     */
    selectAgent(agentType) {
        this.selectedAgent = agentType;
        
        // Update UI
        const smartBtn = document.getElementById('agentSmartBtn');
        const elaBtn = document.getElementById('agentElaBtn');
        
        if (smartBtn && elaBtn) {
            smartBtn.classList.toggle('active', agentType === 'primary');
            elaBtn.classList.toggle('active', agentType === 'secondary');
        }
        
        // Update voice chat configuration if available
        if (this.voiceChat) {
            this.voiceChat.setSelectedAgent(agentType);
        }
        
        console.log(`A1: Selected agent: ${agentType === 'primary' ? 'SMART (ELEVENLABS_AGENT_ID_4)' : 'ELA (ELEVENLABS_AGENT_ID_2)'}`);
    }

    /**
     * Initialize voice chat integration
     */
    initializeVoiceChat() {
        try {
            console.log('A1: Initializing voice chat...');
            
            // Wait for VoiceChat and VoiceAuth to be available
            if (typeof window.VoiceChat === 'undefined' || typeof window.VoiceAuth === 'undefined') {
                console.log('A1: VoiceChat or VoiceAuth not yet available, retrying...');
                setTimeout(() => this.initializeVoiceChat(), 100);
                return;
            }
            
            console.log('A1: Voice modules available, initializing...');
            
            // Initialize voice authentication
            this.voiceAuth = new window.VoiceAuth();
            console.log('A1: VoiceAuth initialized');
            
            this.voiceChat = new window.VoiceChat();
            console.log('A1: VoiceChat initialized');
            
            // Configure voice chat with ElevenLabs agent ID
            const agentId = window.config?.elevenlabs?.agentId;
            console.log('A1: Configuring voice chat with agent ID:', agentId);
            console.log('A1: Full config:', window.config);
            
            this.voiceChat.setConfig({
                agentId: agentId || null
            });

            // Set up voice chat callbacks
            this.voiceChat.setCallbacks({
                onConnectionChange: (connected) => {
                    console.log('A1: Voice connection status changed:', connected);
                    this.updateVoiceConnectionStatus(connected);
                },
                onTranscript: (transcript, role) => {
                    console.log('A1: Voice transcript received:', transcript, 'role:', role);
                    if (role === 'user') {
                        this.addMessageToChat('user', transcript);
                    }
                },
                onAgentResponse: (response) => {
                    console.log('A1: Voice agent response:', response);
                    this.addMessageToChat('assistant', response);
                },
                onError: (error) => {
                    console.error('A1: Voice chat error:', error);
                    this.addMessageToChat('system', `Voice error: ${error}`);
                }
            });

            console.log('A1: Voice chat initialized successfully');
        } catch (error) {
            console.error('A1: Failed to initialize voice chat:', error);
        }
    }

    /**
     * Toggle voice mode on/off
     */
    async toggleVoiceMode() {
        console.log('A1: Voice button clicked - toggleVoiceMode called');
        console.log('A1: Current voice mode state:', this.isVoiceMode);
        console.log('A1: Voice chat available:', !!this.voiceChat);
        console.log('A1: Voice auth available:', !!this.voiceAuth);
        
        if (!this.voiceChat || !this.voiceAuth) {
            console.error('A1: Voice chat or voice auth not initialized');
            console.log('A1: voiceChat:', this.voiceChat);
            console.log('A1: voiceAuth:', this.voiceAuth);
            this.addMessageToChat('system', 'Voice modules not initialized. Please refresh the page.');
            return;
        }

        try {
            if (this.isVoiceMode) {
                // Stop voice conversation
                console.log('A1: Stopping voice conversation...');
                this.voiceChat.stopConversation();
                this.isVoiceMode = false;
                this.updateVoiceModeUI(false);
                
                // Detect language for system messages
                const isTurkish = document.documentElement.lang === 'tr' || window.location.pathname.includes('index-tr');
                const disabledMessage = isTurkish ? 'Sesli mod devre dışı bırakıldı' : 'Voice mode disabled';
                this.addMessageToChat('system', disabledMessage);
            } else {
                console.log('A1: Starting voice mode - checking authentication...');
                
                // Check authentication first
                console.log('A1: Requesting voice access...');
                const hasAccess = await this.voiceAuth.requestVoiceAccess();
                console.log('A1: Voice access result:', hasAccess);
                
                if (!hasAccess) {
                    console.log('A1: Voice access denied');
                    this.addMessageToChat('system', 'Voice access denied');
                    return;
                }

                console.log('A1: Voice access granted - starting conversation...');
                
                // Detect language for system messages
                const isTurkish = document.documentElement.lang === 'tr' || window.location.pathname.includes('index-tr');
                const startingMessage = isTurkish ? 
                    'Sesli mod başlatılıyor... Mikrofon erişimine izin verin.' : 
                    'Starting voice mode... Please allow microphone access when prompted.';
                const enabledMessage = isTurkish ? 
                    'Sesli mod etkinleştirildi - Artık AI ile konuşabilirsiniz' : 
                    'Voice mode enabled - You can now speak to the AI';
                
                this.addMessageToChat('system', startingMessage);

                // Start voice conversation - this should trigger microphone permission
                console.log('A1: Calling voiceChat.startConversation()...');
                await this.voiceChat.startConversation();
                
                console.log('A1: Voice conversation started successfully');
                this.isVoiceMode = true;
                this.updateVoiceModeUI(true);
                this.addMessageToChat('system', enabledMessage);
            }
        } catch (error) {
            console.error('A1: Error toggling voice mode:', error);
            console.log('A1: Error details:', error.stack);
            this.addMessageToChat('system', `Failed to ${this.isVoiceMode ? 'stop' : 'start'} voice mode: ${error.message}`);
        }
    }

    /**
     * Update voice mode UI
     */
    updateVoiceModeUI(isVoiceMode) {
        const voiceToggleBtn = document.getElementById('voiceToggleBtn');
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendChatBtn');

        if (voiceToggleBtn) {
            const icon = voiceToggleBtn.querySelector('.voice-icon');
            const text = voiceToggleBtn.querySelector('.voice-text');
            
            if (isVoiceMode) {
                voiceToggleBtn.classList.add('active');
                if (icon) icon.textContent = '🔇';
                if (text) text.textContent = 'Stop Voice';
            } else {
                voiceToggleBtn.classList.remove('active');
                if (icon) icon.textContent = '🎤';
                if (text) text.textContent = 'Voice Mode';
            }
        }

        // Disable text input when in voice mode
        if (chatInput) {
            chatInput.disabled = isVoiceMode;
            chatInput.placeholder = isVoiceMode ? 
                'Voice mode active - speak to the AI' : 
                'Type your message...';
        }

        if (sendBtn) {
            sendBtn.disabled = isVoiceMode;
        }
    }

    /**
     * Update voice connection status
     */
    updateVoiceConnectionStatus(connected) {
        const voiceStatus = document.querySelector('.voice-status');
        if (voiceStatus) {
            voiceStatus.className = `voice-status ${connected ? 'connected' : 'disconnected'}`;
            
            // Check if current page is Turkish
            const isTurkish = window.location.pathname.includes('index-tr.html') || 
                            document.documentElement.lang === 'tr' ||
                            document.querySelector('html[lang="tr"]');
            
            if (isTurkish) {
                voiceStatus.textContent = connected ? 'SES BAĞLANDI' : 'SES BAĞLANTISI YOK';
            } else {
                voiceStatus.textContent = connected ? 'Voice Connected' : 'Voice Disconnected';
            }
        }
    }

    /**
     * Send contextual update to voice chat
     */
    sendVoiceContextualUpdate(context) {
        if (this.voiceChat && this.isVoiceMode) {
            this.voiceChat.sendContextualUpdate(context);
        }
    }

    /**
     * Cleanup module
     */
    cleanup() {
        if (this.voiceChat) {
            this.voiceChat.stopConversation();
        }
        this.initialized = false;
    }
}

// Create and export singleton instance
console.log('A1: Creating AIChatModule instance...');
const aiChatModule = new AIChatModule();

// Make it globally accessible
window.aiChatModule = aiChatModule;
console.log('A1: AIChatModule instance created and assigned to window.aiChatModule');

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = aiChatModule;
}