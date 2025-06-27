// Mobile Chat UI Module
class MobileChatUI {
    constructor() {
        this.messagesContainer = null;
        this.inputArea = null;
        this.textInput = null;
        this.sendButton = null;
        this.voiceButton = null;
        this.sidebar = null;
        this.menuButton = null;
        this.isMenuOpen = false;
        
        this.init();
    }
    
    init() {
        this.initializeElements();
        this.setupEventListeners();
        this.setupTouchHandlers();
        this.adjustForKeyboard();
    }
    
    initializeElements() {
        this.messagesContainer = document.getElementById('mobileMessages');
        this.inputArea = document.getElementById('mobileInputArea');
        this.textInput = document.getElementById('mobileInput');
        this.sendButton = document.getElementById('mobileSendBtn');
        this.voiceButton = document.getElementById('mobileVoiceBtn');
        this.sidebar = document.getElementById('mobileSidebar');
        this.menuButton = document.getElementById('mobileMenuBtn');
    }
    
    setupEventListeners() {
        // Menu toggle
        if (this.menuButton) {
            this.menuButton.addEventListener('click', () => this.toggleMenu());
        }
        
        // Input handling
        if (this.textInput) {
            this.textInput.addEventListener('input', () => this.handleInputChange());
            this.textInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
            this.textInput.addEventListener('focus', () => this.handleInputFocus());
            this.textInput.addEventListener('blur', () => this.handleInputBlur());
        }
        
        // Send button
        if (this.sendButton) {
            this.sendButton.addEventListener('click', () => this.sendMessage());
        }
        
        // Voice button
        if (this.voiceButton) {
            this.voiceButton.addEventListener('click', () => this.handleVoiceInput());
        }
        
        // Close menu on outside click
        document.addEventListener('click', (e) => {
            if (this.isMenuOpen && !this.sidebar.contains(e.target) && !this.menuButton.contains(e.target)) {
                this.closeMenu();
            }
        });
        
        // Handle screen rotation
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.adjustLayout(), 100);
        });
        
        // Handle resize
        window.addEventListener('resize', () => this.adjustLayout());
    }
    
    setupTouchHandlers() {
        // Prevent pull-to-refresh on messages container
        if (this.messagesContainer) {
            this.messagesContainer.addEventListener('touchstart', (e) => {
                if (this.messagesContainer.scrollTop === 0) {
                    this.messagesContainer.scrollTop = 1;
                }
            });
        }
        
        // Add touch feedback to buttons
        document.querySelectorAll('button, .mobile-lang-btn, .mobile-suggestion').forEach(element => {
            element.addEventListener('touchstart', this.addTouchFeedback.bind(this));
        });
    }
    
    addTouchFeedback(event) {
        const element = event.currentTarget;
        element.classList.add('touch-active');
        
        setTimeout(() => {
            element.classList.remove('touch-active');
        }, 150);
        
        // Visual ripple effect
        this.createRippleEffect(event);
    }
    
    createRippleEffect(event) {
        const ripple = document.getElementById('mobileTouchFeedback');
        if (!ripple) return;
        
        const touch = event.touches[0];
        ripple.style.left = touch.clientX + 'px';
        ripple.style.top = touch.clientY + 'px';
        ripple.classList.add('active');
        
        setTimeout(() => {
            ripple.classList.remove('active');
        }, 600);
    }
    
    toggleMenu() {
        if (this.isMenuOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }
    
    openMenu() {
        this.sidebar.classList.add('mobile-sidebar-open');
        this.menuButton.classList.add('mobile-menu-open');
        document.body.classList.add('mobile-no-scroll');
        this.isMenuOpen = true;
    }
    
    closeMenu() {
        this.sidebar.classList.remove('mobile-sidebar-open');
        this.menuButton.classList.remove('mobile-menu-open');
        document.body.classList.remove('mobile-no-scroll');
        this.isMenuOpen = false;
    }
    
    handleInputChange() {
        const hasText = this.textInput.value.trim().length > 0;
        
        if (hasText) {
            this.sendButton.style.display = 'flex';
            this.voiceButton.style.display = 'none';
        } else {
            this.sendButton.style.display = 'none';
            this.voiceButton.style.display = 'flex';
        }
        
        // Auto-resize textarea
        this.autoResizeTextarea();
    }
    
    autoResizeTextarea() {
        const textarea = this.textInput;
        textarea.style.height = 'auto';
        const newHeight = Math.min(textarea.scrollHeight, 120); // Max 120px
        textarea.style.height = newHeight + 'px';
        
        // Adjust input area height
        this.adjustInputAreaHeight();
    }
    
    adjustInputAreaHeight() {
        const inputBar = document.querySelector('.mobile-input-bar');
        const suggestions = document.querySelector('.mobile-suggestions');
        
        if (inputBar && suggestions) {
            const inputBarHeight = inputBar.offsetHeight;
            const suggestionsVisible = suggestions.style.display !== 'none';
            const suggestionsHeight = suggestionsVisible ? suggestions.offsetHeight : 0;
            
            this.inputArea.style.height = (inputBarHeight + suggestionsHeight) + 'px';
        }
    }
    
    handleKeyDown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }
    
    handleInputFocus() {
        // Hide suggestions when typing
        const suggestions = document.querySelector('.mobile-suggestions');
        if (suggestions && this.textInput.value.trim().length > 0) {
            suggestions.style.display = 'none';
        }
        
        // Scroll to input
        setTimeout(() => {
            this.textInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    }
    
    handleInputBlur() {
        // Show suggestions if input is empty
        const suggestions = document.querySelector('.mobile-suggestions');
        if (suggestions && this.textInput.value.trim().length === 0) {
            suggestions.style.display = 'flex';
        }
    }
    
    adjustForKeyboard() {
        // Handle virtual keyboard
        let initialViewportHeight = window.innerHeight;
        
        window.addEventListener('resize', () => {
            const currentHeight = window.innerHeight;
            const keyboardHeight = initialViewportHeight - currentHeight;
            
            if (keyboardHeight > 100) {
                // Keyboard is open
                document.body.style.paddingBottom = '0px';
                this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
            } else {
                // Keyboard is closed
                document.body.style.paddingBottom = '';
                initialViewportHeight = currentHeight;
            }
        });
    }
    
    adjustLayout() {
        this.autoResizeTextarea();
        this.adjustInputAreaHeight();
        
        // Scroll to bottom of messages
        if (this.messagesContainer) {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }
    
    sendMessage() {
        const message = this.textInput.value.trim();
        if (!message) return;
        
        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Clear input
        this.textInput.value = '';
        this.handleInputChange();
        
        // Hide suggestions
        const suggestions = document.querySelector('.mobile-suggestions');
        if (suggestions) {
            suggestions.style.display = 'none';
        }
        
        // Focus input for next message
        this.textInput.focus();
        
        // Trigger AI response (if available)
        if (window.aiService) {
            window.aiService.sendMessage(message);
        }
    }
    
    addMessage(content, type = 'user', avatar = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `mobile-message mobile-message-${type}`;
        
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            <div class="mobile-message-content">
                ${avatar ? `<img src="${avatar}" alt="Avatar" class="mobile-message-avatar">` : ''}
                <div class="mobile-message-bubble">
                    <div class="mobile-message-text">${content}</div>
                    <div class="mobile-message-time">${timestamp}</div>
                </div>
            </div>
        `;
        
        this.messagesContainer.appendChild(messageDiv);
        
        // Animate message appearance
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(20px)';
        
        requestAnimationFrame(() => {
            messageDiv.style.transition = 'all 0.3s ease';
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        });
        
        // Scroll to bottom
        this.scrollToBottom();
    }
    
    scrollToBottom() {
        if (this.messagesContainer) {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }
    
    handleVoiceInput() {
        // Show voice overlay
        const voiceOverlay = document.getElementById('mobileVoiceOverlay');
        if (voiceOverlay) {
            voiceOverlay.style.display = 'flex';
        }
        
        // Start voice recognition (if available)
        if (window.voiceService) {
            window.voiceService.startRecording();
        }
    }
    
    addSuggestion(text) {
        const suggestionsContainer = document.querySelector('.mobile-suggestions');
        if (!suggestionsContainer) return;
        
        const suggestionButton = document.createElement('button');
        suggestionButton.className = 'mobile-suggestion';
        suggestionButton.textContent = text;
        
        suggestionButton.addEventListener('click', () => {
            this.textInput.value = text;
            this.sendMessage();
        });
        
        suggestionsContainer.appendChild(suggestionButton);
    }
    
    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'mobile-message mobile-message-ai mobile-typing-indicator';
        typingDiv.innerHTML = `
            <div class="mobile-message-content">
                <div class="mobile-message-bubble">
                    <div class="mobile-typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;
        
        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
        
        return typingDiv;
    }
    
    removeTypingIndicator() {
        const typingIndicator = document.querySelector('.mobile-typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mobileChatUI = new MobileChatUI();
});