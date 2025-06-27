/**
 * UX Enhancement Script for A1 Chat Interface
 * Add this to enhance user experience and fix interaction issues
 */

console.log('A1: UX Enhancements module loaded');

// Enhanced message formatting function
function formatAIResponse(content) {
    // Split content into paragraphs and lists
    const lines = content.split('\n');
    let formattedContent = '';
    let inList = false;
    let listCounter = 0;
    
    lines.forEach(line => {
        const trimmedLine = line.trim();
        
        if (!trimmedLine) {
            formattedContent += '<br>';
            return;
        }
        
        // Check if it's a numbered list item
        if (/^\d+\./.test(trimmedLine)) {
            if (!inList) {
                formattedContent += '<ol class="enhanced-list">';
                inList = true;
                listCounter = 0;
            }
            listCounter++;
            const content = trimmedLine.replace(/^\d+\.\s*/, '');
            formattedContent += `<li><strong>${content}</strong></li>`;
        }
        // Check if it's a sub-item (starts with -)
        else if (/^-/.test(trimmedLine)) {
            const content = trimmedLine.replace(/^-\s*/, '');
            formattedContent += `<ul class="sub-list"><li>${content}</li></ul>`;
        }
        // Regular paragraph
        else {
            if (inList) {
                formattedContent += '</ol>';
                inList = false;
            }
            
            // Check if it's a heading (contains ":")
            if (trimmedLine.includes(':') && trimmedLine.length < 100) {
                formattedContent += `<h3>${trimmedLine}</h3>`;
            } else {
                formattedContent += `<p>${trimmedLine}</p>`;
            }
        }
    });
    
    if (inList) {
        formattedContent += '</ol>';
    }
    
    return formattedContent;
}

// Enhanced message creation with better formatting
function createEnhancedAIMessage(content) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message ai-message enhanced-message';
    
    const formattedContent = formatAIResponse(content);
    
    messageElement.innerHTML = `
        <div class="message-avatar">
            <div class="ai-avatar-soundwave">
                <div class="soundwave-container">
                    <div class="soundwave-bar"></div>
                    <div class="soundwave-bar"></div>
                    <div class="soundwave-bar"></div>
                    <div class="soundwave-bar"></div>
                    <div class="soundwave-bar"></div>
                </div>
            </div>
        </div>
        <div class="message-content">
            <div class="message-header">
                <span class="ai-label">A1 PVC Asistanı</span>
            </div>
            <div class="message-text">${formattedContent}</div>
        </div>
    `;
    
    return messageElement;
}

// Auto-resize textarea function
function setupAutoResizeTextarea() {
    const textarea = document.getElementById('chatInput');
    if (!textarea) return;
    
    function autoResize() {
        textarea.style.height = 'auto';
        const newHeight = Math.min(textarea.scrollHeight, 120);
        textarea.style.height = newHeight + 'px';
        
        // Update send button alignment
        const sendBtn = document.getElementById('sendChatBtn');
        if (sendBtn) {
            sendBtn.style.alignSelf = newHeight > 56 ? 'flex-end' : 'center';
        }
    }
    
    textarea.addEventListener('input', autoResize);
    textarea.addEventListener('paste', () => setTimeout(autoResize, 10));
    
    // Initial resize
    autoResize();
}

// Enhanced suggestion button interaction
function setupSuggestionButtons() {
    const suggestionBtns = document.querySelectorAll('.suggestion-btn');
    const chatInput = document.getElementById('chatInput');
    
    suggestionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const text = this.textContent.trim();
            if (chatInput) {
                chatInput.value = text;
                chatInput.focus();
                
                // Trigger auto-resize
                chatInput.dispatchEvent(new Event('input'));
                
                // Add visual feedback
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 150);
            }
        });
        
        // Enhanced hover effects
        btn.addEventListener('mouseenter', function() {
            this.style.boxShadow = '0 4px 12px rgba(77, 182, 172, 0.3)';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.boxShadow = '';
        });
    });
}

// Smooth scrolling to bottom with animation
function smoothScrollToBottom() {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;
    
    const scrollHeight = messagesContainer.scrollHeight;
    const height = messagesContainer.clientHeight;
    const maxScrollTop = scrollHeight - height;
    
    if (maxScrollTop > 0) {
        messagesContainer.scrollTo({
            top: maxScrollTop,
            behavior: 'smooth'
        });
    }
}

// Enhanced typing indicator with better animation
function showEnhancedTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;
    
    // Remove existing indicator
    const existingIndicator = document.getElementById('typingIndicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    const typingElement = document.createElement('div');
    typingElement.className = 'message ai-message typing-indicator enhanced-typing';
    typingElement.id = 'typingIndicator';
    typingElement.innerHTML = `
        <div class="message-avatar">
            <div class="ai-avatar-soundwave">
                <div class="soundwave-container">
                    <div class="soundwave-bar"></div>
                    <div class="soundwave-bar"></div>
                    <div class="soundwave-bar"></div>
                    <div class="soundwave-bar"></div>
                    <div class="soundwave-bar"></div>
                </div>
            </div>
        </div>
        <div class="message-content">
            <div class="typing-animation">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <span class="typing-text">Yazıyor...</span>
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(typingElement);
    smoothScrollToBottom();
}

// Add enhanced CSS for new features
function addEnhancedStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Enhanced message styling */
        .enhanced-message .message-content {
            position: relative;
        }
        
        .message-header {
            margin-bottom: 8px;
        }
        
        .ai-label {
            font-size: 12px;
            color: #15803d;
            font-weight: 600;
            opacity: 0.8;
        }
        
        /* Enhanced list styling */
        .enhanced-list {
            margin: 16px 0;
            padding-left: 0;
            list-style: none;
            counter-reset: item;
        }
        
        .enhanced-list > li {
            counter-increment: item;
            margin-bottom: 16px;
            position: relative;
            padding-left: 24px;
        }
        
        .enhanced-list > li::before {
            content: counter(item) ".";
            position: absolute;
            left: 0;
            top: 0;
            color: #15803d;
            font-weight: 600;
        }
        
        .enhanced-list > li strong {
            color: #15803d;
            display: block;
            margin-bottom: 6px;
        }
        
        .sub-list {
            margin: 6px 0 0 0;
            padding-left: 16px;
            list-style: none;
        }
        
        .sub-list li {
            position: relative;
            margin-bottom: 4px;
            padding-left: 12px;
            color: #166534;
            font-size: 14px;
        }
        
        .sub-list li::before {
            content: "—";
            position: absolute;
            left: 0;
            color: #22c55e;
        }
        
        /* Enhanced typing indicator */
        .enhanced-typing .typing-animation {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .typing-dots {
            display: flex;
            gap: 4px;
        }
        
        .typing-dots span {
            width: 6px;
            height: 6px;
            background: #22c55e;
            border-radius: 50%;
            animation: typing 1.4s ease-in-out infinite both;
        }
        
        .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
        .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
        .typing-dots span:nth-child(3) { animation-delay: 0s; }
        
        .typing-text {
            font-size: 14px;
            color: #15803d;
            font-style: italic;
        }
        
        @keyframes typing {
            0%, 80%, 100% {
                transform: scale(0.8);
                opacity: 0.5;
            }
            40% {
                transform: scale(1.2);
                opacity: 1;
            }
        }
        
        /* Enhanced suggestion hover */
        .suggestion-btn {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .suggestion-btn:active {
            transform: scale(0.95);
        }
        
        /* Smooth message appearance */
        .message {
            animation: messageAppear 0.5s ease-out;
        }
        
        @keyframes messageAppear {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Initialize all enhancements
function initializeUXEnhancements() {
    // Add enhanced styles
    addEnhancedStyles();
    
    // Setup auto-resize textarea
    setupAutoResizeTextarea();
    
    // Setup suggestion buttons
    setupSuggestionButtons();
    
    // Enhance existing AI messages
    const existingAIMessages = document.querySelectorAll('.ai-message, .assistant-message');
    existingAIMessages.forEach(message => {
        const content = message.querySelector('.message-text, .message-content');
        if (content && content.innerHTML) {
            content.innerHTML = formatAIResponse(content.textContent);
        }
    });
    
    console.log('A1: UX enhancements initialized successfully');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeUXEnhancements);
} else {
    initializeUXEnhancements();
}

// Export functions for use in other modules
window.UXEnhancements = {
    formatAIResponse,
    createEnhancedAIMessage,
    smoothScrollToBottom,
    showEnhancedTypingIndicator
};