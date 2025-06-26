// Mobile Chat UI Optimizations
class MobileChatUI {
    constructor() {
        this.isMobile = this.detectMobile();
        this.keyboardHeight = 0;
        this.originalViewportHeight = window.innerHeight;
        
        if (this.isMobile) {
            this.init();
        }
    }
    
    detectMobile() {
        return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;
    }
    
    init() {
        this.setupViewportHandling();
        this.setupKeyboardHandling();
        this.setupTouchOptimizations();
        this.setupMobileSidebar();
        this.optimizeInputs();
        this.setupAutoScroll();
    }
    
    // Handle mobile viewport issues
    setupViewportHandling() {
        // Set CSS custom property for real viewport height
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        setVH();
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', () => {
            setTimeout(setVH, 100);
        });
    }
    
    // Handle virtual keyboard
    setupKeyboardHandling() {
        const input = document.querySelector('.chat-input');
        if (!input) return;
        
        input.addEventListener('focus', () => {
            setTimeout(() => {
                this.handleKeyboardOpen();
            }, 300);
        });
        
        input.addEventListener('blur', () => {
            this.handleKeyboardClose();
        });
        
        // Detect keyboard height change
        window.addEventListener('resize', () => {
            this.detectKeyboardHeight();
        });
    }
    
    handleKeyboardOpen() {
        const chatContainer = document.querySelector('.ai-chat-container');
        const inputContainer = document.querySelector('.chat-input-container');
        
        if (chatContainer && inputContainer) {
            chatContainer.classList.add('keyboard-open');
            
            // Scroll to input
            setTimeout(() => {
                inputContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }, 100);
        }
    }
    
    handleKeyboardClose() {
        const chatContainer = document.querySelector('.ai-chat-container');
        if (chatContainer) {
            chatContainer.classList.remove('keyboard-open');
        }
    }
    
    detectKeyboardHeight() {
        const currentHeight = window.innerHeight;
        const heightDiff = this.originalViewportHeight - currentHeight;
        
        if (heightDiff > 150) { // Keyboard is likely open
            this.keyboardHeight = heightDiff;
            document.documentElement.style.setProperty('--keyboard-height', `${heightDiff}px`);
        } else {
            this.keyboardHeight = 0;
            document.documentElement.style.setProperty('--keyboard-height', '0px');
        }
    }
    
    // Touch optimizations
    setupTouchOptimizations() {
        // Prevent zoom on input focus
        const inputs = document.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('touchstart', (e) => {
                if (input.style.fontSize !== '16px') {
                    input.style.fontSize = '16px';
                }
            });
        });
        
        // Add touch feedback to buttons
        const buttons = document.querySelectorAll('button, .suggestion-btn');
        buttons.forEach(button => {
            button.addEventListener('touchstart', () => {
                button.classList.add('touch-active');
            }, { passive: true });
            
            button.addEventListener('touchend', () => {
                setTimeout(() => {
                    button.classList.remove('touch-active');
                }, 150);
            }, { passive: true });
        });
    }
    
    // Mobile sidebar implementation
    setupMobileSidebar() {
        const toggleBtn = document.querySelector('.sidebar-toggle-btn');
        const sidebar = document.querySelector('.chat-sidebar');
        
        if (!toggleBtn || !sidebar) return;
        
        // Create backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'sidebar-backdrop';
        document.body.appendChild(backdrop);
        
        // Toggle functionality
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleMobileSidebar();
        });
        
        // Close on backdrop click
        backdrop.addEventListener('click', () => {
            this.closeMobileSidebar();
        });
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar.classList.contains('show')) {
                this.closeMobileSidebar();
            }
        });
    }
    
    toggleMobileSidebar() {
        const sidebar = document.querySelector('.chat-sidebar');
        const backdrop = document.querySelector('.sidebar-backdrop');
        
        if (sidebar && backdrop) {
            const isOpen = sidebar.classList.contains('show');
            
            if (isOpen) {
                this.closeMobileSidebar();
            } else {
                this.openMobileSidebar();
            }
        }
    }
    
    openMobileSidebar() {
        const sidebar = document.querySelector('.chat-sidebar');
        const backdrop = document.querySelector('.sidebar-backdrop');
        
        if (sidebar && backdrop) {
            sidebar.classList.add('show');
            backdrop.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }
    
    closeMobileSidebar() {
        const sidebar = document.querySelector('.chat-sidebar');
        const backdrop = document.querySelector('.sidebar-backdrop');
        
        if (sidebar && backdrop) {
            sidebar.classList.remove('show');
            backdrop.classList.remove('show');
            document.body.style.overflow = '';
        }
    }
    
    // Optimize inputs for mobile
    optimizeInputs() {
        const chatInput = document.querySelector('.chat-input');
        if (!chatInput) return;
        
        // Prevent zoom on focus
        chatInput.style.fontSize = '16px';
        
        // Auto-resize textarea
        chatInput.addEventListener('input', () => {
            this.autoResizeInput(chatInput);
        });
        
        // Handle enter key
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }
    
    autoResizeInput(input) {
        input.style.height = 'auto';
        const maxHeight = 120; // Max 4 lines
        const newHeight = Math.min(input.scrollHeight, maxHeight);
        input.style.height = newHeight + 'px';
        
        // Adjust container height
        const container = input.closest('.chat-input-container');
        if (container) {
            container.style.height = 'auto';
        }
    }
    
    sendMessage() {
        const input = document.querySelector('.chat-input');
        const sendBtn = document.querySelector('.send-button');
        
        if (input && sendBtn && input.value.trim()) {
            sendBtn.click();
        }
    }
    
    // Auto-scroll to latest message
    setupAutoScroll() {
        const messagesContainer = document.querySelector('.chat-messages');
        if (!messagesContainer) return;
        
        // Observe new messages
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    this.scrollToBottom(true);
                }
            });
        });
        
        observer.observe(messagesContainer, { childList: true, subtree: true });
    }
    
    scrollToBottom(smooth = false) {
        const messagesContainer = document.querySelector('.chat-messages');
        if (!messagesContainer) return;
        
        const scrollOptions = {
            top: messagesContainer.scrollHeight,
            behavior: smooth ? 'smooth' : 'auto'
        };
        
        messagesContainer.scrollTo(scrollOptions);
    }
    
    // Handle orientation changes
    handleOrientationChange() {
        setTimeout(() => {
            this.scrollToBottom();
            this.setupViewportHandling();
        }, 100);
    }
    
    // Show loading state
    showMobileLoading(show = true) {
        const container = document.querySelector('.ai-chat-container');
        if (!container) return;
        
        if (show) {
            container.classList.add('mobile-loading');
        } else {
            container.classList.remove('mobile-loading');
        }
    }
    
    // Mobile-specific message formatting
    formatMobileMessage(text) {
        // Break long words for better mobile display
        return text.replace(/(\S{20,})/g, (match) => {
            return match.replace(/(.{15})/g, '$1<wbr>');
        });
    }
}

// CSS for mobile optimizations
const mobileStyles = `
<style>
.touch-active {
    transform: scale(0.95);
    opacity: 0.8;
}

.keyboard-open .chat-messages {
    height: calc(100vh - 200px) !important;
}

.mobile-loading::after {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, transparent, #4CAF50, transparent);
    animation: loading-bar 2s infinite;
    z-index: 1000;
}

@keyframes loading-bar {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
}

/* Use CSS custom properties for dynamic height */
.ai-chat-container {
    height: calc(var(--vh, 1vh) * 100);
}

.chat-messages {
    height: calc(var(--vh, 1vh) * 100 - 140px - var(--keyboard-height, 0px));
}
</style>
`;

// Initialize mobile UI
if ('ontouchstart' in window) {
    document.head.insertAdjacentHTML('beforeend', mobileStyles);
    
    document.addEventListener('DOMContentLoaded', () => {
        window.mobileChatUI = new MobileChatUI();
    });
    
    window.addEventListener('orientationchange', () => {
        if (window.mobileChatUI) {
            window.mobileChatUI.handleOrientationChange();
        }
    });
}