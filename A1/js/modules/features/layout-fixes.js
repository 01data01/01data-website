/**
 * Enhanced Layout Fix Script for A1 Chat Interface
 * Fixes bottom empty space issue
 */

console.log('A1: Enhanced Layout Fix Script Loaded');

// Fix layout issues on page load
function fixChatLayout() {
    console.log('A1: Fixing chat layout...');
    
    // Fix chat container layout
    const chatContainer = document.querySelector('.ai-chat-container');
    if (chatContainer) {
        chatContainer.style.display = 'flex';
        chatContainer.style.flexDirection = 'row';
        chatContainer.style.height = 'calc(100vh - 180px)';
        chatContainer.style.minHeight = 'auto'; // Remove minimum height
        chatContainer.style.overflow = 'hidden';
        console.log('A1: Chat container layout fixed');
    }
    
    // Fix chat main area
    const chatMain = document.querySelector('.chat-main');
    if (chatMain) {
        chatMain.style.display = 'flex';
        chatMain.style.flexDirection = 'column';
        chatMain.style.height = '100%';
        chatMain.style.flex = '1';
        chatMain.style.minWidth = '0';
        chatMain.style.overflow = 'hidden';
        chatMain.style.minHeight = '0'; // Allow shrinking
        console.log('A1: Chat main area fixed');
    }
    
    // Fix messages container
    const messagesContainer = document.querySelector('.chat-messages');
    if (messagesContainer) {
        messagesContainer.style.flex = '1 1 auto'; // Grow and shrink as needed
        messagesContainer.style.overflowY = 'auto';
        messagesContainer.style.minHeight = '0'; // Remove minimum height
        messagesContainer.style.paddingBottom = '20px';
        messagesContainer.style.display = 'flex';
        messagesContainer.style.flexDirection = 'column';
        messagesContainer.style.justifyContent = 'flex-start';
        
        // Check if only welcome message exists
        const messages = messagesContainer.querySelectorAll('.message, .animated-welcome-message');
        if (messages.length <= 1) {
            messagesContainer.style.flex = '0 0 auto';
            messagesContainer.style.marginBottom = 'auto';
        }
        
        console.log('A1: Messages container fixed');
    }
    
    // Fix input container
    const inputContainer = document.querySelector('.chat-input-container');
    if (inputContainer) {
        inputContainer.style.flex = '0 0 auto';
        inputContainer.style.marginTop = '0'; // Remove auto margin
        inputContainer.style.marginBottom = '0';
        inputContainer.style.position = 'relative';
        inputContainer.style.zIndex = '10';
        inputContainer.style.borderTop = '1px solid #e9ecef';
        inputContainer.style.padding = '20px 32px';
        console.log('A1: Input container fixed');
    }
    
    // Fix sidebar if present
    const sidebar = document.querySelector('.chat-sidebar');
    if (sidebar) {
        sidebar.style.width = '300px';
        sidebar.style.minWidth = '300px';
        sidebar.style.maxWidth = '300px';
        sidebar.style.flexShrink = '0';
        sidebar.style.height = '100%';
        console.log('A1: Sidebar dimensions fixed');
    }
}

// Monitor for new messages and adjust layout
function setupMessageObserver() {
    const messagesContainer = document.querySelector('.chat-messages');
    if (!messagesContainer) return;
    
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Check message count and adjust flex
                const messages = messagesContainer.querySelectorAll('.message, .animated-welcome-message');
                if (messages.length > 1) {
                    messagesContainer.style.flex = '1 1 auto';
                    messagesContainer.style.marginBottom = '0';
                } else {
                    messagesContainer.style.flex = '0 0 auto';
                    messagesContainer.style.marginBottom = 'auto';
                }
                
                // Scroll to bottom for new messages
                setTimeout(() => {
                    messagesContainer.scrollTo({
                        top: messagesContainer.scrollHeight,
                        behavior: 'smooth'
                    });
                }, 100);
            }
        });
    });
    
    observer.observe(messagesContainer, { childList: true });
    console.log('A1: Message observer set up');
}

// Resize handler to maintain layout
function handleResize() {
    const chatContainer = document.querySelector('.ai-chat-container');
    if (chatContainer) {
        const isMobile = window.innerWidth <= 768;
        const newHeight = `calc(100vh - ${isMobile ? '120px' : '180px'})`;
        chatContainer.style.height = newHeight;
        chatContainer.style.minHeight = 'auto';
    }
}

// Initialize layout fixes
function initializeLayoutFixes() {
    console.log('A1: Initializing enhanced layout fixes...');
    
    // Apply fixes immediately
    fixChatLayout();
    
    // Set up message observer
    setupMessageObserver();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Re-apply fixes after a short delay to ensure all elements are loaded
    setTimeout(fixChatLayout, 500);
    
    console.log('A1: Layout fixes initialized successfully');
}

// Initialize everything when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeLayoutFixes, 100);
    });
} else {
    setTimeout(initializeLayoutFixes, 100);
}

// Export functions for manual calling if needed
window.A1LayoutFixes = {
    fixChatLayout,
    handleResize,
    initializeLayoutFixes
};