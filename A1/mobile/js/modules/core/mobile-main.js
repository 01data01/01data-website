/**
 * Mobile Main Application Controller
 * Entry point for mobile A1 Assistant
 */

console.log('A1 Mobile: Main application starting...');

class MobileApp {
    constructor() {
        this.initialized = false;
        this.modules = {};
        this.user = null;
        this.isReady = false;
        
        // Check if running on mobile
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        this.isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        this.isAndroid = /Android/i.test(navigator.userAgent);
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    /**
     * Initialize mobile application
     */
    async init() {
        if (this.initialized) return;
        
        try {
            console.log('A1 Mobile: Initializing application...');
            console.log('A1 Mobile: Device info:', {
                isMobile: this.isMobile,
                isIOS: this.isIOS,
                isAndroid: this.isAndroid,
                screenWidth: window.innerWidth,
                screenHeight: window.innerHeight,
                pixelRatio: window.devicePixelRatio
            });
            
            // Setup error handling
            this.setupErrorHandling();
            
            // Initialize core services
            await this.initializeCoreServices();
            
            // Setup authentication
            await this.setupAuthentication();
            
            // Initialize modules
            await this.initializeModules();
            
            // Setup app lifecycle
            this.setupAppLifecycle();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            // Show app
            this.showApp();
            
            this.initialized = true;
            this.isReady = true;
            
            console.log('A1 Mobile: Application initialized successfully');
            
            // Dispatch ready event
            window.dispatchEvent(new Event('mobileAppReady'));
            
        } catch (error) {
            console.error('A1 Mobile: Initialization error:', error);
            this.handleInitError(error);
        }
    }

    /**
     * Setup error handling
     */
    setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('A1 Mobile: Global error:', event.error);
            this.logError('Global Error', event.error);
        });
        
        // Unhandled promise rejection
        window.addEventListener('unhandledrejection', (event) => {
            console.error('A1 Mobile: Unhandled promise rejection:', event.reason);
            this.logError('Promise Rejection', event.reason);
            event.preventDefault();
        });
    }

    /**
     * Initialize core services
     */
    async initializeCoreServices() {
        console.log('A1 Mobile: Initializing core services...');
        
        // Initialize utilities
        if (!window.utils) {
            throw new Error('Utils module not loaded');
        }
        
        // Initialize FAQ Loader
        if (window.faqLoader) {
            console.log('A1 Mobile: Initializing FAQ Loader...');
            await window.faqLoader.initialize();
            console.log('A1 Mobile: FAQ Loader ready');
        }
        
        // Initialize AI Service
        if (window.aiService) {
            console.log('A1 Mobile: Initializing AI Service...');
            // AI service will be initialized after auth
        }
    }

    /**
     * Setup authentication
     */
    async setupAuthentication() {
        console.log('A1 Mobile: Setting up authentication...');
        
        // A1 Assistant - Auto-login as CEO user
        this.user = {
            id: 'a1-ceo-mobile',
            name: 'A1 CEO',
            email: 'ceo@a1plastic.com',
            image: 'https://ui-avatars.com/api/?name=A1+CEO&background=2c5f5d&color=fff',
            signedIn: true,
            role: 'CEO',
            platform: 'mobile'
        };
        
        // Save user session
        if (window.utils) {
            window.utils.saveToStorage('user', this.user);
        }
        
        // Initialize AI service with user
        if (window.aiService && this.user) {
            console.log('A1 Mobile: Setting AI service user email:', this.user.email);
            try {
                await window.aiService.setUserEmail(this.user.email);
                await window.aiService.initialize();
                console.log('A1 Mobile: AI service initialized');
            } catch (error) {
                console.warn('A1 Mobile: AI service initialization warning:', error);
                // Continue without AI service
            }
        }
        
        // Update user info in UI
        this.updateUserInfo();
        
        console.log('A1 Mobile: Authentication complete');
    }

    /**
     * Initialize modules
     */
    async initializeModules() {
        console.log('A1 Mobile: Initializing modules...');
        
        // Initialize Mobile UX
        if (window.MobileUX) {
            console.log('A1 Mobile: Initializing UX module...');
            this.modules.ux = new window.MobileUX();
            this.modules.ux.initialize();
        }
        
        // Initialize Mobile Gestures
        if (window.MobileGestures) {
            console.log('A1 Mobile: Initializing Gestures module...');
            this.modules.gestures = new window.MobileGestures();
            this.modules.gestures.initialize();
        }
        
        // Initialize Mobile Chat UI
        if (window.MobileChatUI) {
            console.log('A1 Mobile: Initializing Chat UI module...');
            this.modules.chatUI = new window.MobileChatUI();
            await this.modules.chatUI.initialize();
            
            // Make it globally accessible
            window.mobileChatUI = this.modules.chatUI;
        }
        
        console.log('A1 Mobile: All modules initialized');
    }

    /**
     * Update user info in UI
     */
    updateUserInfo() {
        if (!this.user) return;
        
        // Update avatar
        const avatars = document.querySelectorAll('.mobile-user-avatar');
        avatars.forEach(avatar => {
            avatar.src = this.user.image;
            avatar.alt = this.user.name;
        });
        
        // Update name
        const names = document.querySelectorAll('.mobile-user-name');
        names.forEach(name => {
            name.textContent = this.user.name;
        });
    }

    /**
     * Setup app lifecycle
     */
    setupAppLifecycle() {
        // Page visibility
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.onAppResume();
            } else {
                this.onAppPause();
            }
        });
        
        // App state changes
        window.addEventListener('focus', () => this.onAppFocus());
        window.addEventListener('blur', () => this.onAppBlur());
        
        // Prevent app refresh on pull
        document.body.addEventListener('touchmove', (e) => {
            if (e.touches[0].clientY > 0) {
                // Allow scrolling
                return;
            }
            // Prevent overscroll
            if (window.scrollY === 0) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Handle back button
        window.addEventListener('popstate', (e) => {
            this.handleBackButton(e);
        });
        
        // Setup service worker
        this.setupServiceWorker();
    }

    /**
     * Setup service worker for offline support
     */
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/A1/mobile/sw.js').then((registration) => {
                console.log('A1 Mobile: Service Worker registered:', registration.scope);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New version available
                            this.showUpdateNotification();
                        }
                    });
                });
            }).catch((error) => {
                console.log('A1 Mobile: Service Worker registration failed:', error);
            });
        }
    }

    /**
     * Show update notification
     */
    showUpdateNotification() {
        if (this.modules.ux) {
            this.modules.ux.showUpdatePrompt();
        }
    }

    /**
     * App lifecycle handlers
     */
    onAppResume() {
        console.log('A1 Mobile: App resumed');
        
        // Reconnect services
        if (window.aiService && window.aiService.connectionStatus === 'disconnected') {
            window.aiService.testConnection();
        }
        
        // Update UI
        if (this.modules.chatUI) {
            this.modules.chatUI.updateConnectionStatus();
        }
    }

    onAppPause() {
        console.log('A1 Mobile: App paused');
        
        // Save state
        this.saveAppState();
    }

    onAppFocus() {
        // Refresh data if needed
    }

    onAppBlur() {
        // Pause non-critical operations
    }

    /**
     * Handle back button
     */
    handleBackButton(event) {
        // Check if sidebar is open
        const sidebar = document.getElementById('mobileSidebar');
        if (sidebar && sidebar.classList.contains('active')) {
            event.preventDefault();
            if (this.modules.chatUI) {
                this.modules.chatUI.toggleSidebar();
            }
            return;
        }
        
        // Check if any modals are open
        const activeModals = document.querySelectorAll('.mobile-modal.active');
        if (activeModals.length > 0) {
            event.preventDefault();
            activeModals[activeModals.length - 1].classList.remove('active');
            return;
        }
        
        // Default back behavior
        if (window.history.length <= 1) {
            // Ask user if they want to exit
            if (confirm('Do you want to exit the app?')) {
                if (navigator.app && navigator.app.exitApp) {
                    navigator.app.exitApp();
                }
            }
        }
    }

    /**
     * Save app state
     */
    saveAppState() {
        const state = {
            timestamp: Date.now(),
            user: this.user,
            currentChatId: this.modules.chatUI?.currentChatId
        };
        
        if (window.utils) {
            window.utils.saveToStorage('mobileAppState', state);
        }
    }

    /**
     * Restore app state
     */
    restoreAppState() {
        if (window.utils) {
            const state = window.utils.loadFromStorage('mobileAppState');
            if (state && state.timestamp) {
                // Check if state is not too old (24 hours)
                const age = Date.now() - state.timestamp;
                if (age < 24 * 60 * 60 * 1000) {
                    return state;
                }
            }
        }
        return null;
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 300);
        }
    }

    /**
     * Show app
     */
    showApp() {
        const app = document.getElementById('app');
        if (app) {
            app.style.display = 'flex';
            setTimeout(() => {
                app.style.opacity = '1';
            }, 50);
        }
    }

    /**
     * Handle initialization error
     */
    handleInitError(error) {
        console.error('A1 Mobile: Failed to initialize:', error);
        
        // Hide loading screen
        this.hideLoadingScreen();
        
        // Show error message
        const errorHTML = `
            <div class="mobile-error-screen">
                <div class="mobile-error-content">
                    <h2>Oops! Something went wrong</h2>
                    <p>${error.message || 'Failed to load the application'}</p>
                    <button onclick="location.reload()">Retry</button>
                </div>
            </div>
        `;
        
        document.body.innerHTML = errorHTML;
    }

    /**
     * Log error for debugging
     */
    logError(context, error) {
        const errorLog = {
            context,
            message: error.message || error,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            platform: this.isMobile ? 'mobile' : 'desktop',
            url: window.location.href
        };
        
        // Log to console
        console.error('A1 Mobile Error Log:', errorLog);
        
        // Could send to error tracking service
        // this.sendErrorToService(errorLog);
    }

    /**
     * Public API
     */
    
    /**
     * Get current user
     */
    getCurrentUser() {
        return this.user;
    }

    /**
     * Check if app is ready
     */
    isAppReady() {
        return this.isReady;
    }

    /**
     * Get module by name
     */
    getModule(name) {
        return this.modules[name];
    }

    /**
     * Send notification
     */
    sendNotification(title, options = {}) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                icon: '/A1/shared/assets/logo.png',
                badge: '/A1/shared/assets/logo.png',
                ...options
            });
        }
    }

    /**
     * Request notification permission
     */
    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return false;
    }

    /**
     * Share content
     */
    async share(data) {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: data.title || 'A1 Assistant',
                    text: data.text || '',
                    url: data.url || window.location.href
                });
                return true;
            } catch (error) {
                console.log('A1 Mobile: Share cancelled or failed:', error);
                return false;
            }
        }
        return false;
    }
}

// Create mobile app instance
console.log('A1 Mobile: Creating app instance...');
window.mobileApp = new MobileApp();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileApp;
}