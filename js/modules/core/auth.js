/**
 * Authentication Module
 * Handles Google OAuth, user management, and authentication state
 */

class AuthModule {
    constructor() {
        this.initialized = false;
        this.user = null;
        this.authInstance = null;
        this.eventListeners = [];
        this.authStateCallbacks = [];
        
        // Authentication configuration
        this.config = {
            clientId: '336524755075-i029li7vjliiekjhheadd7ilr03aj73o.apps.googleusercontent.com',
            scope: 'profile email',
            hosted_domain: null
        };
    }

    /**
     * Initialize authentication module
     */
    async initialize() {
        if (this.initialized) return;
        
        try {
            console.log('Initializing Authentication Module...');
            
            await this.loadGoogleAPI();
            await this.initializeGoogleAuth();
            this.setupEventListeners();
            this.checkExistingSession();
            
            this.initialized = true;
            console.log('Authentication Module initialized successfully');
            
        } catch (error) {
            utils.logError('Auth Module Initialization', error);
            this.handleAuthError('Failed to initialize authentication');
        }
    }

    /**
     * Load Google API
     */
    async loadGoogleAPI() {
        return new Promise((resolve, reject) => {
            if (typeof gapi !== 'undefined') {
                resolve();
                return;
            }

            // Wait for Google API to load
            const checkGAPI = () => {
                if (typeof gapi !== 'undefined') {
                    resolve();
                } else {
                    setTimeout(checkGAPI, 100);
                }
            };

            // Timeout after 10 seconds
            setTimeout(() => {
                reject(new Error('Google API failed to load'));
            }, 10000);

            checkGAPI();
        });
    }

    /**
     * Initialize Google authentication
     */
    async initializeGoogleAuth() {
        return new Promise((resolve, reject) => {
            gapi.load('auth2', () => {
                gapi.auth2.init({
                    client_id: this.config.clientId,
                    scope: this.config.scope,
                    hosted_domain: this.config.hosted_domain
                }).then((authInstance) => {
                    this.authInstance = authInstance;
                    
                    // Listen for auth state changes
                    this.authInstance.isSignedIn.listen((isSignedIn) => {
                        this.handleAuthStateChange(isSignedIn);
                    });
                    
                    resolve();
                }).catch(reject);
            });
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Sign out button
        const signOutBtn = utils.getElementById('signOutBtn');
        if (signOutBtn) {
            const clickListener = utils.addEventListener(signOutBtn, 'click', () => {
                this.signOut();
            });
            this.eventListeners.push(clickListener);
        }

        // Manual sign in button (if exists)
        const signInBtn = utils.getElementById('manualSignInBtn');
        if (signInBtn) {
            const clickListener = utils.addEventListener(signInBtn, 'click', () => {
                this.signIn();
            });
            this.eventListeners.push(clickListener);
        }

        // Profile dropdown
        this.setupProfileDropdown();
    }

    /**
     * Setup profile dropdown
     */
    setupProfileDropdown() {
        const profileBtn = utils.querySelector('.user-profile-btn');
        const profileDropdown = utils.querySelector('.profile-dropdown');
        
        if (profileBtn && profileDropdown) {
            const clickListener = utils.addEventListener(profileBtn, 'click', (e) => {
                e.stopPropagation();
                profileDropdown.classList.toggle('active');
            });
            this.eventListeners.push(clickListener);

            // Close dropdown when clicking outside
            const documentListener = utils.addEventListener(document, 'click', () => {
                profileDropdown.classList.remove('active');
            });
            this.eventListeners.push(documentListener);
        }
    }

    /**
     * Check for existing session
     */
    checkExistingSession() {
        try {
            // Check localStorage for saved user
            const savedUser = utils.loadFromStorage('user');
            if (savedUser && savedUser.signedIn) {
                this.user = savedUser;
            }

            // Check Google Auth state
            if (this.authInstance && this.authInstance.isSignedIn.get()) {
                const googleUser = this.authInstance.currentUser.get();
                this.handleSuccessfulAuth(googleUser);
            } else if (savedUser) {
                // Saved user but no Google session - sign out
                this.signOut();
            } else {
                this.handleAuthStateChange(false);
            }
            
        } catch (error) {
            utils.logError('Check Existing Session', error);
            this.handleAuthStateChange(false);
        }
    }

    /**
     * Handle authentication state change
     */
    handleAuthStateChange(isSignedIn) {
        if (isSignedIn) {
            if (this.authInstance) {
                const googleUser = this.authInstance.currentUser.get();
                this.handleSuccessfulAuth(googleUser);
            }
        } else {
            this.handleSignOut();
        }

        // Notify callbacks
        this.authStateCallbacks.forEach(callback => {
            utils.safeExecute(() => callback(isSignedIn, this.user));
        });
    }

    /**
     * Sign in user
     */
    async signIn() {
        if (!this.authInstance) {
            this.handleAuthError('Authentication not initialized');
            return false;
        }

        try {
            this.showSignInLoading(true);
            
            const googleUser = await this.authInstance.signIn();
            this.handleSuccessfulAuth(googleUser);
            
            return true;
            
        } catch (error) {
            this.handleAuthError('Sign in failed: ' + error.message);
            return false;
        } finally {
            this.showSignInLoading(false);
        }
    }

    /**
     * Sign out user
     */
    async signOut() {
        try {
            if (this.authInstance) {
                await this.authInstance.signOut();
            }
            
            this.handleSignOut();
            
        } catch (error) {
            utils.logError('Sign Out Error', error);
            // Force sign out even if Google sign out fails
            this.handleSignOut();
        }
    }

    /**
     * Handle successful authentication
     */
    handleSuccessfulAuth(googleUser) {
        try {
            const profile = googleUser.getBasicProfile();
            const authResponse = googleUser.getAuthResponse();
            
            this.user = {
                id: profile.getId(),
                name: profile.getName(),
                email: profile.getEmail(),
                image: profile.getImageUrl(),
                givenName: profile.getGivenName(),
                familyName: profile.getFamilyName(),
                signedIn: true,
                authToken: authResponse.access_token,
                signInTime: new Date().toISOString()
            };
            
            // Save user data
            utils.saveToStorage('user', this.user);
            
            // Update UI
            this.updateUserInterface();
            
            // Hide sign-in screen and show app
            if (window.mainApp) {
                window.mainApp.showApp();
            }
            
            // Log successful authentication
            console.log('User authenticated successfully:', this.user.email);
            
        } catch (error) {
            utils.logError('Handle Successful Auth', error);
            this.handleAuthError('Failed to process authentication');
        }
    }

    /**
     * Handle sign out
     */
    handleSignOut() {
        this.user = null;
        
        // Clear stored data
        utils.removeFromStorage('user');
        utils.removeFromStorage('tasks');
        utils.removeFromStorage('calendar');
        utils.removeFromStorage('conversations');
        utils.removeFromStorage('projects');
        
        // Update UI
        this.clearUserInterface();
        
        // Show sign-in screen
        if (window.mainApp) {
            window.mainApp.showSignIn();
        }
        
        console.log('User signed out successfully');
    }

    /**
     * Update user interface
     */
    updateUserInterface() {
        if (!this.user) return;

        // Update user avatar
        const userAvatar = utils.querySelector('.user-avatar');
        if (userAvatar) {
            userAvatar.src = this.user.image;
            userAvatar.alt = this.user.name;
        }

        // Update user name
        const userName = utils.querySelector('.user-name');
        if (userName) {
            userName.textContent = this.user.name;
        }

        // Update user email
        const userEmail = utils.querySelector('.user-email');
        if (userEmail) {
            userEmail.textContent = this.user.email;
        }

        // Update profile info
        const profileInfo = utils.querySelector('.profile-info');
        if (profileInfo) {
            profileInfo.innerHTML = `
                <div class="profile-avatar">
                    <img src="${this.user.image}" alt="${this.user.name}">
                </div>
                <div class="profile-details">
                    <div class="profile-name">${this.user.name}</div>
                    <div class="profile-email">${this.user.email}</div>
                </div>
            `;
        }

        // Show user controls
        const userControls = utils.querySelectorAll('.user-controls');
        userControls.forEach(control => {
            utils.show(control);
        });
    }

    /**
     * Clear user interface
     */
    clearUserInterface() {
        // Clear user avatar
        const userAvatar = utils.querySelector('.user-avatar');
        if (userAvatar) {
            userAvatar.src = '';
            userAvatar.alt = '';
        }

        // Clear user name
        const userName = utils.querySelector('.user-name');
        if (userName) {
            userName.textContent = '';
        }

        // Clear user email
        const userEmail = utils.querySelector('.user-email');
        if (userEmail) {
            userEmail.textContent = '';
        }

        // Clear profile info
        const profileInfo = utils.querySelector('.profile-info');
        if (profileInfo) {
            profileInfo.innerHTML = '';
        }

        // Hide user controls
        const userControls = utils.querySelectorAll('.user-controls');
        userControls.forEach(control => {
            utils.hide(control);
        });
    }

    /**
     * Show sign-in loading state
     */
    showSignInLoading(loading) {
        const signInBtn = utils.querySelector('.g-signin2');
        const loadingIndicator = utils.querySelector('.sign-in-loading');
        
        if (loading) {
            if (signInBtn) signInBtn.style.display = 'none';
            if (loadingIndicator) utils.show(loadingIndicator);
        } else {
            if (signInBtn) signInBtn.style.display = 'block';
            if (loadingIndicator) utils.hide(loadingIndicator);
        }
    }

    /**
     * Handle authentication error
     */
    handleAuthError(message) {
        console.error('Authentication Error:', message);
        
        // Show error to user
        this.showSignInError(message);
        
        // Ensure user is signed out
        this.handleSignOut();
    }

    /**
     * Show sign-in error
     */
    showSignInError(message) {
        const errorElement = utils.getElementById('signInError');
        if (errorElement) {
            errorElement.textContent = message;
            utils.show(errorElement);
            
            // Auto-hide error after 5 seconds
            setTimeout(() => {
                utils.hide(errorElement);
            }, 5000);
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.user && this.user.signedIn;
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.user;
    }

    /**
     * Get user token
     */
    getUserToken() {
        return this.user ? this.user.authToken : null;
    }

    /**
     * Refresh authentication token
     */
    async refreshToken() {
        if (!this.authInstance || !this.isAuthenticated()) {
            return null;
        }

        try {
            const googleUser = this.authInstance.currentUser.get();
            const authResponse = await googleUser.reloadAuthResponse();
            
            if (this.user) {
                this.user.authToken = authResponse.access_token;
                utils.saveToStorage('user', this.user);
            }
            
            return authResponse.access_token;
            
        } catch (error) {
            utils.logError('Token Refresh', error);
            return null;
        }
    }

    /**
     * Add authentication state callback
     */
    onAuthStateChange(callback) {
        if (typeof callback === 'function') {
            this.authStateCallbacks.push(callback);
        }
    }

    /**
     * Remove authentication state callback
     */
    removeAuthStateCallback(callback) {
        const index = this.authStateCallbacks.indexOf(callback);
        if (index > -1) {
            this.authStateCallbacks.splice(index, 1);
        }
    }

    /**
     * Get user permissions
     */
    getUserPermissions() {
        if (!this.isAuthenticated()) return [];
        
        // Basic permissions for authenticated users
        return [
            'read:tasks',
            'write:tasks',
            'read:calendar',
            'write:calendar',
            'read:projects',
            'write:projects',
            'use:ai'
        ];
    }

    /**
     * Check user permission
     */
    hasPermission(permission) {
        const permissions = this.getUserPermissions();
        return permissions.includes(permission);
    }

    /**
     * Get session duration
     */
    getSessionDuration() {
        if (!this.user || !this.user.signInTime) return 0;
        
        const signInTime = new Date(this.user.signInTime);
        const now = new Date();
        return now.getTime() - signInTime.getTime();
    }

    /**
     * Check if session is expired
     */
    isSessionExpired() {
        const maxSessionDuration = 24 * 60 * 60 * 1000; // 24 hours
        return this.getSessionDuration() > maxSessionDuration;
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
        this.authStateCallbacks = [];
        this.initialized = false;
    }
}

// Global sign-in callback for Google API
window.onSignIn = function(googleUser) {
    if (window.authModule) {
        window.authModule.handleSuccessfulAuth(googleUser);
    }
};

// Create and export singleton instance
const authModule = new AuthModule();

// Make it globally accessible
window.authModule = authModule;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = authModule;
}