/**
 * AI Widget Embed Script
 * Embeddable widget for AI-powered customer support
 * Supports both text chat and voice conversation modes
 */

(function() {
    'use strict';
    
    // Widget configuration
    let widgetConfig = {
        apiKey: '',
        endpoint: 'https://01data.org/widget-api/conversation',
        language: 'tr',
        position: 'bottom-right',
        company: 'AI Assistant',
        primaryColor: '#f7931e',
        voiceColor: '#00d4ff'
    };

    // Widget state
    let widgetState = {
        isOpen: false,
        currentMode: 'text', // 'text' or 'voice'
        sessionId: 'session_' + Date.now(),
        isRecording: false
    };

    // Create widget HTML
    function createWidgetHTML() {
        return `
            <!-- Widget Floating Button -->
            <div id="ai-widget-trigger" class="ai-widget-trigger">
                <div class="widget-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                        <circle cx="12" cy="8" r="1"/>
                        <circle cx="16" cy="8" r="1"/>
                        <circle cx="8" cy="8" r="1"/>
                    </svg>
                </div>
                <div class="widget-status-dot"></div>
            </div>

            <!-- Widget Panel -->
            <div id="ai-widget-panel" class="ai-widget-panel">
                <!-- Header -->
                <div class="widget-header">
                    <div class="header-content">
                        <div class="header-left">
                            <div class="header-logo">AI</div>
                            <div class="header-info">
                                <h3 id="widget-title">${widgetConfig.company}</h3>
                                <div class="header-status">
                                    <div class="status-dot"></div>
                                    <span id="widget-status">Online</span>
                                </div>
                            </div>
                        </div>
                        <div class="header-right">
                            <div class="language-toggle">
                                <button class="lang-btn ${widgetConfig.language === 'tr' ? 'active' : ''}" data-lang="tr" id="lang-tr">TR</button>
                                <button class="lang-btn ${widgetConfig.language === 'en' ? 'active' : ''}" data-lang="en" id="lang-en">EN</button>
                            </div>
                            <button class="close-btn" id="widget-close">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Mode Switcher -->
                <div class="mode-switcher">
                    <button class="mode-btn active" data-mode="text" id="text-mode-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                        </svg>
                        Text Chat
                    </button>
                    <button class="mode-btn" data-mode="voice" id="voice-mode-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                        </svg>
                        Voice Chat
                    </button>
                </div>

                <!-- Text Chat Mode -->
                <div id="text-mode" class="mode-content active">
                    <div class="chat-messages" id="chat-messages">
                        <div class="message ai-message">
                            <div class="message-bubble">
                                <span id="welcome-message">Hello! How can I help you today?</span>
                            </div>
                        </div>
                    </div>
                    <div class="chat-input">
                        <div class="input-wrapper">
                            <input type="text" id="message-input" placeholder="Type your message..." />
                            <button id="send-btn" class="send-btn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Voice Chat Mode -->
                <div id="voice-mode" class="mode-content">
                    <div class="voice-content">
                        <div class="voice-avatar" id="voice-avatar">
                            <div class="voice-waves">
                                <div class="voice-wave"></div>
                                <div class="voice-wave"></div>
                                <div class="voice-wave"></div>
                                <div class="voice-wave"></div>
                                <div class="voice-wave"></div>
                            </div>
                        </div>
                        
                        <div class="voice-status" id="voice-status">Ready to listen</div>
                        <div class="voice-instruction" id="voice-instruction">
                            Press the button below and speak.<br>
                            The AI will respond with voice.
                        </div>
                        
                        <button class="voice-button" id="voice-btn">
                            🎤 Start Speaking
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Create widget styles
    function createWidgetStyles() {
        return `
        <style id="ai-widget-styles">
        .ai-widget-trigger {
            position: fixed;
            ${widgetConfig.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
            ${widgetConfig.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, ${widgetConfig.primaryColor} 0%, #ff6b00 100%);
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(247, 147, 30, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9998;
            transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            border: none;
        }

        .ai-widget-trigger:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 25px rgba(247, 147, 30, 0.5);
        }

        .widget-status-dot {
            position: absolute;
            top: 4px;
            right: 4px;
            width: 12px;
            height: 12px;
            background: #4ade80;
            border: 2px solid white;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
        }

        .ai-widget-panel {
            position: fixed;
            ${widgetConfig.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
            ${widgetConfig.position.includes('bottom') ? 'bottom: 90px;' : 'top: 90px;'}
            width: 380px;
            height: 600px;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            display: none;
            flex-direction: column;
            overflow: hidden;
            z-index: 9999;
            transform: scale(0.8) translateY(20px);
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .ai-widget-panel.active {
            display: flex;
            transform: scale(1) translateY(0);
            opacity: 1;
        }

        .widget-header {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            padding: 16px 20px;
            color: #1e293b;
            border-bottom: 1px solid #e2e8f0;
            backdrop-filter: blur(10px);
            flex-shrink: 0;
            position: relative;
            z-index: 1;
        }

        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .header-right {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .header-logo {
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, ${widgetConfig.primaryColor} 0%, #ffb366 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            color: white;
            font-size: 14px;
            box-shadow: 0 4px 16px rgba(247, 147, 30, 0.25);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .header-info h3 {
            margin: 0 0 2px 0;
            font-size: 15px;
            font-weight: 600;
            color: #0f172a;
        }

        .header-status {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: #64748b;
            font-weight: 500;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            background: #10b981;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }

        .language-toggle {
            display: flex;
            background: #f1f5f9;
            border-radius: 12px;
            padding: 3px;
            border: 1px solid #e2e8f0;
        }

        .lang-btn {
            background: transparent;
            border: none;
            color: #64748b;
            padding: 6px 12px;
            border-radius: 9px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            transition: all 0.2s ease;
            min-width: 32px;
        }

        .lang-btn:hover {
            background: #e2e8f0;
            color: #334155;
        }

        .lang-btn.active {
            background: white;
            color: ${widgetConfig.primaryColor};
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .close-btn {
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            color: #64748b;
            cursor: pointer;
            padding: 6px;
            border-radius: 10px;
            transition: all 0.2s ease;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .close-btn:hover {
            background: #e2e8f0;
            color: #374151;
        }

        .mode-switcher {
            display: flex;
            padding: 16px 20px;
            background: #ffffff;
            border-bottom: 1px solid #f1f5f9;
            gap: 8px;
            flex-shrink: 0;
            position: relative;
            z-index: 1;
        }

        .mode-btn {
            flex: 1;
            padding: 12px 16px;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            background: #f8fafc;
            color: #64748b;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 14px;
            font-weight: 500;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .mode-btn:hover {
            background: #e2e8f0;
            color: #334155;
            border-color: #cbd5e1;
        }

        .mode-btn.active {
            background: ${widgetConfig.primaryColor};
            color: white;
            border-color: ${widgetConfig.primaryColor};
            box-shadow: 0 4px 12px rgba(247, 147, 30, 0.3);
        }

        .mode-btn[data-mode="voice"].active {
            background: ${widgetConfig.voiceColor};
            border-color: ${widgetConfig.voiceColor};
            box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
        }

        .mode-content {
            flex: 1;
            display: none;
            flex-direction: column;
            height: 100%;
        }

        .mode-content.active {
            display: flex;
        }

        /* Text Chat Styles */
        .chat-messages {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 20px;
            background: #ffffff;
            min-height: 300px;
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
        }

        .chat-messages::-webkit-scrollbar {
            width: 6px;
        }

        .chat-messages::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
        }

        .chat-messages::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 10px;
        }

        .chat-messages::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
        }

        .message {
            margin-bottom: 16px;
        }

        .message-bubble {
            background: #f8fafc;
            padding: 12px 16px;
            border-radius: 16px;
            max-width: 80%;
            border: 1px solid #f1f5f9;
            line-height: 1.5;
            font-size: 14px;
            color: #334155;
        }

        .ai-message .message-bubble {
            background: linear-gradient(135deg, ${widgetConfig.primaryColor} 0%, #ffb366 100%);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px rgba(247, 147, 30, 0.15);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }

        .user-message {
            text-align: right;
        }

        .user-message .message-bubble {
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            margin-left: auto;
            color: #1e293b;
        }

        .chat-input {
            padding: 16px 20px;
            background: #ffffff;
            border-top: 1px solid #f1f5f9;
        }

        .input-wrapper {
            display: flex;
            gap: 12px;
            align-items: center;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 4px;
        }

        #message-input {
            flex: 1;
            padding: 12px 16px;
            border: none;
            border-radius: 12px;
            outline: none;
            font-size: 14px;
            background: transparent;
            color: #1e293b;
        }

        #message-input::placeholder {
            color: #94a3b8;
        }

        #message-input:focus {
            outline: none;
        }

        .send-btn {
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, ${widgetConfig.primaryColor} 0%, #ffb366 100%);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            box-shadow: 0 4px 16px rgba(247, 147, 30, 0.2);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        }

        .send-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 24px rgba(247, 147, 30, 0.3);
            background: linear-gradient(135deg, #ff8a4c 0%, #ffb366 100%);
        }

        /* Voice Chat Styles */
        .voice-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px;
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        }

        .voice-avatar {
            width: 100px;
            height: 100px;
            background: linear-gradient(135deg, ${widgetConfig.voiceColor} 0%, #0099cc 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 24px;
            position: relative;
            overflow: hidden;
        }

        .voice-avatar.speaking {
            animation: speakingPulse 1s ease-in-out infinite;
        }

        @keyframes speakingPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }

        .voice-waves {
            display: flex;
            align-items: center;
            gap: 3px;
        }

        .voice-wave {
            width: 3px;
            height: 20px;
            background: rgba(255,255,255,0.8);
            border-radius: 2px;
            animation: voiceWave 1s ease-in-out infinite;
        }

        .voice-wave:nth-child(1) { animation-delay: 0s; }
        .voice-wave:nth-child(2) { animation-delay: 0.1s; }
        .voice-wave:nth-child(3) { animation-delay: 0.2s; }
        .voice-wave:nth-child(4) { animation-delay: 0.3s; }
        .voice-wave:nth-child(5) { animation-delay: 0.4s; }

        @keyframes voiceWave {
            0%, 100% { transform: scaleY(0.4); }
            50% { transform: scaleY(1); }
        }

        .voice-status {
            font-size: 18px;
            color: #333;
            margin-bottom: 8px;
            font-weight: 500;
        }

        .voice-instruction {
            color: #666;
            font-size: 14px;
            text-align: center;
            line-height: 1.5;
            margin-bottom: 24px;
        }

        .voice-button {
            padding: 14px 28px;
            background: linear-gradient(135deg, ${widgetConfig.voiceColor} 0%, #0099cc 100%);
            color: white;
            border: none;
            border-radius: 25px;
            font-size: 15px;
            font-weight: 500;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(0, 212, 255, 0.3);
            transition: all 0.3s;
        }

        .voice-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 212, 255, 0.4);
        }

        .voice-button.recording {
            background: linear-gradient(135deg, #ff5252 0%, #f44336 100%);
            animation: recordingPulse 1.5s infinite;
        }

        @keyframes recordingPulse {
            0%, 100% { box-shadow: 0 4px 16px rgba(255, 82, 82, 0.3); }
            50% { box-shadow: 0 6px 24px rgba(255, 82, 82, 0.6); }
        }

        /* Mobile Responsive */
        @media (max-width: 480px) {
            .ai-widget-panel {
                width: 100vw;
                height: 100vh;
                bottom: 0;
                right: 0;
                left: 0;
                top: 0;
                border-radius: 0;
            }

            .ai-widget-trigger {
                bottom: 80px;
                right: 16px;
            }

            .chat-messages {
                -webkit-overflow-scrolling: touch;
                overflow-scrolling: touch;
                padding: 15px;
                flex: 1;
                min-height: 0;
            }

            .chat-input {
                padding: 15px;
                position: sticky;
                bottom: 0;
            }

            .language-toggle {
                padding: 1px;
            }

            .lang-btn {
                padding: 4px 8px;
                font-size: 11px;
                min-width: 28px;
            }
        }

        /* Loading spinner */
        .loading-spinner {
            width: 20px;
            height: 20px;
            border: 2px solid #f0f0f0;
            border-top: 2px solid ${widgetConfig.primaryColor};
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        </style>
        `;
    }

    // Translations
    const translations = {
        en: {
            welcome: "Hello! How can I help you today?",
            placeholder: "Type your message...",
            voiceReady: "Ready to listen",
            voiceInstruction: "Press the button below and speak.<br>The AI will respond with voice.",
            startSpeaking: "🎤 Start Speaking",
            stopSpeaking: "⏹️ Stop Speaking",
            processing: "Processing...",
            listening: "Listening...",
            speaking: "Speaking...",
            online: "Online"
        },
        tr: {
            welcome: "Merhaba! Size nasıl yardımcı olabilirim?",
            placeholder: "Mesajınızı yazın...",
            voiceReady: "Dinlemeye hazır",
            voiceInstruction: "Aşağıdaki butona basın ve konuşun.<br>AI size sesli yanıt verecektir.",
            startSpeaking: "🎤 Konuşmaya Başla",
            stopSpeaking: "⏹️ Durdurmak için tıklayın",
            processing: "İşleniyor...",
            listening: "Dinliyorum...",
            speaking: "Konuşuyorum...",
            online: "Çevrimiçi"
        }
    };

    // Initialize widget
    function initWidget(config) {
        // Merge config
        Object.assign(widgetConfig, config);
        
        // Create widget container
        const widgetContainer = document.createElement('div');
        widgetContainer.id = 'ai-widget-container';
        widgetContainer.innerHTML = createWidgetHTML();
        
        // Add styles
        document.head.insertAdjacentHTML('beforeend', createWidgetStyles());
        
        // Add to page
        document.body.appendChild(widgetContainer);
        
        // Initialize event listeners
        initEventListeners();
        
        // Set initial language
        updateLanguage();
        
        console.log('AI Widget initialized successfully');
    }

    // Event listeners
    function initEventListeners() {
        // Toggle widget
        document.getElementById('ai-widget-trigger').addEventListener('click', toggleWidget);
        document.getElementById('widget-close').addEventListener('click', toggleWidget);
        
        // Mode switching
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => switchMode(btn.dataset.mode));
        });
        
        // Text chat
        document.getElementById('send-btn').addEventListener('click', sendMessage);
        document.getElementById('message-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
        
        // Voice chat
        document.getElementById('voice-btn').addEventListener('click', toggleVoiceRecording);
        
        // Language toggle
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => switchLanguage(btn.dataset.lang));
        });
    }

    // Toggle widget visibility
    function toggleWidget() {
        const panel = document.getElementById('ai-widget-panel');
        widgetState.isOpen = !widgetState.isOpen;
        
        if (widgetState.isOpen) {
            panel.classList.add('active');
            
            // Ensure proper scrolling when opening
            setTimeout(() => {
                forceScrollToBottom();
                if (widgetState.currentMode === 'text') {
                    document.getElementById('message-input').focus();
                }
            }, 300); // Wait for animation to complete
        } else {
            panel.classList.remove('active');
            if (widgetState.isRecording) {
                toggleVoiceRecording(); // Stop recording if widget is closed
            }
        }
    }

    // Switch between text and voice modes
    function switchMode(mode) {
        widgetState.currentMode = mode;
        
        // Update mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        // Update content visibility
        document.querySelectorAll('.mode-content').forEach(content => {
            content.classList.toggle('active', content.id === mode + '-mode');
        });
        
        // Focus input and ensure scroll if switching to text mode
        if (mode === 'text') {
            setTimeout(() => {
                forceScrollToBottom();
                document.getElementById('message-input').focus();
            }, 100);
        }
    }

    // Switch language
    function switchLanguage(lang) {
        widgetConfig.language = lang;
        
        // Update language buttons
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
        
        // Update all UI text
        updateLanguage();
        
        console.log(`Language switched to: ${lang}`);
    }

    // Send text message
    async function sendMessage() {
        const input = document.getElementById('message-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Add user message to chat
        addMessageToChat(message, 'user');
        input.value = '';
        
        // Show loading
        const loadingId = addMessageToChat('<div class="loading-spinner"></div>', 'ai');
        
        try {
            const response = await callAPI(message, 'text');
            
            // Remove loading and add response
            removeMessageFromChat(loadingId);
            
            if (response.success) {
                // Handle different API response formats
                let aiResponse = 'Response received';
                
                if (response.response?.content?.[0]?.text) {
                    // Claude API format
                    aiResponse = response.response.content[0].text;
                } else if (response.response?.text) {
                    // Direct text format
                    aiResponse = response.response.text;
                } else if (response.response?.choices?.[0]?.message?.content) {
                    // OpenAI format
                    aiResponse = response.response.choices[0].message.content;
                } else if (typeof response.response === 'string') {
                    // String response
                    aiResponse = response.response;
                }
                
                addMessageToChat(aiResponse, 'ai');
            } else {
                addMessageToChat('Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.', 'ai');
            }
        } catch (error) {
            removeMessageFromChat(loadingId);
            addMessageToChat('Sorry, I encountered an error. Please try again.', 'ai');
            console.error('API Error:', error);
        }
    }

    // Toggle voice recording
    function toggleVoiceRecording() {
        const btn = document.getElementById('voice-btn');
        const avatar = document.getElementById('voice-avatar');
        const status = document.getElementById('voice-status');
        const texts = translations[widgetConfig.language];
        
        widgetState.isRecording = !widgetState.isRecording;
        
        if (widgetState.isRecording) {
            btn.classList.add('recording');
            btn.textContent = texts.stopSpeaking;
            avatar.classList.add('speaking');
            status.textContent = texts.listening;
            
            // Start recording (implement Web Audio API)
            startVoiceRecording();
        } else {
            btn.classList.remove('recording');
            btn.textContent = texts.startSpeaking;
            avatar.classList.remove('speaking');
            status.textContent = texts.processing;
            
            // Stop recording and process
            stopVoiceRecording();
        }
    }

    // Voice recording functions (simplified - implement with Web Audio API)
    function startVoiceRecording() {
        console.log('Voice recording started...');
        // TODO: Implement Web Audio API recording
    }

    function stopVoiceRecording() {
        console.log('Voice recording stopped...');
        const status = document.getElementById('voice-status');
        const texts = translations[widgetConfig.language];
        
        // Simulate API call
        setTimeout(async () => {
            try {
                // TODO: Send actual audio data to API
                const response = await callAPI('Voice message received', 'voice');
                
                status.textContent = texts.speaking;
                
                // TODO: Play audio response
                setTimeout(() => {
                    status.textContent = texts.voiceReady;
                }, 3000);
                
            } catch (error) {
                status.textContent = 'Error occurred';
                setTimeout(() => {
                    status.textContent = texts.voiceReady;
                }, 2000);
            }
        }, 1000);
    }

    // Add message to chat
    function addMessageToChat(message, sender) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        messageElement.id = messageId;
        messageElement.innerHTML = `
            <div class="message-bubble">
                ${message}
            </div>
        `;
        
        messagesContainer.appendChild(messageElement);
        
        // Debug log
        console.log(`Added message [${messageId}]:`, message, `(${sender})`);
        
        // Smooth scroll to bottom with multiple methods for better compatibility
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            messagesContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
            
            // Alternative scroll method for better mobile support
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);
        
        return messageId;
    }

    // Remove message from chat
    function removeMessageFromChat(messageId) {
        const element = document.getElementById(messageId);
        if (element) {
            console.log(`Removing message [${messageId}]`);
            element.remove();
        } else {
            console.log(`Message [${messageId}] not found for removal`);
        }
    }

    // Force scroll to bottom of chat
    function forceScrollToBottom() {
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            // Multiple scroll methods for maximum compatibility
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
            // Force reflow
            messagesContainer.offsetHeight;
            
            // Try again after reflow
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 10);
        }
    }

    // Call API
    async function callAPI(message, mode) {
        const response = await fetch(widgetConfig.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': widgetConfig.apiKey
            },
            body: JSON.stringify({
                message: message,
                sessionId: widgetState.sessionId,
                language: widgetConfig.language,
                mode: mode
            })
        });
        
        return await response.json();
    }

    // Update language
    function updateLanguage() {
        const texts = translations[widgetConfig.language];
        
        // Update text elements
        const welcomeMsg = document.getElementById('welcome-message');
        const placeholder = document.getElementById('message-input');
        const voiceStatus = document.getElementById('voice-status');
        const voiceInstruction = document.getElementById('voice-instruction');
        const voiceBtn = document.getElementById('voice-btn');
        const widgetStatus = document.getElementById('widget-status');
        
        if (welcomeMsg) welcomeMsg.textContent = texts.welcome;
        if (placeholder) placeholder.placeholder = texts.placeholder;
        if (voiceStatus) voiceStatus.textContent = texts.voiceReady;
        if (voiceInstruction) voiceInstruction.innerHTML = texts.voiceInstruction;
        if (voiceBtn) voiceBtn.textContent = texts.startSpeaking;
        if (widgetStatus) widgetStatus.textContent = texts.online;
    }

    // Public API
    window.AIWidget = {
        init: function(config) {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => initWidget(config));
            } else {
                initWidget(config);
            }
        },
        
        open: function() {
            if (!widgetState.isOpen) toggleWidget();
        },
        
        close: function() {
            if (widgetState.isOpen) toggleWidget();
        },
        
        setLanguage: function(lang) {
            switchLanguage(lang);
        }
    };

})();