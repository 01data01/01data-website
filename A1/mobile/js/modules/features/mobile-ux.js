/**
 * Mobile UX Module
 * Handles mobile-specific user experience enhancements
 */

class MobileUX {
    constructor() {
        this.initialized = false;
        this.touchFeedback = null;
        this.keyboardHeight = 0;
        this.viewportHeight = window.innerHeight;
        this.orientation = window.orientation || 0;
        
        // Performance optimizations
        this.scrollThrottle = null;
        this.resizeThrottle = null;
    }

    /**
     * Initialize mobile UX enhancements
     */
    initialize() {
        if (this.initialized) return;
        
        console.log('Mobile: Initializing UX enhancements...');
        
        // Setup viewport handling
        this.setupViewport();
        
        // Setup touch feedback
        this.setupTouchFeedback();
        
        // Setup keyboard handling
        this.setupKeyboardHandling();
        
        // Setup performance optimizations
        this.setupPerformanceOptimizations();
        
        // Setup accessibility
        this.setupAccessibility();
        
        // Setup PWA features
        this.setupPWAFeatures();
        
        // Initialize animations
        this.initializeAnimations();
        
        this.initialized = true;
        console.log('Mobile: UX enhancements initialized successfully');
    }

    /**
     * Setup viewport handling
     */
    setupViewport() {
        // Handle viewport changes
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                this.handleViewportResize();
            });
            
            window.visualViewport.addEventListener('scroll', () => {
                this.handleViewportScroll();
            });
        }
        
        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            this.handleOrientationChange();
        });
        
        // Set CSS custom properties
        this.updateViewportProperties();
        
        // Handle safe areas
        this.handleSafeAreas();
    }

    /**
     * Update viewport properties
     */
    updateViewportProperties() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        
        // Dynamic viewport height
        const dvh = window.visualViewport ? window.visualViewport.height * 0.01 : vh;
        document.documentElement.style.setProperty('--dvh', `${dvh}px`);
    }

    /**
     * Handle viewport resize
     */
    handleViewportResize() {
        if (this.resizeThrottle) return;
        
        this.resizeThrottle = setTimeout(() => {
            const currentHeight = window.visualViewport.height;
            const heightDiff = this.viewportHeight - currentHeight;
            
            // Keyboard appeared
            if (heightDiff > 100) {
                this.keyboardHeight = heightDiff;
                this.onKeyboardShow();
            }
            // Keyboard hidden
            else if (this.keyboardHeight > 0 && heightDiff < 50) {
                this.keyboardHeight = 0;
                this.onKeyboardHide();
            }
            
            this.viewportHeight = currentHeight;
            this.updateViewportProperties();
            this.resizeThrottle = null;
        }, 100);
    }

    /**
     * Handle viewport scroll
     */
    handleViewportScroll() {
        if (this.scrollThrottle) return;
        
        this.scrollThrottle = requestAnimationFrame(() => {
            // Handle fixed elements during keyboard scroll
            if (this.keyboardHeight > 0) {
                this.adjustFixedElements();
            }
            this.scrollThrottle = null;
        });
    }

    /**
     * Handle orientation change
     */
    handleOrientationChange() {
        this.orientation = window.orientation || 0;
        this.updateViewportProperties();
        
        // Add orientation class
        document.body.classList.remove('portrait', 'landscape');
        document.body.classList.add(Math.abs(this.orientation) === 90 ? 'landscape' : 'portrait');
        
        // Adjust UI elements
        setTimeout(() => {
            this.adjustUIForOrientation();
        }, 300);
    }

    /**
     * Handle safe areas
     */
    handleSafeAreas() {
        // Set safe area classes
        const hasNotch = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0') > 0;
        if (hasNotch) {
            document.body.classList.add('has-notch');
        }
    }

    /**
     * Setup touch feedback
     */
    setupTouchFeedback() {
        this.touchFeedback = document.getElementById('mobileTouchFeedback');
        
        // Add touch feedback to all interactive elements
        document.addEventListener('touchstart', (e) => {
            const target = e.target.closest('button, a, .mobile-touchable');
            if (target) {
                this.showTouchFeedback(e.touches[0], target);
            }
        });
    }

    /**
     * Show touch feedback
     */
    showTouchFeedback(touch, element) {
        if (!this.touchFeedback) return;
        
        // Position feedback
        this.touchFeedback.style.left = `${touch.clientX}px`;
        this.touchFeedback.style.top = `${touch.clientY}px`;
        
        // Trigger animation
        this.touchFeedback.classList.remove('active');
        void this.touchFeedback.offsetWidth; // Force reflow
        this.touchFeedback.classList.add('active');
        
        // Add haptic feedback
        this.triggerHaptic('light');
    }

    /**
     * Setup keyboard handling
     */
    setupKeyboardHandling() {
        // Handle input focus
        const inputs = document.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('focus', () => this.onInputFocus(input));
            input.addEventListener('blur', () => this.onInputBlur(input));
        });
    }

    /**
     * Handle keyboard show
     */
    onKeyboardShow() {
        document.body.classList.add('keyboard-visible');
        
        // Adjust input area
        const inputArea = document.getElementById('mobileInputArea');
        if (inputArea) {
            inputArea.style.transform = `translateY(-${this.keyboardHeight}px)`;
        }
        
        // Ensure active input is visible
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            setTimeout(() => {
                activeElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }, 300);
        }
    }

    /**
     * Handle keyboard hide
     */
    onKeyboardHide() {
        document.body.classList.remove('keyboard-visible');
        
        // Reset input area
        const inputArea = document.getElementById('mobileInputArea');
        if (inputArea) {
            inputArea.style.transform = '';
        }
    }

    /**
     * Handle input focus
     */
    onInputFocus(input) {
        // Add focus class
        input.closest('.mobile-input-wrapper')?.classList.add('focused');
        
        // Scroll to input after keyboard appears
        setTimeout(() => {
            const rect = input.getBoundingClientRect();
            const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
            
            if (rect.bottom > viewportHeight - 50) {
                input.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
        }, 300);
    }

    /**
     * Handle input blur
     */
    onInputBlur(input) {
        input.closest('.mobile-input-wrapper')?.classList.remove('focused');
    }

    /**
     * Adjust fixed elements
     */
    adjustFixedElements() {
        const header = document.querySelector('.mobile-header');
        const inputArea = document.getElementById('mobileInputArea');
        
        if (window.visualViewport) {
            const offsetY = window.visualViewport.offsetTop;
            
            if (header) {
                header.style.transform = `translateY(${Math.max(0, offsetY)}px)`;
            }
        }
    }

    /**
     * Adjust UI for orientation
     */
    adjustUIForOrientation() {
        const isLandscape = Math.abs(this.orientation) === 90;
        
        if (isLandscape) {
            // Reduce header height in landscape
            document.documentElement.style.setProperty('--mobile-header-height', '48px');
        } else {
            // Normal header height in portrait
            document.documentElement.style.setProperty('--mobile-header-height', '56px');
        }
        
        // Trigger resize event for other components
        window.dispatchEvent(new Event('resize'));
    }

    /**
     * Setup performance optimizations
     */
    setupPerformanceOptimizations() {
        // Passive event listeners
        this.setupPassiveListeners();
        
        // Lazy loading
        this.setupLazyLoading();
        
        // Debounced scroll
        this.setupOptimizedScroll();
        
        // Request idle callback for non-critical tasks
        this.setupIdleTasks();
    }

    /**
     * Setup passive listeners
     */
    setupPassiveListeners() {
        // Convert touch events to passive
        const touchEvents = ['touchstart', 'touchmove', 'touchend'];
        touchEvents.forEach(event => {
            document.addEventListener(event, () => {}, { passive: true });
        });
    }

    /**
     * Setup lazy loading
     */
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.add('loaded');
                        imageObserver.unobserve(img);
                    }
                });
            });
            
            // Observe all lazy images
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    /**
     * Setup optimized scroll
     */
    setupOptimizedScroll() {
        let scrollTimer = null;
        const messagesContainer = document.getElementById('mobileMessages');
        
        if (messagesContainer) {
            messagesContainer.addEventListener('scroll', () => {
                // Add scrolling class
                messagesContainer.classList.add('scrolling');
                
                // Clear timer
                clearTimeout(scrollTimer);
                
                // Remove scrolling class after scroll ends
                scrollTimer = setTimeout(() => {
                    messagesContainer.classList.remove('scrolling');
                }, 150);
            }, { passive: true });
        }
    }

    /**
     * Setup idle tasks
     */
    setupIdleTasks() {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                // Preload fonts
                this.preloadFonts();
                
                // Cache assets
                this.cacheAssets();
            });
        }
    }

    /**
     * Setup accessibility
     */
    setupAccessibility() {
        // Focus management
        this.setupFocusManagement();
        
        // Screen reader announcements
        this.setupAnnouncements();
        
        // Reduced motion support
        this.setupReducedMotion();
        
        // High contrast support
        this.setupHighContrast();
    }

    /**
     * Setup focus management
     */
    setupFocusManagement() {
        // Trap focus in modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                const modal = document.querySelector('.mobile-modal.active');
                if (modal) {
                    this.trapFocus(modal, e);
                }
            }
        });
    }

    /**
     * Trap focus within element
     */
    trapFocus(element, event) {
        const focusable = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = focusable[0];
        const lastFocusable = focusable[focusable.length - 1];
        
        if (event.shiftKey && document.activeElement === firstFocusable) {
            lastFocusable.focus();
            event.preventDefault();
        } else if (!event.shiftKey && document.activeElement === lastFocusable) {
            firstFocusable.focus();
            event.preventDefault();
        }
    }

    /**
     * Setup announcements
     */
    setupAnnouncements() {
        // Create announcer element
        const announcer = document.createElement('div');
        announcer.className = 'mobile-sr-only';
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.id = 'mobileAnnouncer';
        document.body.appendChild(announcer);
    }

    /**
     * Announce to screen readers
     */
    announce(message) {
        const announcer = document.getElementById('mobileAnnouncer');
        if (announcer) {
            announcer.textContent = message;
            // Clear after announcement
            setTimeout(() => {
                announcer.textContent = '';
            }, 1000);
        }
    }

    /**
     * Setup reduced motion
     */
    setupReducedMotion() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        
        const handleReducedMotion = () => {
            if (prefersReducedMotion.matches) {
                document.body.classList.add('reduce-motion');
            } else {
                document.body.classList.remove('reduce-motion');
            }
        };
        
        prefersReducedMotion.addListener(handleReducedMotion);
        handleReducedMotion();
    }

    /**
     * Setup high contrast
     */
    setupHighContrast() {
        const prefersHighContrast = window.matchMedia('(prefers-contrast: high)');
        
        const handleHighContrast = () => {
            if (prefersHighContrast.matches) {
                document.body.classList.add('high-contrast');
            } else {
                document.body.classList.remove('high-contrast');
            }
        };
        
        prefersHighContrast.addListener(handleHighContrast);
        handleHighContrast();
    }

    /**
     * Setup PWA features
     */
    setupPWAFeatures() {
        // Install prompt
        this.setupInstallPrompt();
        
        // Offline handling
        this.setupOfflineHandling();
        
        // Update prompt
        this.setupUpdatePrompt();
    }

    /**
     * Setup install prompt
     */
    setupInstallPrompt() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Show install button
            this.showInstallButton(deferredPrompt);
        });
        
        window.addEventListener('appinstalled', () => {
            console.log('Mobile: PWA installed');
            this.hideInstallButton();
        });
    }

    /**
     * Show install button
     */
    showInstallButton(prompt) {
        const installBtn = document.createElement('button');
        installBtn.className = 'mobile-install-btn';
        installBtn.textContent = 'Install App';
        installBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--mobile-primary);
            color: white;
            padding: 12px 24px;
            border-radius: 24px;
            border: none;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 100;
        `;
        
        installBtn.addEventListener('click', async () => {
            prompt.prompt();
            const { outcome } = await prompt.userChoice;
            if (outcome === 'accepted') {
                this.hideInstallButton();
            }
        });
        
        document.body.appendChild(installBtn);
    }

    hideInstallButton() {
        const btn = document.querySelector('.mobile-install-btn');
        if (btn) btn.remove();
    }

    /**
     * Setup offline handling
     */
    setupOfflineHandling() {
        window.addEventListener('online', () => {
            this.showConnectionStatus(true);
        });
        
        window.addEventListener('offline', () => {
            this.showConnectionStatus(false);
        });
    }

    /**
     * Show connection status
     */
    showConnectionStatus(online) {
        const message = online ? 'Back online' : 'No internet connection';
        const className = online ? 'online' : 'offline';
        
        const status = document.createElement('div');
        status.className = `mobile-connection-status ${className}`;
        status.textContent = message;
        status.style.cssText = `
            position: fixed;
            top: 60px;
            left: 50%;
            transform: translateX(-50%);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            z-index: 1000;
            animation: slide-down 0.3s;
        `;
        
        document.body.appendChild(status);
        
        setTimeout(() => {
            status.style.animation = 'slide-up 0.3s';
            setTimeout(() => status.remove(), 300);
        }, 3000);
    }

    /**
     * Setup update prompt
     */
    setupUpdatePrompt() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                this.showUpdatePrompt();
            });
        }
    }

    showUpdatePrompt() {
        const prompt = document.createElement('div');
        prompt.className = 'mobile-update-prompt';
        prompt.innerHTML = `
            <p>A new version is available!</p>
            <button onclick="location.reload()">Update</button>
        `;
        prompt.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 20px;
            right: 20px;
            background: white;
            padding: 16px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 1000;
        `;
        
        document.body.appendChild(prompt);
    }

    /**
     * Initialize animations
     */
    initializeAnimations() {
        // Add animation classes to elements
        const animatedElements = document.querySelectorAll('[data-animate]');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const animation = entry.target.dataset.animate;
                    entry.target.classList.add(`animate-${animation}`);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        animatedElements.forEach(el => observer.observe(el));
    }

    /**
     * Trigger haptic feedback
     */
    triggerHaptic(style = 'light') {
        if (window.navigator.vibrate) {
            const patterns = {
                light: 10,
                medium: 20,
                heavy: 30,
                success: [10, 50, 10],
                warning: [30, 30, 30],
                error: [50, 30, 50, 30, 50]
            };
            
            window.navigator.vibrate(patterns[style] || patterns.light);
        }
    }

    /**
     * Preload fonts
     */
    preloadFonts() {
        const fonts = ['Inter-Regular', 'Inter-Medium', 'Inter-Bold'];
        fonts.forEach(font => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'font';
            link.type = 'font/woff2';
            link.href = `/fonts/${font}.woff2`;
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });
    }

    /**
     * Cache assets
     */
    cacheAssets() {
        if ('caches' in window) {
            const assets = [
                '/A1/mobile/css/mobile-main.css',
                '/A1/mobile/js/modules/features/mobile-chat-ui.js',
                '/A1/shared/assets/logo.png',
                '/A1/shared/assets/logo_2.png'
            ];
            
            caches.open('mobile-assets-v1').then(cache => {
                cache.addAll(assets);
            });
        }
    }
}

// Export for use
window.MobileUX = MobileUX;