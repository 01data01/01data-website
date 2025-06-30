/**
 * AI Widget Embed Script - A1 Style Voice Integration
 * Based on proven www.01data.org/a1 implementation
 */

(function() {
    'use strict';
    
    // Widget configuration with defaults
    const defaultConfig = {
        apiKey: '',
        endpoint: 'https://01data.org/widget-api/conversation',
        language: 'tr',
        position: 'bottom-right',
        company: 'AI Assistant',
        primaryColor: '#f7931e',
        voiceColor: '#00d4ff',
        elevenLabsAgentId: '' // Optional - will use environment variable if not provided
    };
    
    let widgetConfig = {};
    
    // Widget state
    const widgetState = {
        isOpen: false,
        currentMode: 'text',
        sessionId: 'session_' + Date.now(),
        isRecording: false,
        initialized: false
    };
    
    // Cache DOM elements
    const elements = {};
    
    // Voice chat instance (A1 style)
    let voiceChat = null;
    
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
            online: "Online",
            textChatMode: "Let's Message",
            voiceChatMode: "Let's Talk",
            connecting: "Connecting...",
            voiceError: "Voice chat unavailable. Please try again later."
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
            online: "Çevrimiçi",
            textChatMode: "Hadi Mesajlaşalım",
            voiceChatMode: "Hadi Konuşalım",
            connecting: "Bağlanıyor...",
            voiceError: "Sesli sohbet şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin."
        }
    };

    // SVG icons
    const SVG_ICONS = {
        chat: '<path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/><circle cx="12" cy="8" r="1"/><circle cx="16" cy="8" r="1"/><circle cx="8" cy="8" r="1"/>',
        close: '<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>',
        textChat: '<path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>',
        voice: '<path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>',
        send: '<path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>'
    };

    // A1 Style Voice Chat Class (Based on working implementation)
    class A1VoiceChat {
        constructor() {
            this.websocket = null;
            this.isConnected = false;
            this.isRecording = false;
            this.mediaRecorder = null;
            this.audioContext = null;
            this.audioQueue = [];
            this.isPlaying = false;
            this.stream = null;
            this.selectedAgent = 'primary'; // Default to primary agent
            
            // Configuration
            this.config = {
                sampleRate: 16000,
                audioFormat: 'pcm_16000'
            };

            this.callbacks = {
                onConnectionChange: null,
                onTranscript: null,
                onAgentResponse: null,
                onError: null,
                onModeChange: null
            };

            console.log('🚀 A1VoiceChat initialized - Widget Version');
        }

        setCallbacks(callbacks) {
            this.callbacks = { ...this.callbacks, ...callbacks };
        }

        setSelectedAgent(agentType) {
            this.selectedAgent = agentType;
            console.log(`Voice chat agent selected: ${agentType}`);
        }

        async startConversation() {
            console.log('A1: VoiceChat.startConversation() called - A1 Style');
            
            if (this.isConnected) {
                console.log('A1: Conversation already active');
                return;
            }

            try {
                console.log('A1: Requesting microphone permission...');
                
                // Request microphone permission
                this.stream = await navigator.mediaDevices.getUserMedia({ 
                    audio: {
                        sampleRate: this.config.sampleRate,
                        channelCount: 1,
                        echoCancellation: true,
                        noiseSuppression: true
                    }
                });

                console.log('A1: Microphone permission granted');

                // Set up WebSocket connection using A1 approach
                await this.connectWebSocket();
                
                // Set up audio recording
                await this.setupAudioRecording();
                
                console.log('A1: Voice conversation started successfully');
                
            } catch (error) {
                console.error('A1: Failed to start conversation:', error);
                this.handleError('Failed to start voice conversation: ' + error.message);
            }
        }

        async connectWebSocket() {
            return new Promise(async (resolve, reject) => {
                try {
                    console.log('A1: Getting signed URL from server...');
                    
                    // Use the A1 style endpoint approach
                    let url = 'https://01data.org/.netlify/functions/elevenlabs-signed-url';
                    
                    // Add agent selection parameter if secondary agent
                    if (this.selectedAgent === 'secondary') {
                        url += '?agent_id=secondary';
                        console.log('A1: Using secondary agent');
                    } else {
                        console.log('A1: Using primary agent (default)');
                    }
                    
                    console.log('A1: Fetching signed URL from:', url);
                    
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 10000);
                    
                    const response = await fetch(url, {
                        signal: controller.signal,
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        }
                    });
                    clearTimeout(timeoutId);
                    
                    console.log('A1: Signed URL response status:', response.status);
                    
                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('A1: Signed URL error response:', errorText);
                        throw new Error(`Failed to get signed URL: ${response.status} - ${errorText}`);
                    }
                    
                    const data = await response.json();
                    console.log('A1: Signed URL response data received');
                    
                    const signedUrl = data.signed_url;
                    
                    if (!signedUrl) {
                        console.error('A1: No signed URL in response');
                        throw new Error('No signed URL received from server');
                    }
                    
                    console.log('A1: Connecting with signed URL...');
                    console.log('A1: Using agent ID:', data.agent_id);
                    
                    this.websocket = new WebSocket(signedUrl);

                    this.websocket.onopen = () => {
                        console.log('A1: WebSocket connected successfully');
                        this.isConnected = true;
                        this.updateConnectionStatus(true);
                        
                        // Send conversation initiation (A1 style)
                        console.log('A1: Sending conversation initiation...');
                        this.sendMessage({
                            type: 'conversation_initiation_client_data',
                            conversation_config_override: {
                                agent: {
                                    prompt: {
                                        prompt: 'You are a helpful AI assistant. Provide professional customer support in both Turkish and English.'
                                    },
                                    first_message: 'Hello! How can I help you today?',
                                    language: widgetConfig.language || 'en'
                                }
                            }
                        });
                        
                        resolve();
                    };

                    this.websocket.onmessage = (event) => {
                        this.handleWebSocketMessage(event);
                    };

                    this.websocket.onclose = (event) => {
                        console.log('A1: WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
                        this.isConnected = false;
                        this.cleanup();
                        reject(new Error(`WebSocket connection closed: ${event.code} - ${event.reason}`));
                    };

                    this.websocket.onerror = (error) => {
                        console.error('A1: WebSocket error:', error);
                        this.isConnected = false;
                        this.cleanup();
                        reject(error);
                    };

                    // Connection timeout
                    setTimeout(() => {
                        if (!this.isConnected) {
                            reject(new Error('WebSocket connection timeout'));
                        }
                    }, 10000);
                    
                } catch (error) {
                    console.error('Error setting up WebSocket connection:', error);
                    reject(error);
                }
            });
        }

        async setupAudioRecording() {
            try {
                // Create audio context
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                    sampleRate: this.config.sampleRate
                });

                console.log('A1: Setting up audio processing...');
                const source = this.audioContext.createMediaStreamSource(this.stream);
                
                // Use script processor for audio chunks
                const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
                
                processor.onaudioprocess = (event) => {
                    if (this.isRecording && this.isConnected) {
                        const inputData = event.inputBuffer.getChannelData(0);
                        const audioData = this.convertFloat32ToPCM16(inputData);
                        const base64Audio = this.arrayBufferToBase64(audioData);
                        
                        this.sendMessage({
                            user_audio_chunk: base64Audio
                        });
                    }
                };

                source.connect(processor);
                processor.connect(this.audioContext.destination);

                this.isRecording = true;
                console.log('A1: Audio recording started successfully');
                
            } catch (error) {
                console.error('Failed to setup audio recording:', error);
                throw error;
            }
        }

        handleWebSocketMessage(event) {
            try {
                const data = JSON.parse(event.data);
                console.log('A1: Received WebSocket message:', data.type);
                
                switch (data.type) {
                    case 'conversation_initiation_metadata':
                        console.log('Conversation initialized');
                        break;
                        
                    case 'user_transcript':
                        const transcript = data.user_transcription_event?.user_transcript;
                        console.log('User transcript:', transcript);
                        if (this.callbacks.onTranscript) {
                            this.callbacks.onTranscript(transcript, 'user');
                        }
                        break;
                        
                    case 'agent_response':
                        const response = data.agent_response_event?.agent_response;
                        console.log('Agent response:', response);
                        if (this.callbacks.onAgentResponse) {
                            this.callbacks.onAgentResponse(response);
                        }
                        if (this.callbacks.onModeChange) {
                            this.callbacks.onModeChange({ mode: 'speaking' });
                        }
                        break;
                        
                    case 'audio':
                        const audioData = data.audio_event?.audio_base_64;
                        if (audioData && audioData.length > 0) {
                            console.log('A1: Playing audio response...');
                            this.playAudioResponse(audioData);
                        }
                        break;
                        
                    case 'ping':
                        const pingEventId = data.ping_event?.event_id;
                        const pingMs = data.ping_event?.ping_ms || 0;
                        
                        setTimeout(() => {
                            this.sendMessage({
                                type: 'pong',
                                event_id: pingEventId
                            });
                        }, pingMs);
                        break;
                        
                    case 'interruption':
                        console.log('Conversation interrupted');
                        this.stopAudioPlayback();
                        if (this.callbacks.onModeChange) {
                            this.callbacks.onModeChange({ mode: 'listening' });
                        }
                        break;
                        
                    default:
                        console.log('Unknown message type:', data.type);
                }
            } catch (error) {
                console.error('Error handling WebSocket message:', error);
            }
        }

        async playAudioResponse(base64Audio) {
            try {
                if (!base64Audio) return;
                
                // Decode base64 audio
                const audioBuffer = this.base64ToArrayBuffer(base64Audio);
                
                // Add to audio queue
                this.audioQueue.push({ buffer: audioBuffer });
                
                // Start playback if not already playing
                if (!this.isPlaying) {
                    this.processAudioQueue();
                }
            } catch (error) {
                console.error('A1: Error playing audio response:', error);
            }
        }

        async processAudioQueue() {
            if (this.audioQueue.length === 0) {
                this.isPlaying = false;
                if (this.callbacks.onModeChange) {
                    this.callbacks.onModeChange({ mode: 'listening' });
                }
                return;
            }

            this.isPlaying = true;
            const audioItem = this.audioQueue.shift();
            
            try {
                // Resume audio context if suspended
                if (this.audioContext.state === 'suspended') {
                    await this.audioContext.resume();
                }
                
                // Convert PCM data to audio buffer
                const audioBuffer = await this.pcmToAudioBuffer(audioItem.buffer);
                
                if (audioBuffer) {
                    // Create audio source and play
                    const source = this.audioContext.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(this.audioContext.destination);
                    
                    source.onended = () => {
                        this.processAudioQueue();
                    };
                    
                    source.start();
                }
                
            } catch (error) {
                console.error('Error processing audio queue:', error);
                this.processAudioQueue();
            }
        }

        async pcmToAudioBuffer(pcmData) {
            if (!pcmData || pcmData.byteLength === 0) return null;
            
            const frameCount = pcmData.byteLength / 2;
            if (frameCount <= 0) return null;
            
            const audioBuffer = this.audioContext.createBuffer(1, frameCount, this.config.sampleRate);
            const channelData = audioBuffer.getChannelData(0);
            
            // Convert 16-bit PCM to Float32
            const view = new DataView(pcmData);
            for (let i = 0; i < channelData.length; i++) {
                channelData[i] = view.getInt16(i * 2, true) / 32768.0;
            }
            
            return audioBuffer;
        }

        stopAudioPlayback() {
            this.audioQueue = [];
            this.isPlaying = false;
        }

        sendMessage(message) {
            if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
                this.websocket.send(JSON.stringify(message));
            }
        }

        stopConversation() {
            this.cleanup();
        }

        cleanup() {
            this.isRecording = false;
            this.isConnected = false;
            this.updateConnectionStatus(false);
            
            if (this.websocket) {
                this.websocket.close();
                this.websocket = null;
            }
            
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
                this.stream = null;
            }
            
            if (this.audioContext) {
                this.audioContext.close();
                this.audioContext = null;
            }
            
            this.stopAudioPlayback();
            console.log('Voice conversation stopped');
        }

        updateConnectionStatus(connected) {
            if (this.callbacks.onConnectionChange) {
                this.callbacks.onConnectionChange(connected);
            }
        }

        handleError(message) {
            console.error('Voice chat error:', message);
            if (this.callbacks.onError) {
                this.callbacks.onError(message);
            }
        }

        // Utility functions
        convertFloat32ToPCM16(float32Array) {
            const buffer = new ArrayBuffer(float32Array.length * 2);
            const view = new DataView(buffer);
            
            for (let i = 0; i < float32Array.length; i++) {
                const sample = Math.max(-1, Math.min(1, float32Array[i]));
                view.setInt16(i * 2, sample * 0x7FFF, true);
            }
            
            return buffer;
        }

        arrayBufferToBase64(buffer) {
            const bytes = new Uint8Array(buffer);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return btoa(binary);
        }

        base64ToArrayBuffer(base64) {
            const binaryString = atob(base64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            return bytes.buffer;
        }

        isConnectedToVoice() {
            return this.isConnected;
        }

        isRecordingVoice() {
            return this.isRecording;
        }
    }

    // Create widget HTML template
    function createWidgetHTML() {
        const position = widgetConfig.position;
        const langActive = (lang) => widgetConfig.language === lang ? 'active' : '';
        
        return `
            <div id="ai-widget-trigger" class="ai-widget-trigger">
                <div class="widget-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="white">${SVG_ICONS.chat}</svg>
                </div>
                <div class="widget-status-dot"></div>
            </div>

            <div id="ai-widget-panel" class="ai-widget-panel">
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
                                <button class="lang-btn ${langActive('tr')}" data-lang="tr">TR</button>
                                <button class="lang-btn ${langActive('en')}" data-lang="en">EN</button>
                            </div>
                            <button class="close-btn" id="widget-close">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">${SVG_ICONS.close}</svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="mode-switcher">
                    <button class="mode-btn active" data-mode="text" id="text-mode-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">${SVG_ICONS.textChat}</svg>
                        <span id="text-mode-label">Let's Message</span>
                    </button>
                    <button class="mode-btn" data-mode="voice" id="voice-mode-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">${SVG_ICONS.voice}</svg>
                        <span id="voice-mode-label">Let's Talk</span>
                    </button>
                </div>

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
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">${SVG_ICONS.send}</svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div id="voice-mode" class="mode-content">
                    <div class="voice-content">
                        <div class="voice-avatar" id="voice-avatar">
                            <div class="voice-waves">
                                ${Array.from({length: 5}, () => '<div class="voice-wave"></div>').join('')}
                            </div>
                        </div>
                        <div class="voice-status" id="voice-status">Ready to listen</div>
                        <div class="voice-instruction" id="voice-instruction">
                            Press the button below and speak.<br>
                            The AI will respond with voice.
                        </div>
                        <button class="voice-button" id="voice-btn">🎤 Start Speaking</button>
                    </div>
                </div>
            </div>
        `;
    }

    // Create widget styles (same as before - keeping existing CSS)
    function createWidgetStyles() {
        const { primaryColor, voiceColor, position } = widgetConfig;
        const isRight = position.includes('right');
        const isBottom = position.includes('bottom');
        
        return `<style id="ai-widget-styles">
        :root {
            --primary-color: ${primaryColor};
            --voice-color: ${voiceColor};
            --widget-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            --border-radius: 20px;
            --shadow-light: 0 4px 20px rgba(0,0,0,0.1);
            --shadow-medium: 0 8px 32px rgba(0,0,0,0.15);
        }

        .ai-widget-trigger {
            position: fixed;
            ${isRight ? 'right: 20px;' : 'left: 20px;'}
            ${isBottom ? 'bottom: 20px;' : 'top: 20px;'}
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, var(--primary-color) 0%, #ff6b00 100%);
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

        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }

        .ai-widget-panel {
            position: fixed;
            ${isRight ? 'right: 20px;' : 'left: 20px;'}
            ${isBottom ? 'bottom: 90px;' : 'top: 90px;'}
            width: 380px;
            height: 600px;
            background: rgba(255, 255, 255, 0.95);
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-medium);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            display: none;
            flex-direction: column;
            overflow: hidden;
            z-index: 9999;
            transform: scale(0.8) translateY(20px);
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            font-family: var(--widget-font);
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
        }

        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .header-right {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .header-logo {
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, var(--primary-color) 0%, #ffb366 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            color: white;
            font-size: 14px;
            box-shadow: 0 4px 16px rgba(247, 147, 30, 0.25);
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
            color: var(--primary-color);
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
            user-select: none;
            -webkit-user-select: none;
            position: relative;
        }
        
        .mode-btn * {
            pointer-events: none;
        }

        .mode-btn:hover {
            background: #e2e8f0;
            color: #334155;
            border-color: #cbd5e1;
        }

        .mode-btn.active {
            background: var(--primary-color);
            color: white;
            border-color: var(--primary-color);
            box-shadow: 0 4px 12px rgba(247, 147, 30, 0.3);
        }

        .mode-btn[data-mode="voice"].active {
            background: var(--voice-color);
            border-color: var(--voice-color);
            box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
        }

        .mode-content {
            flex: 1;
            display: none;
            flex-direction: column;
            min-height: 0;
            overflow: hidden;
        }

        .mode-content.active {
            display: flex;
        }

        .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            background: #ffffff;
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
            background: linear-gradient(135deg, var(--primary-color) 0%, #ffb366 100%);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px rgba(247, 147, 30, 0.15);
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
            flex-shrink: 0;
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

        .send-btn {
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, var(--primary-color) 0%, #ffb366 100%);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            box-shadow: 0 4px 16px rgba(247, 147, 30, 0.2);
        }

        .send-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 24px rgba(247, 147, 30, 0.3);
        }

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
            background: linear-gradient(135deg, var(--voice-color) 0%, #0099cc 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 24px;
            overflow: hidden;
        }

        .voice-avatar.speaking {
            animation: speakingPulse 1s ease-in-out infinite;
        }

        @keyframes speakingPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }

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

        @keyframes voiceWave { 0%, 100% { transform: scaleY(0.4); } 50% { transform: scaleY(1); } }

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
            background: linear-gradient(135deg, var(--voice-color) 0%, #0099cc 100%);
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

        .voice-button.connecting {
            background: linear-gradient(135deg, #ffa726 0%, #ff9800 100%);
        }

        @keyframes recordingPulse {
            0%, 100% { box-shadow: 0 4px 16px rgba(255, 82, 82, 0.3); }
            50% { box-shadow: 0 6px 24px rgba(255, 82, 82, 0.6); }
        }

        .loading-spinner {
            width: 20px;
            height: 20px;
            border: 2px solid #f0f0f0;
            border-top: 2px solid var(--primary-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

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
            .ai-widget-trigger { bottom: 80px; right: 16px; }
            .chat-messages { padding: 15px; }
            .chat-input { padding: 15px; position: sticky; bottom: 0; }
            .lang-btn { padding: 4px 8px; font-size: 11px; min-width: 28px; }
        }
        </style>`;
    }

    // Cache DOM elements for better performance
    function cacheElements() {
        elements.trigger = document.getElementById('ai-widget-trigger');
        elements.panel = document.getElementById('ai-widget-panel');
        elements.closeBtn = document.getElementById('widget-close');
        elements.messageInput = document.getElementById('message-input');
        elements.sendBtn = document.getElementById('send-btn');
        elements.chatMessages = document.getElementById('chat-messages');
        elements.voiceBtn = document.getElementById('voice-btn');
        elements.voiceAvatar = document.getElementById('voice-avatar');
        elements.voiceStatus = document.getElementById('voice-status');
        elements.welcomeMsg = document.getElementById('welcome-message');
        elements.voiceInstruction = document.getElementById('voice-instruction');
        elements.widgetStatus = document.getElementById('widget-status');
        elements.widgetTitle = document.getElementById('widget-title');
        elements.textModeLabel = document.getElementById('text-mode-label');
        elements.voiceModeLabel = document.getElementById('voice-mode-label');
        elements.modeBtns = document.querySelectorAll('.mode-btn');
        elements.langBtns = document.querySelectorAll('.lang-btn');
        elements.modeContents = document.querySelectorAll('.mode-content');
    }

    // Event listeners
    function initEventListeners() {
        elements.trigger.addEventListener('click', toggleWidget);
        elements.closeBtn.addEventListener('click', toggleWidget);
        
        document.addEventListener('click', (e) => {
            const modeBtn = e.target.closest('.mode-btn');
            if (modeBtn) {
                e.preventDefault();
                switchMode(modeBtn.dataset.mode);
                return;
            }
            
            const langBtn = e.target.closest('.lang-btn');
            if (langBtn) {
                e.preventDefault();
                switchLanguage(langBtn.dataset.lang);
                return;
            }
        });
        
        elements.sendBtn.addEventListener('click', sendMessage);
        elements.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        elements.voiceBtn.addEventListener('click', toggleVoiceRecording);
    }

    // Initialize widget
    function initWidget(config) {
        if (widgetState.initialized) return;
        
        widgetConfig = Object.assign({}, defaultConfig, config);
        
        const container = document.createElement('div');
        container.id = 'ai-widget-container';
        container.innerHTML = createWidgetHTML();
        
        document.head.insertAdjacentHTML('beforeend', createWidgetStyles());
        document.body.appendChild(container);
        
        cacheElements();
        initEventListeners();
        updateLanguage();
        
        widgetState.initialized = true;
        console.log('AI Widget initialized successfully');
    }

    // Toggle widget
    function toggleWidget() {
        widgetState.isOpen = !widgetState.isOpen;
        
        if (widgetState.isOpen) {
            elements.panel.classList.add('active');
            requestAnimationFrame(() => {
                forceScrollToBottom();
                if (widgetState.currentMode === 'text') {
                    elements.messageInput.focus();
                }
            });
        } else {
            elements.panel.classList.remove('active');
            if (widgetState.isRecording && voiceChat) {
                stopVoiceRecording();
            }
        }
    }

    // Switch mode
    function switchMode(mode) {
        if (!mode || widgetState.currentMode === mode) return;
        
        console.log(`Switching from ${widgetState.currentMode} to ${mode} mode`);
        
        if (widgetState.currentMode === 'voice' && voiceChat) {
            stopVoiceRecording();
        }
        
        widgetState.currentMode = mode;
        
        elements.modeBtns.forEach(btn => {
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        elements.modeContents.forEach(content => {
            if (content.id === mode + '-mode') {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
        
        if (mode === 'text') {
            requestAnimationFrame(() => {
                forceScrollToBottom();
                if (elements.messageInput) {
                    elements.messageInput.focus();
                }
            });
        }
    }

    // Switch language
    function switchLanguage(lang) {
        if (widgetConfig.language === lang) return;
        
        widgetConfig.language = lang;
        
        elements.langBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
        
        updateLanguage();
    }

    // Send message
    async function sendMessage() {
        const message = elements.messageInput.value.trim();
        if (!message) return;
        
        addMessageToChat(message, 'user');
        elements.messageInput.value = '';
        
        const loadingId = addMessageToChat('<div class="loading-spinner"></div>', 'ai');
        
        try {
            const response = await callAPI(message, 'text');
            removeMessageFromChat(loadingId);
            
            if (response.success) {
                const aiResponse = extractResponseText(response);
                addMessageToChat(aiResponse, 'ai');
            } else {
                addMessageToChat(getErrorMessage(), 'ai');
            }
        } catch (error) {
            removeMessageFromChat(loadingId);
            addMessageToChat('Sorry, I encountered an error. Please try again.', 'ai');
            console.error('API Error:', error);
        }
    }

    // Extract response text
    function extractResponseText(response) {
        if (response.response?.content?.[0]?.text) {
            return response.response.content[0].text;
        } else if (response.response?.text) {
            return response.response.text;
        } else if (response.response?.choices?.[0]?.message?.content) {
            return response.response.choices[0].message.content;
        } else if (typeof response.response === 'string') {
            return response.response;
        }
        return 'Response received';
    }

    // Get localized error message
    function getErrorMessage() {
        return widgetConfig.language === 'tr' 
            ? 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.'
            : 'Sorry, an error occurred. Please try again.';
    }

    // Toggle voice recording
    function toggleVoiceRecording() {
        widgetState.isRecording = !widgetState.isRecording;
        
        if (widgetState.isRecording) {
            startVoiceRecording();
        } else {
            stopVoiceRecording();
        }
    }

    // Start voice recording (A1 style)
    async function startVoiceRecording() {
        console.log('Starting A1 style voice conversation...');
        const texts = translations[widgetConfig.language];
        
        try {
            elements.voiceBtn.classList.add('connecting');
            elements.voiceBtn.textContent = texts.connecting;
            elements.voiceStatus.textContent = texts.connecting;
            
            // Create A1 style voice chat instance
            voiceChat = new A1VoiceChat();
            
            voiceChat.setCallbacks({
                onConnectionChange: (connected) => {
                    console.log('A1: Voice connection status changed:', connected);
                    if (connected) {
                        elements.voiceStatus.textContent = texts.listening;
                        elements.voiceAvatar.classList.add('speaking');
                        elements.voiceBtn.classList.remove('connecting');
                        elements.voiceBtn.classList.add('recording');
                        elements.voiceBtn.textContent = texts.stopSpeaking;
                    } else {
                        elements.voiceStatus.textContent = texts.voiceReady;
                        elements.voiceAvatar.classList.remove('speaking');
                        elements.voiceBtn.classList.remove('recording', 'connecting');
                        elements.voiceBtn.textContent = texts.startSpeaking;
                        widgetState.isRecording = false;
                        voiceChat = null;
                    }
                },
                onTranscript: (transcript, role) => {
                    console.log('A1: Voice transcript received:', transcript, 'role:', role);
                    if (role === 'user') {
                        addMessageToChat(transcript, 'user');
                    }
                },
                onAgentResponse: (response) => {
                    console.log('A1: Voice agent response:', response);
                    addMessageToChat(response, 'ai');
                },
                onError: (error) => {
                    console.error('A1: Voice chat error:', error);
                    elements.voiceStatus.textContent = texts.voiceError;
                    elements.voiceBtn.classList.remove('recording', 'connecting');
                    elements.voiceBtn.textContent = texts.startSpeaking;
                    widgetState.isRecording = false;
                    voiceChat = null;
                    
                    const alertMsg = widgetConfig.language === 'tr' 
                        ? 'Sesli sohbet başlatılamadı. Lütfen mikrofon ayarlarınızı kontrol edin.'
                        : 'Unable to start voice chat. Please check your microphone settings.';
                    setTimeout(() => alert(alertMsg), 100);
                },
                onModeChange: (mode) => {
                    if (mode.mode === 'speaking') {
                        elements.voiceStatus.textContent = texts.speaking;
                        elements.voiceAvatar.classList.add('speaking');
                    } else if (mode.mode === 'listening') {
                        elements.voiceStatus.textContent = texts.listening;
                    }
                }
            });

            await voiceChat.startConversation();
            
        } catch (error) {
            console.error('Error starting voice conversation:', error);
            elements.voiceStatus.textContent = texts.voiceError;
            elements.voiceBtn.classList.remove('recording', 'connecting');
            elements.voiceBtn.textContent = texts.startSpeaking;
            widgetState.isRecording = false;
            
            let alertMsg;
            if (error.name === 'NotAllowedError') {
                alertMsg = widgetConfig.language === 'tr' 
                    ? 'Sesli sohbet için mikrofon erişimi gereklidir. Lütfen mikrofon erişimine izin verin ve tekrar deneyin.'
                    : 'Microphone access is required for voice chat. Please allow microphone access and try again.';
            } else {
                alertMsg = widgetConfig.language === 'tr' 
                    ? 'Sesli sohbet başlatılamadı. Lütfen daha sonra tekrar deneyin.'
                    : 'Unable to start voice chat. Please try again later.';
            }
            
            setTimeout(() => alert(alertMsg), 100);
        }
    }

    // Stop voice recording  
    async function stopVoiceRecording() {
        console.log('Stopping voice conversation...');
        const texts = translations[widgetConfig.language];
        
        if (voiceChat) {
            voiceChat.stopConversation();
            voiceChat = null;
        }
        
        elements.voiceStatus.textContent = texts.voiceReady;
        elements.voiceAvatar.classList.remove('speaking');
        elements.voiceBtn.classList.remove('recording', 'connecting');
        elements.voiceBtn.textContent = texts.startSpeaking;
        widgetState.isRecording = false;
    }

    // Add message to chat
    function addMessageToChat(message, sender) {
        const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        messageElement.id = messageId;
        messageElement.innerHTML = `<div class="message-bubble">${message}</div>`;
        
        elements.chatMessages.appendChild(messageElement);
        
        requestAnimationFrame(() => {
            elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
        });
        
        return messageId;
    }

    // Remove message from chat
    function removeMessageFromChat(messageId) {
        const element = document.getElementById(messageId);
        if (element) {
            element.remove();
        }
    }

    // Force scroll to bottom
    function forceScrollToBottom() {
        if (elements.chatMessages) {
            elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
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
                message,
                sessionId: widgetState.sessionId,
                language: widgetConfig.language,
                mode
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.json();
    }

    // Update language
    function updateLanguage() {
        const texts = translations[widgetConfig.language];
        
        const updates = [
            [elements.welcomeMsg, 'textContent', texts.welcome],
            [elements.messageInput, 'placeholder', texts.placeholder],
            [elements.voiceStatus, 'textContent', texts.voiceReady],
            [elements.voiceInstruction, 'innerHTML', texts.voiceInstruction],
            [elements.voiceBtn, 'textContent', texts.startSpeaking],
            [elements.widgetStatus, 'textContent', texts.online],
            [elements.widgetTitle, 'textContent', widgetConfig.company],
            [elements.textModeLabel, 'textContent', texts.textChatMode],
            [elements.voiceModeLabel, 'textContent', texts.voiceChatMode]
        ];
        
        updates.forEach(([element, property, value]) => {
            if (element && value) {
                element[property] = value;
            }
        });
    }

    // Public API
    window.AIWidget = {
        init(config) {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => initWidget(config));
            } else {
                initWidget(config);
            }
        },
        
        open() {
            if (!widgetState.isOpen) toggleWidget();
        },
        
        close() {
            if (widgetState.isOpen) toggleWidget();
        },
        
        setLanguage(lang) {
            switchLanguage(lang);
        }
    };

})();