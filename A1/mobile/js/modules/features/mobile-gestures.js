// Mobile Gesture Handler
class MobileGestures {
    constructor() {
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.isLongPress = false;
        this.longPressTimer = null;
        this.pullRefreshThreshold = 80;
        this.pullRefreshActive = false;
        
        this.init();
    }
    
    init() {
        this.setupSwipeGestures();
        this.setupLongPress();
        this.setupPullToRefresh();
        this.preventZoom();
        this.setupHapticFeedback();
    }
    
    // Swipe Gestures for Sidebar
    setupSwipeGestures() {
        const chatContainer = document.querySelector('.ai-chat-container');
        if (!chatContainer) return;
        
        chatContainer.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
            this.touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });
        
        chatContainer.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.touchEndY = e.changedTouches[0].screenY;
            this.handleSwipe();
        }, { passive: true });
    }
    
    handleSwipe() {
        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        
        // Only handle horizontal swipes (ignore vertical scrolling)
        if (absX > absY && absX > 50) {
            const sidebar = document.querySelector('.chat-sidebar');
            const backdrop = document.querySelector('.sidebar-backdrop');
            
            if (deltaX > 0 && this.touchStartX < 50) {
                // Swipe right from left edge - open sidebar
                this.openSidebar();
            } else if (deltaX < 0 && sidebar?.classList.contains('show')) {
                // Swipe left - close sidebar
                this.closeSidebar();
            }
        }
    }
    
    openSidebar() {
        const sidebar = document.querySelector('.chat-sidebar');
        const backdrop = document.querySelector('.sidebar-backdrop');
        
        if (sidebar && backdrop) {
            sidebar.classList.add('show');
            backdrop.classList.add('show');
            this.triggerHaptic('light');
        }
    }
    
    closeSidebar() {
        const sidebar = document.querySelector('.chat-sidebar');
        const backdrop = document.querySelector('.sidebar-backdrop');
        
        if (sidebar && backdrop) {
            sidebar.classList.remove('show');
            backdrop.classList.remove('show');
            this.triggerHaptic('light');
        }
    }
    
    // Long Press Gestures
    setupLongPress() {
        document.addEventListener('touchstart', (e) => {
            const target = e.target.closest('.message, .suggestion-btn');
            if (!target) return;
            
            this.isLongPress = false;
            this.longPressTimer = setTimeout(() => {
                this.isLongPress = true;
                this.handleLongPress(target);
            }, 500);
        }, { passive: true });
        
        document.addEventListener('touchend', () => {
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
        }, { passive: true });
        
        document.addEventListener('touchmove', () => {
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
        }, { passive: true });
    }
    
    handleLongPress(element) {
        element.classList.add('long-press-active');
        this.triggerHaptic('medium');
        
        // Show context menu or copy text
        if (element.classList.contains('message')) {
            this.showMessageMenu(element);
        }
        
        setTimeout(() => {
            element.classList.remove('long-press-active');
        }, 200);
    }
    
    showMessageMenu(messageElement) {
        const text = messageElement.textContent;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('Message copied to clipboard');
            });
        }
    }
    
    // Pull to Refresh
    setupPullToRefresh() {
        const messagesContainer = document.querySelector('.chat-messages');
        if (!messagesContainer) return;
        
        let startY = 0;
        let currentY = 0;
        let isPulling = false;
        
        messagesContainer.addEventListener('touchstart', (e) => {
            if (messagesContainer.scrollTop === 0) {
                startY = e.touches[0].clientY;
                isPulling = true;
            }
        }, { passive: true });
        
        messagesContainer.addEventListener('touchmove', (e) => {
            if (!isPulling) return;
            
            currentY = e.touches[0].clientY;
            const pullDistance = currentY - startY;
            
            if (pullDistance > 0 && messagesContainer.scrollTop === 0) {
                e.preventDefault();
                
                if (pullDistance > this.pullRefreshThreshold) {
                    this.showPullRefreshIndicator();
                    this.pullRefreshActive = true;
                }
            }
        });
        
        messagesContainer.addEventListener('touchend', () => {
            if (this.pullRefreshActive) {
                this.hidePullRefreshIndicator();
                this.refreshChat();
                this.pullRefreshActive = false;
            }
            isPulling = false;
        }, { passive: true });
    }
    
    showPullRefreshIndicator() {
        let indicator = document.querySelector('.pull-refresh-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'pull-refresh-indicator';
            indicator.innerHTML = '↻';
            document.body.appendChild(indicator);
        }
        indicator.classList.add('show');
    }
    
    hidePullRefreshIndicator() {
        const indicator = document.querySelector('.pull-refresh-indicator');
        if (indicator) {
            indicator.classList.remove('show');
            setTimeout(() => indicator.remove(), 300);
        }
    }
    
    refreshChat() {
        this.triggerHaptic('medium');
        // Trigger chat refresh logic here
        window.dispatchEvent(new CustomEvent('chatRefresh'));
    }
    
    // Prevent Pinch Zoom
    preventZoom() {
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });
        
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = new Date().getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }
    
    // Haptic Feedback
    setupHapticFeedback() {
        // Add haptic classes to interactive elements
        const buttons = document.querySelectorAll('button, .suggestion-btn, .voice-toggle-btn');
        buttons.forEach(btn => {
            btn.classList.add('haptic-light');
            btn.addEventListener('touchstart', () => {
                this.triggerHaptic('light');
            }, { passive: true });
        });
    }
    
    triggerHaptic(intensity = 'light') {
        if ('vibrate' in navigator) {
            const patterns = {
                light: 10,
                medium: 20,
                heavy: 30
            };
            navigator.vibrate(patterns[intensity]);
        }
        
        // iOS Haptic Feedback (if available)
        if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') {
            // iOS haptic feedback would go here
        }
    }
    
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'mobile-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 12px 20px;
            border-radius: 20px;
            font-size: 14px;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.style.opacity = '1', 100);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
}

// Initialize mobile gestures
if ('ontouchstart' in window) {
    document.addEventListener('DOMContentLoaded', () => {
        new MobileGestures();
    });
}