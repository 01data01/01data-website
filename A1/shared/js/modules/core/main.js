/**
 * Main Application Module
 * Handles app initialization, routing, and core application logic
 */

console.log('A1: main.js script loaded');

class MainApp {
    constructor() {
        // A1 Assistant - simplified for AI chat only
        this.currentView = 'ai-chat';
        this.initialized = false;
        this.user = null;
        this.eventListeners = [];
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    /**
     * Get view from URL hash - A1 Assistant only supports AI chat
     */
    getViewFromHash() {
        return 'ai-chat';
    }

    /**
     * Initialize the application
     */
    async init() {
        if (this.initialized) return;
        
        try {
            console.log('Initializing Intelligent Management System...');
            
            // Initialize core services
            await this.initializeServices();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize authentication
            await this.initializeAuth();
            
            // Set up routing
            this.setupRouting();
            
            // Initialize current view
            this.showView(this.currentView);
            
            // Force initialize dashboard module for the first time
            if (this.currentView === 'dashboard') {
                setTimeout(() => {
                    if (window.dashboardModule && !window.dashboardModule.initialized) {
                        window.dashboardModule.initialize();
                    }
                }, 500);
            }
            
            this.initialized = true;
            console.log('Application initialized successfully');
            
        } catch (error) {
            utils.logError('Main App Initialization', error);
            this.showError('Failed to initialize application');
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
        
        // Initialize other services as they become available
        this.initializeStorage();
        this.initializeTheme();
    }

    /**
     * Initialize local storage
     */
    initializeStorage() {
        // Check if localStorage is available
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
        } catch (error) {
            console.warn('localStorage not available');
        }
    }

    /**
     * Initialize theme system
     */
    initializeTheme() {
        const savedTheme = utils.loadFromStorage('theme', 'light');
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    /**
     * Initialize authentication with better error handling
     */
    async initializeAuth() {
        return new Promise((resolve) => {
            // Hide loading screen
            this.hideLoadingScreen();
            
            // A1 Assistant - Auto-login as CEO user for immediate access
            this.user = {
                id: 'a1-ceo',
                name: 'A1 CEO',
                email: 'ceo@a1plastic.com',
                image: 'https://ui-avatars.com/api/?name=A1+CEO&background=2c5f5d&color=fff',
                signedIn: true,
                role: 'CEO'
            };
            
            // Save user session
            utils.saveToStorage('user', this.user);
            
            // Show app immediately
            this.showApp();
            resolve();
        });
    }

    /**
     * Check for user data passed via URL parameters
     */
    checkForURLUserData() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const userParam = urlParams.get('user');
            
            if (userParam) {
                console.log('Found user data in URL, processing...');
                const decodedParam = decodeURIComponent(userParam);
                const userData = JSON.parse(decodedParam);
                
                // Validate user data
                if (userData.email && userData.name) {
                    const formattedUser = {
                        id: userData.id,
                        name: userData.name,
                        email: userData.email,
                        image: userData.picture || userData.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=4db6ac&color=fff`,
                        signedIn: true
                    };
                    
                    // Clean up URL for security
                    const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                    window.history.replaceState({}, document.title, cleanUrl);
                    
                    console.log('Successfully processed URL user data');
                    return formattedUser;
                }
            }
        } catch (error) {
            console.error('Error processing URL user data:', error);
        }
        
        return null;
    }

    /**
     * Handle successful sign-in
     */
    handleSignIn(googleUser) {
        try {
            const profile = googleUser.getBasicProfile();
            this.user = {
                id: profile.getId(),
                name: profile.getName(),
                email: profile.getEmail(),
                image: profile.getImageUrl(),
                signedIn: true
            };
            
            utils.saveToStorage('user', this.user);
            
            // AI service will be initialized when showApp() is called
            
            this.showApp();
            
        } catch (error) {
            utils.logError('Sign In Handler', error);
            this.showSignInError('Failed to process sign-in');
        }
    }

    /**
     * Handle sign-out
     */
    async handleSignOut() {
        try {
            if (typeof gapi !== 'undefined') {
                const authInstance = gapi.auth2.getAuthInstance();
                await authInstance.signOut();
            }
            
            this.user = null;
            utils.removeFromStorage('user');
            utils.removeFromStorage('tasks');
            utils.removeFromStorage('calendar');
            
            this.showSignIn();
            
        } catch (error) {
            utils.logError('Sign Out Handler', error);
        }
    }

    /**
     * Show loading screen
     */
    showLoading() {
        utils.show('#loadingScreen');
        utils.hide('#signInScreen');
        utils.hide('#app');
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        utils.hide('#loadingScreen');
    }

    /**
     * Show sign-in screen (not used in A1 - auto-login)
     */
    showSignIn() {
        // A1 Assistant uses auto-login, this should not be called
        console.warn('showSignIn called in A1 Assistant - using auto-login instead');
        this.showApp();
    }

    /**
     * Show main application
     */
    showApp() {
        utils.hide('#loadingScreen');
        utils.show('#app');
        
        // Update user info in header
        this.updateUserInfo();
        
        // Initialize AI service now that user is authenticated
        if (window.aiService && this.user) {
            console.log('A1: Initializing AI service with user email:', this.user.email);
            window.aiService.setUserEmail(this.user.email).then(() => {
                return window.aiService.initialize();
            }).then(() => {
                console.log('A1: AI service initialized successfully');
            }).catch(error => {
                console.warn('A1: AI service initialization failed:', error);
            });
        }
    }

    /**
     * Show sign-in error
     */
    showSignInError(message) {
        const errorElement = utils.getElementById('signInError');
        if (errorElement) {
            errorElement.textContent = message;
            utils.show(errorElement);
        }
    }

    /**
     * Show general error
     */
    showError(message) {
        // Create or show error notification
        this.showNotification(message, 'error');
    }

    /**
     * Update user info in header
     */
    updateUserInfo() {
        if (!this.user) return;
        
        const userInfoElement = utils.querySelector('.user-info');
        if (userInfoElement) {
            userInfoElement.innerHTML = `
                <img src="${this.user.image}" alt="User Avatar" class="user-avatar">
                <span class="user-name">${this.user.name}</span>
            `;
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Navigation buttons
        const navButtons = utils.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            const listener = utils.addEventListener(btn, 'click', (e) => {
                const view = e.target.closest('.nav-btn').dataset.view;
                if (view) {
                    this.navigateTo(view);
                }
            });
            this.eventListeners.push(listener);
        });

        // Mobile menu toggle (A1 doesn't have mobile menu)
        const mobileMenuBtn = utils.getElementById('mobileMenuBtn');
        if (mobileMenuBtn) {
            const listener = utils.addEventListener(mobileMenuBtn, 'click', () => {
                this.toggleMobileMenu();
            });
            this.eventListeners.push(listener);
        } else {
            console.log('A1: Mobile menu not available - simplified interface');
        }

        // Sign out button (A1 doesn't have sign out - auto-login)
        const signOutBtn = utils.getElementById('signOutBtn');
        if (signOutBtn) {
            const listener = utils.addEventListener(signOutBtn, 'click', () => {
                this.handleSignOut();
            });
            this.eventListeners.push(listener);
        } else {
            console.log('A1: Sign out not available - auto-login mode');
        }

        // Global keyboard shortcuts
        const keyboardListener = utils.addEventListener(document, 'keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        this.eventListeners.push(keyboardListener);
    }

    /**
     * Setup routing system
     */
    setupRouting() {
        // Handle browser back/forward navigation
        const popstateListener = utils.addEventListener(window, 'popstate', (e) => {
            const state = e.state;
            if (state && state.view) {
                this.showView(state.view, false);
            }
        });
        this.eventListeners.push(popstateListener);

        // Set initial state
        const initialState = { view: this.currentView };
        history.replaceState(initialState, '', `#${this.currentView}`);
    }

    /**
     * Navigate to a specific view
     */
    navigateTo(view) {
        if (view === this.currentView) return;
        
        this.showView(view, true);
    }

    /**
     * Show a specific view - A1 Assistant only supports AI chat
     */
    showView(view, updateHistory = true) {
        // A1 Assistant only has AI chat view
        view = 'ai-chat';
        this.currentView = 'ai-chat';
        
        // Initialize AI chat
        this.initializeAIChat();
    }

    /**
     * Update navigation active state
     */
    updateNavigation(activeView) {
        const navButtons = utils.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            const view = btn.dataset.view;
            if (view === activeView) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    /**
     * Initialize view-specific functionality
     */
    initializeView(view) {
        switch (view) {
            case 'dashboard':
                this.initializeDashboard();
                break;
            case 'tasks':
                this.initializeTasks();
                break;
            case 'calendar':
                this.initializeCalendar();
                break;
            case 'projects':
                this.initializeProjects();
                break;
            case 'ai-chat':
                this.initializeAIChat();
                break;
        }
    }

    /**
     * Initialize dashboard view
     */
    initializeDashboard() {
        // Dashboard initialization will be handled by dashboard.js module
        if (typeof window.dashboardModule !== 'undefined') {
            window.dashboardModule.initialize();
        }
    }

    /**
     * Initialize tasks view
     */
    initializeTasks() {
        // Tasks initialization will be handled by tasks.js module
        if (typeof window.tasksModule !== 'undefined') {
            window.tasksModule.initialize();
        }
    }

    /**
     * Initialize calendar view
     */
    initializeCalendar() {
        // Calendar initialization will be handled by calendar.js module
        if (typeof window.calendarModule !== 'undefined') {
            window.calendarModule.initialize();
        }
    }

    /**
     * Initialize projects view
     */
    initializeProjects() {
        // Projects initialization will be handled by projects.js module
        if (typeof window.projectsModule !== 'undefined') {
            window.projectsModule.initialize();
        }
    }

    /**
     * Initialize AI chat view
     */
    initializeAIChat() {
        // Initialize FAQ Loader first
        if (typeof window.faqLoader !== 'undefined') {
            console.log('A1: Initializing FAQ Loader...');
            window.faqLoader.initialize().then(() => {
                console.log('A1: FAQ Loader ready with', window.faqLoader.getStats().totalFAQs, 'FAQs');
            }).catch(error => {
                console.warn('A1: FAQ Loader initialization error:', error);
            });
        }

        // Initialize AI Service
        if (typeof AIService !== 'undefined' && !window.aiService) {
            console.log('A1: Creating new AI Service instance');
            window.aiService = new AIService();
            if (this.user && this.user.email) {
                console.log('A1: Setting AI service user email:', this.user.email);
                window.aiService.setUserEmail(this.user.email).then(() => {
                    return window.aiService.initialize();
                }).then(() => {
                    console.log('A1: AI service ready');
                }).catch(error => {
                    console.warn('A1: AI service initialization error:', error);
                });
            }
        }

        // Ensure voice modules are available globally
        console.log('A1: Checking voice modules availability:');
        console.log('VoiceChat available:', typeof window.VoiceChat !== 'undefined');
        console.log('VoiceAuth available:', typeof window.VoiceAuth !== 'undefined');

        // AI chat initialization will be handled by ai-chat.js module
        console.log('A1: Checking for AIChatModule...');
        console.log('A1: AIChatModule available:', typeof AIChatModule !== 'undefined');
        console.log('A1: window.aiChatModule exists:', !!window.aiChatModule);
        
        if (typeof AIChatModule !== 'undefined' && !window.aiChatModule) {
            console.log('A1: Creating new AI Chat Module instance');
            window.aiChatModule = new AIChatModule();
            window.aiChatModule.initialize();
        } else if (window.aiChatModule && !window.aiChatModule.initialized) {
            console.log('A1: Initializing existing AI Chat Module instance');
            window.aiChatModule.initialize();
        } else {
            console.log('A1: AI Chat Module already initialized or not available');
        }
    }

    /**
     * Toggle mobile menu
     */
    toggleMobileMenu() {
        const nav = utils.querySelector('.main-nav');
        if (nav) {
            nav.classList.toggle('mobile-open');
        }
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(e) {
        // Only handle shortcuts when not typing in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        // Alt + number keys for navigation
        if (e.altKey && !e.ctrlKey && !e.shiftKey) {
            switch (e.key) {
                case '1':
                    e.preventDefault();
                    this.navigateTo('dashboard');
                    break;
                case '2':
                    e.preventDefault();
                    this.navigateTo('tasks');
                    break;
                case '3':
                    e.preventDefault();
                    this.navigateTo('calendar');
                    break;
                case '4':
                    e.preventDefault();
                    this.navigateTo('projects');
                    break;
                case '5':
                    e.preventDefault();
                    this.navigateTo('ai-chat');
                    break;
            }
        }

        // Escape key to close modals
        if (e.key === 'Escape') {
            this.closeModals();
        }
    }

    /**
     * Close all open modals
     */
    closeModals() {
        const modals = utils.querySelectorAll('.modal.active');
        modals.forEach(modal => {
            modal.classList.remove('active');
            utils.hide(modal);
        });
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        const container = utils.getElementById('notificationContainer') || document.body;
        container.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    /**
     * Cleanup event listeners
     */
    cleanup() {
        this.eventListeners.forEach(listener => {
            if (listener && listener.remove) {
                listener.remove();
            }
        });
        this.eventListeners = [];
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.user;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.user && this.user.signedIn;
    }
}

// Global sign-in callback for Google API
window.onSignIn = function(googleUser) {
    if (window.mainApp) {
        window.mainApp.handleSignIn(googleUser);
    }
};

// Make the class globally accessible
window.MainApp = MainApp;

// Create auth module interface for compatibility
window.authModule = {
    getCurrentUser: () => window.mainApp?.getCurrentUser() || null,
    isAuthenticated: () => window.mainApp?.isAuthenticated() || false
};

// Auto-initialize the A1 Assistant application
console.log('A1: Initializing MainApp...');
window.mainApp = new MainApp();
console.log('A1: MainApp initialized and assigned to window.mainApp');

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MainApp;
}