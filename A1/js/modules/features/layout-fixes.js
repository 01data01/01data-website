/**
 * Layout Fix Script for A1 Chat Interface - Laptop Version
 * Add this to fix height/scrolling issues
 */

console.log('A1: Layout Fix Script Loaded');

// Fix layout issues on page load
function fixChatLayout() {
    console.log('A1: Fixing chat layout...');
    
    // Fix chat container layout
    const chatContainer = document.querySelector('.ai-chat-container');
    if (chatContainer) {
        // Force flex layout
        chatContainer.style.display = 'flex';
        chatContainer.style.flexDirection = 'row';
        // Remove fixed height constraints to allow flexible sizing
        chatContainer.style.height = 'auto';
        chatContainer.style.minHeight = '600px';
        chatContainer.style.maxHeight = 'calc(100vh - 180px)';
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
        console.log('A1: Chat main area fixed');
    }
    
    // Fix messages container
    const messagesContainer = document.querySelector('.chat-messages');
    if (messagesContainer) {
        messagesContainer.style.flex = '1';
        messagesContainer.style.overflowY = 'auto';
        messagesContainer.style.height = 'auto';
        messagesContainer.style.minHeight = '0';
        messagesContainer.style.maxHeight = 'none';
        console.log('A1: Messages container fixed');
    }
    
    // Ensure input container is visible
    const inputContainer = document.querySelector('.chat-input-container');
    if (inputContainer) {
        inputContainer.style.flex = '0 0 auto';
        inputContainer.style.position = 'relative';
        inputContainer.style.zIndex = '10';
        inputContainer.style.borderTop = '1px solid #e9ecef';
        console.log('A1: Input container visibility ensured');
    }
    
    // Fix sidebar
    const sidebar = document.querySelector('.chat-sidebar');
    if (sidebar) {
        sidebar.style.width = '300px';
        sidebar.style.minWidth = '300px';
        sidebar.style.maxWidth = '300px';
        sidebar.style.flexShrink = '0';
        console.log('A1: Sidebar dimensions fixed');
    }
}

// Force scroll to bottom function
function forceScrollToBottom() {
    const messagesContainer = document.querySelector('.chat-messages');
    if (messagesContainer) {
        setTimeout(() => {
            messagesContainer.scrollTo({
                top: messagesContainer.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
    }
}

// Resize handler to maintain layout
function handleResize() {
    const chatContainer = document.querySelector('.ai-chat-container');
    if (chatContainer) {
        // Use flexible height instead of fixed viewport height
        chatContainer.style.height = 'auto';
        chatContainer.style.minHeight = '600px';
        chatContainer.style.maxHeight = 'calc(100vh - 180px)';
    }
}

// Enhanced input area visibility check
function ensureInputVisibility() {
    const inputContainer = document.querySelector('.chat-input-container');
    const chatContainer = document.querySelector('.ai-chat-container');
    
    if (inputContainer && chatContainer) {
        const containerRect = chatContainer.getBoundingClientRect();
        const inputRect = inputContainer.getBoundingClientRect();
        
        // Check if input is outside visible area
        if (inputRect.bottom > containerRect.bottom) {
            console.log('A1: Input area was outside visible area, fixing...');
            fixChatLayout();
        }
    }
}

// Initialize layout fixes
function initializeLayoutFixes() {
    console.log('A1: Initializing layout fixes...');
    
    // Apply fixes immediately
    fixChatLayout();
    
    // Ensure input visibility
    setTimeout(ensureInputVisibility, 500);
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Add scroll helper to new messages
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE && 
                        (node.classList.contains('message') || 
                         node.classList.contains('ai-message') || 
                         node.classList.contains('assistant-message'))) {
                        forceScrollToBottom();
                    }
                });
            }
        });
    });
    
    const messagesContainer = document.querySelector('.chat-messages');
    if (messagesContainer) {
        observer.observe(messagesContainer, { childList: true });
    }
    
    console.log('A1: Layout fixes initialized successfully');
}

// Enhanced textarea auto-resize that doesn't break layout
function setupImprovedAutoResize() {
    const textarea = document.getElementById('chatInput');
    if (!textarea) return;
    
    function autoResize() {
        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = 'auto';
        
        // Calculate new height (max 120px)
        const newHeight = Math.min(textarea.scrollHeight, 120);
        textarea.style.height = newHeight + 'px';
        
        // Ensure input container stays visible
        const inputContainer = document.querySelector('.chat-input-container');
        if (inputContainer) {
            inputContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }
    
    textarea.addEventListener('input', autoResize);
    textarea.addEventListener('paste', () => setTimeout(autoResize, 10));
    
    // Initial resize
    autoResize();
}

// Debug function to log layout info
function debugLayout() {
    const chatContainer = document.querySelector('.ai-chat-container');
    const messagesContainer = document.querySelector('.chat-messages');
    const inputContainer = document.querySelector('.chat-input-container');
    
    console.log('A1: Layout Debug Info:');
    console.log('Chat Container:', chatContainer?.getBoundingClientRect());
    console.log('Messages Container:', messagesContainer?.getBoundingClientRect());
    console.log('Input Container:', inputContainer?.getBoundingClientRect());
    console.log('Window Height:', window.innerHeight);
}

// Initialize everything when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeLayoutFixes, 100);
        setTimeout(setupImprovedAutoResize, 200);
        setTimeout(debugLayout, 1000); // Debug after everything loads
    });
} else {
    setTimeout(initializeLayoutFixes, 100);
    setTimeout(setupImprovedAutoResize, 200);
    setTimeout(debugLayout, 1000);
}

// Export functions for manual calling
window.A1LayoutFixes = {
    fixChatLayout,
    forceScrollToBottom,
    ensureInputVisibility,
    debugLayout
};

// Add manual fix button (temporary for testing)
setTimeout(() => {
    const fixButton = document.createElement('button');
    fixButton.textContent = 'Fix Layout';
    fixButton.style.position = 'fixed';
    fixButton.style.top = '10px';
    fixButton.style.right = '10px';
    fixButton.style.zIndex = '9999';
    fixButton.style.padding = '10px';
    fixButton.style.background = '#ff4444';
    fixButton.style.color = 'white';
    fixButton.style.border = 'none';
    fixButton.style.borderRadius = '5px';
    fixButton.style.cursor = 'pointer';
    
    fixButton.addEventListener('click', () => {
        console.log('A1: Manual layout fix triggered');
        fixChatLayout();
        ensureInputVisibility();
        debugLayout();
    });
    
    document.body.appendChild(fixButton);
    
    // Remove button after 10 seconds
    setTimeout(() => {
        if (fixButton.parentNode) {
            fixButton.parentNode.removeChild(fixButton);
        }
    }, 10000);
}, 2000);