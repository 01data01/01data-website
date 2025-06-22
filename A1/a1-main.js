/**
 * A1 Assistant Main Application Module
 * Simplified version focused on AI chat with voice capabilities
 */

class A1Assistant {
    constructor() {
        this.initialized = false;
        this.user = null;
        this.aiChatModule = null;
        this.voiceChatModule = null;
        this.voiceAuthModule = null;
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    /**
     * Initialize the A1 Assistant application
     */
    async init() {
        if (this.initialized) return;
        
        try {
            console.log('Initializing A1 Assistant...');
            
            // Initialize core services
            await this.initializeServices();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize authentication
            await this.initializeAuth();
            
            // Initialize AI modules
            this.initializeAIModules();
            
            this.initialized = true;
            console.log('A1 Assistant initialized successfully');
            
        } catch (error) {
            console.error('A1 Assistant Initialization Error:', error);
            this.showError('Failed to initialize A1 Assistant');
        }
    }

    /**
     * Initialize core services
     */
    async initializeServices() {
        // Initialize utilities
        if (typeof utils === 'undefined') {
            throw new Error('Utils module not loaded');
        }
        
        // Initialize storage
        this.initializeStorage();
    }

    /**
     * Initialize local storage
     */
    initializeStorage() {
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
        } catch (error) {
            console.warn('localStorage not available');
        }
    }

    /**
     * Initialize authentication - Auto login for CEO demo
     */
    async initializeAuth() {
        try {
            // Auto-login as CEO user for immediate access
            this.user = {
                name: 'A1 CEO',
                email: 'ceo@a1plastic.com',
                picture: 'https://via.placeholder.com/40x40/4db6ac/ffffff?text=CEO',
                isDemo: false,
                role: 'CEO'
            };
            
            // Save user session
            localStorage.setItem('a1_user', JSON.stringify(this.user));
            
            // Show app immediately
            this.showApp();
            
        } catch (error) {
            console.error('Authentication initialization error:', error);
            this.hideLoadingScreen();
            this.showError('Failed to initialize A1 Assistant');
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Window events
        window.addEventListener('beforeunload', () => {
            // Clean up voice connections
            if (this.voiceChatModule) {
                this.voiceChatModule.cleanup();
            }
        });

        // Set up suggestion buttons and input handlers
        setTimeout(() => {
            this.setupSuggestionButtons();
            this.setupInputHandlers();
        }, 1000);
    }

    /**
     * Setup suggestion button event listeners
     */
    setupSuggestionButtons() {
        const suggestionButtons = document.querySelectorAll('.suggestion-btn');
        suggestionButtons.forEach(button => {
            button.addEventListener('click', () => {
                const chatInput = document.getElementById('chatInput');
                if (chatInput && this.aiChatModule) {
                    chatInput.value = button.textContent;
                    // Trigger the send message function
                    if (this.aiChatModule.handleSendMessage) {
                        this.aiChatModule.handleSendMessage();
                    }
                }
            });
        });
    }

    /**
     * Setup input handlers
     */
    setupInputHandlers() {
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendChatBtn');
        
        if (chatInput && sendBtn) {
            // Enable/disable send button based on input
            chatInput.addEventListener('input', () => {
                sendBtn.disabled = !chatInput.value.trim();
            });
            
            // Auto-resize textarea
            chatInput.addEventListener('input', () => {
                chatInput.style.height = 'auto';
                chatInput.style.height = Math.min(chatInput.scrollHeight, 150) + 'px';
            });
        }
    }

    /**
     * Initialize AI modules
     */
    initializeAIModules() {
        try {
            // Initialize AI Service first
            if (typeof AIService !== 'undefined') {
                window.aiService = new AIService();
                window.aiService.setUserEmail(this.user.email);
                window.aiService.initialize();
                console.log('AI Service module initialized');
            }

            // Initialize Voice Authentication
            if (typeof VoiceAuth !== 'undefined') {
                this.voiceAuthModule = new VoiceAuth();
                console.log('Voice Auth module initialized');
            }

            // Initialize Voice Chat
            if (typeof VoiceChat !== 'undefined') {
                this.voiceChatModule = new VoiceChat();
                console.log('Voice Chat module initialized');
            }

            // Initialize AI Chat (must be last as it depends on other modules)
            if (typeof AIChatModule !== 'undefined') {
                this.aiChatModule = new AIChatModule();
                this.aiChatModule.initialize();
                console.log('AI Chat module initialized');
            }

        } catch (error) {
            console.error('AI modules initialization error:', error);
        }
    }

    /**
     * Enter demo mode
     */
    enterDemoMode() {
        this.user = {
            name: 'Demo User',
            email: 'demo@a1plastic.com',
            picture: 'https://via.placeholder.com/40x40/4db6ac/ffffff?text=D',
            isDemo: true
        };
        
        localStorage.setItem('a1_user', JSON.stringify(this.user));
        this.showApp();
    }

    /**
     * Handle Google Sign-In success
     */
    onSignIn(googleUser) {
        const profile = googleUser.getBasicProfile();
        this.user = {
            id: profile.getId(),
            name: profile.getName(),
            email: profile.getEmail(),
            picture: profile.getImageUrl(),
            isDemo: false
        };
        
        localStorage.setItem('a1_user', JSON.stringify(this.user));
        this.showApp();
    }

    /**
     * Sign out user
     */
    signOut() {
        // Clean up voice connections
        if (this.voiceChatModule) {
            this.voiceChatModule.cleanup();
        }

        // Clear user data
        localStorage.removeItem('a1_user');
        this.user = null;

        // Sign out from Google if not demo mode
        if (typeof gapi !== 'undefined' && gapi.auth2) {
            const authInstance = gapi.auth2.getAuthInstance();
            if (authInstance) {
                authInstance.signOut();
            }
        }

        // Show auth screen
        this.showAuthScreen();
        this.hideApp();
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }

    /**
     * Show authentication screen
     */
    showAuthScreen() {
        this.hideLoadingScreen();
        const authScreen = document.getElementById('authScreen');
        if (authScreen) {
            authScreen.style.display = 'flex';
        }
    }

    /**
     * Show main application
     */
    showApp() {
        this.hideLoadingScreen();
        
        const authScreen = document.getElementById('authScreen');
        const app = document.getElementById('app');
        
        if (authScreen) authScreen.style.display = 'none';
        if (app) app.style.display = 'block';
        
        // Update user info in header
        this.updateUserInfo();
        
        // Initialize AI modules after app is shown
        if (!this.aiChatModule) {
            setTimeout(() => this.initializeAIModules(), 100);
        }
    }

    /**
     * Hide main application
     */
    hideApp() {
        const app = document.getElementById('app');
        if (app) {
            app.style.display = 'none';
        }
    }

    /**
     * Update user info in header
     */
    updateUserInfo() {
        if (!this.user) return;
        
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        
        if (userAvatar) {
            userAvatar.src = this.user.picture || 'https://via.placeholder.com/40x40/4db6ac/ffffff?text=' + this.user.name.charAt(0);
            userAvatar.alt = this.user.name;
        }
        
        if (userName) {
            userName.textContent = this.user.name;
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        console.error('A1 Assistant Error:', message);
        
        // You could implement a more sophisticated error display here
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 15px;
            border-radius: 5px;
            z-index: 10000;
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
}

// Global functions for Google Sign-In callback
window.onSignIn = function(googleUser) {
    if (window.a1Assistant) {
        window.a1Assistant.onSignIn(googleUser);
    }
};

// Initialize the A1 Assistant application
window.a1Assistant = new A1Assistant();