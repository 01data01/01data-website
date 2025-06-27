/**
 * Mobile Gestures Module
 * Handles touch gestures and interactions for mobile devices
 */

class MobileGestures {
    constructor() {
        this.initialized = false;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.touchStartTime = 0;
        this.isScrolling = false;
        this.longPressTimer = null;
        this.doubleTapTimer = null;
        this.lastTap = 0;
        
        // Gesture thresholds
        this.config = {
            swipeThreshold: 50,
            swipeVelocity: 0.3,
            longPressDelay: 500,
            doubleTapDelay: 300,
            pinchThreshold: 0.05,
            pullToRefreshThreshold: 80
        };
        
        // Active gestures
        this.activeGestures = new Map();
    }

    /**
     * Initialize gesture handling
     */
    initialize() {
        if (this.initialized) return;
        
        console.log('Mobile: Initializing Gestures...');
        
        // Setup global gesture handlers
        this.setupGlobalGestures();
        
        // Setup specific element gestures
        this.setupElementGestures();
        
        // Prevent default behaviors
        this.preventDefaults();
        
        this.initialized = true;
        console.log('Mobile: Gestures initialized successfully');
    }

    /**
     * Setup global gesture handlers
     */
    setupGlobalGestures() {
        // Prevent pull-to-refresh on non-scrollable areas
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault(); // Prevent zoom
            }
        }, { passive: false });

        // Handle back swipe gesture
        this.setupBackSwipe();
        
        // Handle edge swipes
        this.setupEdgeSwipes();
    }

    /**
     * Setup element-specific gestures
     */
    setupElementGestures() {
        // Messages container
        const messagesContainer = document.getElementById('mobileMessages');
        if (messagesContainer) {
            this.setupMessageGestures(messagesContainer);
        }
        
        // Chat history items
        const historyItems = document.querySelectorAll('.mobile-history-item');
        historyItems.forEach(item => {
            this.setupSwipeActions(item);
        });
        
        // Input area
        const inputArea = document.getElementById('mobileInputArea');
        if (inputArea) {
            this.setupInputGestures(inputArea);
        }
    }

    /**
     * Setup back swipe gesture
     */
    setupBackSwipe() {
        let startX = 0;
        let startY = 0;
        let tracking = false;
        
        document.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            if (touch.clientX < 20) { // Start from left edge
                startX = touch.clientX;
                startY = touch.clientY;
                tracking = true;
            }
        });
        
        document.addEventListener('touchmove', (e) => {
            if (!tracking) return;
            
            const touch = e.touches[0];
            const deltaX = touch.clientX - startX;
            const deltaY = touch.clientY - startY;
            
            // Horizontal swipe detection
            if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > this.config.swipeThreshold) {
                // Check if sidebar is visible
                const sidebar = document.getElementById('mobileSidebar');
                if (!sidebar || !sidebar.classList.contains('active')) {
                    // Trigger back navigation or show sidebar
                    this.handleBackSwipe();
                    tracking = false;
                }
            }
        });
        
        document.addEventListener('touchend', () => {
            tracking = false;
        });
    }

    /**
     * Setup edge swipes
     */
    setupEdgeSwipes() {
        let startX = 0;
        let currentX = 0;
        let startTime = 0;
        let swiping = false;
        
        document.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            startX = touch.clientX;
            currentX = startX;
            startTime = Date.now();
            
            // Check if starting from edge
            if (startX < 20 || startX > window.innerWidth - 20) {
                swiping = true;
            }
        });
        
        document.addEventListener('touchmove', (e) => {
            if (!swiping) return;
            
            currentX = e.touches[0].clientX;
            const deltaX = currentX - startX;
            
            // Left edge swipe (open sidebar)
            if (startX < 20 && deltaX > this.config.swipeThreshold) {
                this.openSidebar();
                swiping = false;
            }
            
            // Right edge swipe (custom action)
            if (startX > window.innerWidth - 20 && deltaX < -this.config.swipeThreshold) {
                this.handleRightEdgeSwipe();
                swiping = false;
            }
        });
        
        document.addEventListener('touchend', () => {
            swiping = false;
        });
    }

    /**
     * Setup message gestures
     */
    setupMessageGestures(container) {
        // Pull to refresh
        this.setupPullToRefresh(container);
        
        // Message interactions
        const messages = container.querySelectorAll('.mobile-message');
        messages.forEach(message => {
            this.setupMessageInteractions(message);
        });
        
        // Observe new messages
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.classList && node.classList.contains('mobile-message')) {
                        this.setupMessageInteractions(node);
                    }
                });
            });
        });
        
        observer.observe(container, { childList: true });
    }

    /**
     * Setup pull to refresh
     */
    setupPullToRefresh(container) {
        let startY = 0;
        let currentY = 0;
        let isPulling = false;
        let pullIndicator = null;
        
        container.addEventListener('touchstart', (e) => {
            if (container.scrollTop === 0) {
                startY = e.touches[0].clientY;
                isPulling = true;
            }
        });
        
        container.addEventListener('touchmove', (e) => {
            if (!isPulling) return;
            
            currentY = e.touches[0].clientY;
            const pullDistance = currentY - startY;
            
            if (pullDistance > 0 && pullDistance < this.config.pullToRefreshThreshold * 2) {
                e.preventDefault();
                
                // Create/update pull indicator
                if (!pullIndicator) {
                    pullIndicator = this.createPullIndicator();
                    container.parentElement.appendChild(pullIndicator);
                }
                
                // Update indicator position
                const progress = Math.min(pullDistance / this.config.pullToRefreshThreshold, 1);
                this.updatePullIndicator(pullIndicator, progress);
            }
        });
        
        container.addEventListener('touchend', () => {
            if (!isPulling) return;
            
            const pullDistance = currentY - startY;
            
            if (pullDistance > this.config.pullToRefreshThreshold) {
                // Trigger refresh
                this.handlePullToRefresh();
            }
            
            // Remove indicator
            if (pullIndicator) {
                pullIndicator.remove();
                pullIndicator = null;
            }
            
            isPulling = false;
        });
    }

    /**
     * Setup message interactions
     */
    setupMessageInteractions(message) {
        // Long press
        this.addLongPress(message, () => {
            this.showMessageActions(message);
        });
        
        // Double tap
        this.addDoubleTap(message, () => {
            this.handleMessageDoubleTap(message);
        });
        
        // Swipe to reply (for user messages)
        if (message.classList.contains('user')) {
            this.addSwipe(message, 'left', () => {
                this.handleMessageSwipeReply(message);
            });
        }
    }

    /**
     * Setup swipe actions for list items
     */
    setupSwipeActions(element) {
        let startX = 0;
        let currentX = 0;
        let startTime = 0;
        let swiping = false;
        let actionsRevealed = false;
        
        element.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            currentX = startX;
            startTime = Date.now();
            swiping = true;
            element.style.transition = 'none';
        });
        
        element.addEventListener('touchmove', (e) => {
            if (!swiping) return;
            
            currentX = e.touches[0].clientX;
            const deltaX = currentX - startX;
            
            // Limit swipe distance
            const maxSwipe = 80;
            const swipeDistance = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX));
            
            // Apply transform
            element.style.transform = `translateX(${swipeDistance}px)`;
            
            // Show/hide actions
            if (Math.abs(swipeDistance) > 40) {
                this.revealSwipeActions(element, swipeDistance < 0 ? 'left' : 'right');
                actionsRevealed = true;
            }
        });
        
        element.addEventListener('touchend', () => {
            if (!swiping) return;
            
            const deltaX = currentX - startX;
            const velocity = Math.abs(deltaX) / (Date.now() - startTime);
            
            element.style.transition = '';
            
            // Determine final position
            if (actionsRevealed && velocity > this.config.swipeVelocity) {
                // Keep actions visible
                element.style.transform = `translateX(${deltaX < 0 ? -80 : 80}px)`;
            } else {
                // Snap back
                element.style.transform = 'translateX(0)';
                this.hideSwipeActions(element);
            }
            
            swiping = false;
            actionsRevealed = false;
        });
    }

    /**
     * Setup input area gestures
     */
    setupInputGestures(inputArea) {
        // Swipe down to minimize keyboard
        this.addSwipe(inputArea, 'down', () => {
            const input = document.getElementById('mobileInput');
            if (input) input.blur();
        });
        
        // Swipe up to expand input
        this.addSwipe(inputArea, 'up', () => {
            this.expandInput();
        });
    }

    /**
     * Add long press handler
     */
    addLongPress(element, callback) {
        let pressTimer = null;
        let startX = 0;
        let startY = 0;
        
        const start = (e) => {
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            
            pressTimer = setTimeout(() => {
                callback(e);
                // Haptic feedback
                if (window.navigator.vibrate) {
                    window.navigator.vibrate(50);
                }
            }, this.config.longPressDelay);
        };
        
        const move = (e) => {
            const touch = e.touches[0];
            const deltaX = Math.abs(touch.clientX - startX);
            const deltaY = Math.abs(touch.clientY - startY);
            
            // Cancel if moved too much
            if (deltaX > 10 || deltaY > 10) {
                clearTimeout(pressTimer);
            }
        };
        
        const end = () => {
            clearTimeout(pressTimer);
        };
        
        element.addEventListener('touchstart', start);
        element.addEventListener('touchmove', move);
        element.addEventListener('touchend', end);
        element.addEventListener('touchcancel', end);
    }

    /**
     * Add double tap handler
     */
    addDoubleTap(element, callback) {
        element.addEventListener('touchend', (e) => {
            const currentTime = Date.now();
            const tapLength = currentTime - this.lastTap;
            
            if (tapLength < this.config.doubleTapDelay && tapLength > 0) {
                e.preventDefault();
                callback(e);
            }
            
            this.lastTap = currentTime;
        });
    }

    /**
     * Add swipe handler
     */
    addSwipe(element, direction, callback) {
        let startX = 0;
        let startY = 0;
        let startTime = 0;
        
        element.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            startTime = Date.now();
        });
        
        element.addEventListener('touchend', (e) => {
            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - startX;
            const deltaY = touch.clientY - startY;
            const deltaTime = Date.now() - startTime;
            
            // Check if it's a swipe
            if (deltaTime < 500) {
                const absX = Math.abs(deltaX);
                const absY = Math.abs(deltaY);
                
                // Horizontal swipe
                if (absX > this.config.swipeThreshold && absX > absY) {
                    if (deltaX > 0 && direction === 'right') callback(e);
                    if (deltaX < 0 && direction === 'left') callback(e);
                }
                
                // Vertical swipe
                if (absY > this.config.swipeThreshold && absY > absX) {
                    if (deltaY > 0 && direction === 'down') callback(e);
                    if (deltaY < 0 && direction === 'up') callback(e);
                }
            }
        });
    }

    /**
     * Handle back swipe
     */
    handleBackSwipe() {
        // Check if we can go back
        if (window.history.length > 1) {
            window.history.back();
        } else {
            this.openSidebar();
        }
    }

    /**
     * Handle right edge swipe
     */
    handleRightEdgeSwipe() {
        // Custom action - could open quick settings, etc.
        console.log('Right edge swipe detected');
    }

    /**
     * Open sidebar
     */
    openSidebar() {
        const sidebar = document.getElementById('mobileSidebar');
        const menuBtn = document.getElementById('mobileMenuBtn');
        
        if (sidebar && !sidebar.classList.contains('active')) {
            sidebar.classList.add('active');
            if (menuBtn) menuBtn.classList.add('active');
            document.body.classList.add('mobile-no-scroll');
        }
    }

    /**
     * Handle pull to refresh
     */
    handlePullToRefresh() {
        // Trigger new chat
        if (window.mobileChatUI) {
            window.mobileChatUI.createNewChat();
        }
    }

    /**
     * Show message actions
     */
    showMessageActions(message) {
        const actions = [
            { label: 'Copy', icon: '📋', action: () => this.copyMessage(message) },
            { label: 'Reply', icon: '↩️', action: () => this.replyToMessage(message) },
            { label: 'Delete', icon: '🗑️', action: () => this.deleteMessage(message) }
        ];
        
        // Create and show context menu
        this.showContextMenu(message, actions);
    }

    /**
     * Show context menu
     */
    showContextMenu(element, actions) {
        // Remove existing menu
        const existingMenu = document.querySelector('.mobile-context-menu');
        if (existingMenu) existingMenu.remove();
        
        // Create menu
        const menu = document.createElement('div');
        menu.className = 'mobile-context-menu';
        menu.style.cssText = `
            position: fixed;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            padding: 8px;
            z-index: 1000;
        `;
        
        // Add actions
        actions.forEach(action => {
            const item = document.createElement('div');
            item.className = 'mobile-context-item';
            item.style.cssText = `
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 16px;
                cursor: pointer;
                border-radius: 8px;
            `;
            item.innerHTML = `<span>${action.icon}</span><span>${action.label}</span>`;
            item.addEventListener('click', () => {
                action.action();
                menu.remove();
            });
            menu.appendChild(item);
        });
        
        // Position menu
        const rect = element.getBoundingClientRect();
        menu.style.top = `${rect.top}px`;
        menu.style.left = `${Math.min(rect.left, window.innerWidth - 200)}px`;
        
        // Add to DOM
        document.body.appendChild(menu);
        
        // Remove on outside click
        setTimeout(() => {
            document.addEventListener('click', () => menu.remove(), { once: true });
        }, 100);
    }

    /**
     * Message actions
     */
    copyMessage(message) {
        const text = message.querySelector('.mobile-message-text').textContent;
        navigator.clipboard.writeText(text);
        this.showToast('Message copied');
    }

    replyToMessage(message) {
        const input = document.getElementById('mobileInput');
        if (input) {
            input.focus();
            // Add reply context
        }
    }

    deleteMessage(message) {
        message.style.transform = 'translateX(100%)';
        message.style.opacity = '0';
        setTimeout(() => message.remove(), 300);
    }

    handleMessageDoubleTap(message) {
        // Add reaction or like
        this.addReaction(message, '👍');
    }

    handleMessageSwipeReply(message) {
        this.replyToMessage(message);
    }

    /**
     * Add reaction to message
     */
    addReaction(message, emoji) {
        const bubble = message.querySelector('.mobile-bubble');
        if (!bubble) return;
        
        // Check if reactions container exists
        let reactions = bubble.querySelector('.mobile-reactions');
        if (!reactions) {
            reactions = document.createElement('div');
            reactions.className = 'mobile-reactions';
            reactions.style.cssText = `
                display: flex;
                gap: 4px;
                margin-top: 4px;
            `;
            bubble.appendChild(reactions);
        }
        
        // Add reaction
        const reaction = document.createElement('span');
        reaction.className = 'mobile-reaction';
        reaction.style.cssText = `
            background: rgba(0,0,0,0.05);
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 14px;
        `;
        reaction.textContent = emoji;
        reactions.appendChild(reaction);
        
        // Animate
        reaction.style.transform = 'scale(0)';
        setTimeout(() => {
            reaction.style.transform = 'scale(1)';
        }, 50);
    }

    /**
     * Reveal swipe actions
     */
    revealSwipeActions(element, direction) {
        // Implementation depends on your HTML structure
        const actions = element.querySelector('.mobile-swipe-actions');
        if (actions) {
            actions.classList.add('visible', direction);
        }
    }

    hideSwipeActions(element) {
        const actions = element.querySelector('.mobile-swipe-actions');
        if (actions) {
            actions.classList.remove('visible', 'left', 'right');
        }
    }

    /**
     * Expand input area
     */
    expandInput() {
        const bottomSheet = document.getElementById('mobileBottomSheet');
        if (bottomSheet) {
            bottomSheet.classList.add('active');
            bottomSheet.style.display = 'block';
        }
    }

    /**
     * Create pull indicator
     */
    createPullIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'mobile-pull-indicator';
        indicator.style.cssText = `
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%) translateY(-100%);
            width: 40px;
            height: 40px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        `;
        indicator.innerHTML = '↓';
        return indicator;
    }

    updatePullIndicator(indicator, progress) {
        const rotation = progress * 180;
        indicator.style.transform = `translateX(-50%) translateY(${progress * 40 - 100}%) rotate(${rotation}deg)`;
    }

    /**
     * Show toast notification
     */
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'mobile-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 24px;
            font-size: 14px;
            z-index: 2000;
            animation: fade-in 0.3s;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'fade-out 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    /**
     * Prevent default behaviors
     */
    preventDefaults() {
        // Prevent overscroll
        document.body.addEventListener('touchmove', (e) => {
            if (!this.isScrollable(e.target)) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Prevent zoom
        document.addEventListener('gesturestart', (e) => {
            e.preventDefault();
        });
    }

    /**
     * Check if element is scrollable
     */
    isScrollable(element) {
        while (element && element !== document.body) {
            const style = window.getComputedStyle(element);
            if (style.overflow === 'auto' || style.overflow === 'scroll' || 
                style.overflowY === 'auto' || style.overflowY === 'scroll') {
                return element.scrollHeight > element.clientHeight;
            }
            element = element.parentElement;
        }
        return false;
    }
}

// Export for use
window.MobileGestures = MobileGestures;