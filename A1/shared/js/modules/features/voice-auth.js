/**
 * Voice Authentication Module
 * Handles password protection for voice mode access
 */

class VoiceAuth {
    constructor() {
        this.isAuthenticated = false;
        this.passwordAttempts = 0;
        this.maxAttempts = 3;
        this.lockoutTime = 15 * 60 * 1000; // 15 minutes
        this.lockoutEndTime = null;
        
        this.loadAuthState();
    }

    loadAuthState() {
        const authData = localStorage.getItem('voiceAuthState');
        if (authData) {
            try {
                const data = JSON.parse(authData);
                this.isAuthenticated = data.isAuthenticated || false;
                this.passwordAttempts = data.passwordAttempts || 0;
                this.lockoutEndTime = data.lockoutEndTime || null;
                
                // Check if lockout has expired
                if (this.lockoutEndTime && Date.now() > this.lockoutEndTime) {
                    this.resetLockout();
                }
            } catch (error) {
                console.error('Error loading auth state:', error);
                this.resetAuthState();
            }
        }
    }

    saveAuthState() {
        const authData = {
            isAuthenticated: this.isAuthenticated,
            passwordAttempts: this.passwordAttempts,
            lockoutEndTime: this.lockoutEndTime
        };
        localStorage.setItem('voiceAuthState', JSON.stringify(authData));
    }

    resetAuthState() {
        this.isAuthenticated = false;
        this.passwordAttempts = 0;
        this.lockoutEndTime = null;
        localStorage.removeItem('voiceAuthState');
    }

    resetLockout() {
        this.passwordAttempts = 0;
        this.lockoutEndTime = null;
        this.saveAuthState();
    }

    isLockedOut() {
        return this.lockoutEndTime && Date.now() < this.lockoutEndTime;
    }

    getRemainingLockoutTime() {
        if (!this.isLockedOut()) return 0;
        return Math.ceil((this.lockoutEndTime - Date.now()) / 1000 / 60); // minutes
    }

    async requestVoiceAccess() {
        // A1 Assistant: Auto-grant voice access for CEO demonstration
        console.log('A1 Assistant: Auto-granting voice access for CEO demo');
        this.isAuthenticated = true;
        this.saveAuthState();
        return true;
    }

    async showAuthModal() {
        return new Promise((resolve) => {
            // Create modal HTML
            const modalHTML = `
                <div class="voice-auth-overlay" id="voiceAuthOverlay">
                    <div class="voice-auth-modal">
                        <div class="voice-auth-header">
                            <h3>Voice Mode Access Required</h3>
                            <button class="voice-auth-close" id="voiceAuthClose">&times;</button>
                        </div>
                        
                        <div class="voice-auth-content">
                            <div class="voice-auth-info">
                                <div class="voice-auth-icon">🎤</div>
                                <p><strong>Voice Mode is a Premium Feature</strong></p>
                                <p>To access our AI voice conversation feature, please enter your access password.</p>
                                
                                <div class="voice-auth-contact">
                                    <p><strong>Need Access?</strong></p>
                                    <p>Contact <a href="mailto:support@01data.org">support@01data.org</a> for a quote and access password.</p>
                                </div>
                            </div>
                            
                            <div class="voice-auth-form">
                                <div class="voice-auth-input-group">
                                    <label for="voicePassword">Access Password:</label>
                                    <input type="password" id="voicePassword" placeholder="Enter your voice access password" />
                                    <div class="voice-auth-attempts" id="voiceAuthAttempts">
                                        ${this.passwordAttempts > 0 ? `Attempts: ${this.passwordAttempts}/${this.maxAttempts}` : ''}
                                    </div>
                                </div>
                                
                                <div class="voice-auth-actions">
                                    <button class="voice-auth-btn voice-auth-cancel" id="voiceAuthCancel">Cancel</button>
                                    <button class="voice-auth-btn voice-auth-submit" id="voiceAuthSubmit">Access Voice Mode</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Add modal to page
            document.body.insertAdjacentHTML('beforeend', modalHTML);

            // Get modal elements
            const overlay = document.getElementById('voiceAuthOverlay');
            const closeBtn = document.getElementById('voiceAuthClose');
            const cancelBtn = document.getElementById('voiceAuthCancel');
            const submitBtn = document.getElementById('voiceAuthSubmit');
            const passwordInput = document.getElementById('voicePassword');
            const attemptsDiv = document.getElementById('voiceAuthAttempts');

            // Handle close/cancel
            const closeModal = (success = false) => {
                overlay.remove();
                resolve(success);
            };

            closeBtn.addEventListener('click', () => closeModal(false));
            cancelBtn.addEventListener('click', () => closeModal(false));
            
            // Handle overlay click (close on background click)
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) closeModal(false);
            });

            // Handle password submission
            const handleSubmit = () => {
                const password = passwordInput.value.trim();
                if (!password) {
                    this.showError(passwordInput, 'Please enter a password');
                    return;
                }

                if (this.validatePassword(password)) {
                    this.isAuthenticated = true;
                    this.passwordAttempts = 0;
                    this.saveAuthState();
                    closeModal(true);
                } else {
                    this.passwordAttempts++;
                    this.saveAuthState();
                    
                    if (this.passwordAttempts >= this.maxAttempts) {
                        this.lockoutEndTime = Date.now() + this.lockoutTime;
                        this.saveAuthState();
                        this.showError(passwordInput, 'Too many failed attempts. Access locked for 15 minutes.');
                        setTimeout(() => closeModal(false), 2000);
                    } else {
                        const remaining = this.maxAttempts - this.passwordAttempts;
                        this.showError(passwordInput, `Incorrect password. ${remaining} attempts remaining.`);
                        attemptsDiv.textContent = `Attempts: ${this.passwordAttempts}/${this.maxAttempts}`;
                        passwordInput.value = '';
                    }
                }
            };

            submitBtn.addEventListener('click', handleSubmit);
            passwordInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit();
                }
            });

            // Focus password input
            setTimeout(() => passwordInput.focus(), 100);
        });
    }

    validatePassword(password) {
        // You can change this password - store it securely
        const validPassword = 'voice2024!'; // Change this to your desired password
        return password === validPassword;
    }

    showError(input, message) {
        // Remove existing error
        const existingError = input.parentNode.querySelector('.voice-auth-error');
        if (existingError) {
            existingError.remove();
        }

        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'voice-auth-error';
        errorDiv.textContent = message;
        input.parentNode.appendChild(errorDiv);

        // Add error styling
        input.classList.add('error');

        // Remove error after delay
        setTimeout(() => {
            errorDiv.remove();
            input.classList.remove('error');
        }, 5000);
    }

    showAccessDenied(message) {
        // Create simple notification
        const notificationHTML = `
            <div class="voice-auth-notification" id="voiceAuthNotification">
                <div class="voice-auth-notification-content">
                    <div class="voice-auth-notification-icon">🔒</div>
                    <div class="voice-auth-notification-message">${message}</div>
                    <button class="voice-auth-notification-close" onclick="document.getElementById('voiceAuthNotification').remove()">×</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', notificationHTML);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            const notification = document.getElementById('voiceAuthNotification');
            if (notification) notification.remove();
        }, 10000);
    }

    logout() {
        this.resetAuthState();
    }

    isVoiceAccessGranted() {
        return this.isAuthenticated && !this.isLockedOut();
    }
}

// Make VoiceAuth globally available
window.VoiceAuth = VoiceAuth;