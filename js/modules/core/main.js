/**
 * Main Application Module
 * Handles app initialization, routing, and core application logic
 */

class MainApp {
    constructor() {
        // Get initial view from URL hash or default to dashboard
        this.currentView = this.getViewFromHash() || 'dashboard';
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
     * Get view from URL hash
     */
    getViewFromHash() {
        const hash = window.location.hash.replace('#', '');
        const validViews = ['dashboard', 'tasks', 'calendar', 'projects', 'ai-chat'];
        return validViews.includes(hash) ? hash : null;
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
            // Hide loading screen first
            this.hideLoadingScreen();
            
            // First check for user data passed from main website URL
            const urlUser = this.checkForURLUserData();
            if (urlUser) {
                this.user = urlUser;
                utils.saveToStorage('user', this.user);
                this.showApp();
                resolve();
                return;
            }

            // Check if user is already signed in locally
            const savedUser = utils.loadFromStorage('user');
            if (savedUser) {
                this.user = savedUser;
                this.showApp();
                resolve();
                return;
            }

            // For development/testing - create a demo user
            const demoUser = {
                id: 'demo-user',
                name: 'Demo User',
                email: 'demo@example.com',
                image: 'https://ui-avatars.com/api/?name=Demo+User&background=4db6ac&color=fff',
                signedIn: true
            };
            
            // Check if we should use demo mode (for development)
            const useDemo = window.location.search.includes('demo=true') || 
                           localStorage.getItem('useDemoMode') === 'true';
            
            if (useDemo) {
                this.user = demoUser;
                utils.saveToStorage('user', this.user);
                this.showApp();
                resolve();
                return;
            }

            // Initialize Google Sign-In with timeout
            let authResolved = false;
            const authTimeout = setTimeout(() => {
                if (!authResolved) {
                    console.warn('Google Auth timeout, showing sign-in screen');
                    this.showSignIn();
                    resolve();
                    authResolved = true;
                }
            }, 3000);

            if (typeof gapi !== 'undefined') {
                try {
                    gapi.load('auth2', () => {
                        gapi.auth2.init({
                            client_id: '336524755075-i029li7vjliiekjhheadd7ilr03aj73o.apps.googleusercontent.com'
                        }).then(() => {
                            if (!authResolved) {
                                clearTimeout(authTimeout);
                                const authInstance = gapi.auth2.getAuthInstance();
                                if (authInstance.isSignedIn.get()) {
                                    this.handleSignIn(authInstance.currentUser.get());
                                } else {
                                    this.showSignIn();
                                }
                                resolve();
                                authResolved = true;
                            }
                        }).catch((error) => {
                            console.error('Google Auth initialization failed:', error);
                            if (!authResolved) {
                                clearTimeout(authTimeout);
                                this.showSignIn();
                                resolve();
                                authResolved = true;
                            }
                        });
                    });
                } catch (error) {
                    console.error('Error loading Google API:', error);
                    if (!authResolved) {
                        clearTimeout(authTimeout);
                        this.showSignIn();
                        resolve();
                        authResolved = true;
                    }
                }
            } else {
                // Google API not available, show sign-in screen
                console.warn('Google API not available');
                if (!authResolved) {
                    clearTimeout(authTimeout);
                    this.showSignIn();
                    resolve();
                    authResolved = true;
                }
            }
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
     * Show sign-in screen
     */
    showSignIn() {
        utils.hide('#loadingScreen');
        utils.show('#signInScreen');
        utils.hide('#app');
    }

    /**
     * Show main application
     */
    showApp() {
        utils.hide('#loadingScreen');
        utils.hide('#signInScreen');
        utils.show('#app');
        
        // Update user info in header
        this.updateUserInfo();
        
        // Initialize AI service now that user is authenticated
        if (window.aiService && this.user) {
            window.aiService.setUserEmail(this.user.email).then(() => {
                window.aiService.initialize();
            }).catch(error => {
                console.warn('AI service initialization failed:', error);
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

        // Mobile menu toggle
        const mobileMenuBtn = utils.getElementById('mobileMenuBtn');
        if (mobileMenuBtn) {
            const listener = utils.addEventListener(mobileMenuBtn, 'click', () => {
                this.toggleMobileMenu();
            });
            this.eventListeners.push(listener);
        }

        // Sign out button
        const signOutBtn = utils.getElementById('signOutBtn');
        if (signOutBtn) {
            const listener = utils.addEventListener(signOutBtn, 'click', () => {
                this.handleSignOut();
            });
            this.eventListeners.push(listener);
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
     * Show a specific view
     */
    showView(view, updateHistory = true) {
        const validViews = ['dashboard', 'tasks', 'calendar', 'projects', 'ai-chat'];
        if (!validViews.includes(view)) {
            console.warn(`Invalid view: ${view}`);
            return;
        }

        // Hide all views
        validViews.forEach(v => {
            const viewElement = utils.getElementById(`${v}-view`);
            if (viewElement) {
                utils.hide(viewElement);
            }
        });

        // Show selected view
        const targetView = utils.getElementById(`${view}-view`);
        if (targetView) {
            utils.show(targetView);
        }

        // Update navigation
        this.updateNavigation(view);

        // Update current view
        this.currentView = view;

        // Update browser history
        if (updateHistory) {
            const state = { view };
            history.pushState(state, '', `#${view}`);
        }

        // Initialize view-specific functionality
        this.initializeView(view);
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
        // AI chat initialization will be handled by ai-chat.js module
        if (typeof window.aiChatModule !== 'undefined') {
            window.aiChatModule.initialize();
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

// Auto-initialize will be handled by HTML
// No need to create instance here since HTML will do it

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MainApp;
}