/**
 * Voice Chat Module - ElevenLabs Conversational AI Integration
 * Provides real-time voice conversation capabilities using WebSocket
 */

class VoiceChat {
    constructor() {
        this.websocket = null;
        this.isConnected = false;
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioContext = null;
        this.audioQueue = [];
        this.isPlaying = false;
        this.eventId = 0;
        
        // Configuration
        this.config = {
            apiBaseUrl: 'wss://api.elevenlabs.io/v1/convai/conversation',
            agentId: null, // Will be set from config
            sampleRate: 16000,
            audioFormat: 'pcm_16000'
        };
        
        this.selectedAgent = 'primary'; // Default to primary agent (SMART - uses ELEVENLABS_AGENT_ID_4)

        this.callbacks = {
            onConnectionChange: null,
            onTranscript: null,
            onAgentResponse: null,
            onError: null
        };

        this.init();
    }

    async init() {
        try {
            // Initialize audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: this.config.sampleRate
            });
            
            console.log('Voice chat module initialized');
        } catch (error) {
            console.error('Failed to initialize voice chat:', error);
            this.handleError('Failed to initialize audio system');
        }
    }

    setConfig(config) {
        this.config = { ...this.config, ...config };
    }

    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    setSelectedAgent(agentType) {
        this.selectedAgent = agentType;
        console.log(`A1: Voice chat agent selected: ${agentType === 'primary' ? 'SMART (ELEVENLABS_AGENT_ID_4)' : 'ELA (ELEVENLABS_AGENT_ID_2)'}`);
    }

    /**
     * Send contextual update with current datetime
     */
    sendDateTimeUpdate() {
        if (!this.isConnected) return;
        
        const dateTime = window.utils ? window.utils.getCurrentDateTime() : {
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            day: new Date().toLocaleDateString('en-US', { weekday: 'long' })
        };
        
        this.sendMessage({
            type: 'contextual_update',
            text: `Current datetime context: ${dateTime.day}, ${dateTime.date} at ${dateTime.time}`
        });
        
        console.log('Sent datetime contextual update:', dateTime);
    }

    async startConversation() {
        console.log('A1: VoiceChat.startConversation() called - ENHANCED VERSION');
        console.log('A1: Timestamp:', new Date().toISOString());
        
        if (this.isConnected) {
            console.log('A1: Conversation already active');
            return;
        }

        try {
            console.log('A1: Requesting microphone permission...');
            console.log('A1: navigator.mediaDevices available:', !!navigator.mediaDevices);
            console.log('A1: getUserMedia available:', !!navigator.mediaDevices?.getUserMedia);
            
            // Request microphone permission
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    sampleRate: this.config.sampleRate,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });

            console.log('A1: Microphone permission granted, stream obtained:', !!stream);

            // Set up WebSocket connection
            console.log('A1: Setting up WebSocket connection...');
            await this.connectWebSocket();
            
            // Set up audio recording
            console.log('A1: Setting up audio recording...');
            await this.setupAudioRecording(stream);
            
            console.log('A1: Voice conversation started successfully');
            
        } catch (error) {
            console.error('A1: Failed to start conversation:', error);
            console.log('A1: Error type:', error.name);
            console.log('A1: Error message:', error.message);
            this.handleError('Failed to start voice conversation: ' + error.message);
        }
    }

    async connectWebSocket() {
        return new Promise(async (resolve, reject) => {
            try {
                console.log('A1: Getting signed URL from server...');
                
                // Build URL with agent selection for A1 Assistant
                let url = '/.netlify/functions/elevenlabs-signed-url';
                
                // A1 Assistant: Specify which agent to use
                if (this.selectedAgent === 'secondary') {
                    // Add agent_id parameter for secondary agent (ELA)
                    url += '?agent_id=' + encodeURIComponent(window.config?.elevenlabs?.agentId2 || 'secondary');
                    console.log('A1: Using secondary agent (ELEVENLABS_AGENT_ID_2 for ELA)');
                } else {
                    // For A1 Assistant primary agent, the server now defaults to ELEVENLABS_AGENT_ID_4
                    // No parameter needed as the server will use A1 agent by default
                    console.log('A1: Using primary agent (ELEVENLABS_AGENT_ID_4 default with fallback)');
                }
                
                console.log('A1: Fetching signed URL from:', url);
                
                // Get signed URL from Netlify function with timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
                
                const response = await fetch(url, {
                    signal: controller.signal,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
                clearTimeout(timeoutId);
                
                console.log('A1: Signed URL response status:', response.status);
                console.log('A1: Signed URL response headers:', Object.fromEntries(response.headers.entries()));
                console.log('A1: Response ok:', response.ok);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('A1: Signed URL error response:', errorText);
                    throw new Error(`Failed to get signed URL: ${response.status} - ${errorText}`);
                }
                
                const data = await response.json();
                console.log('A1: Signed URL response data:', data);
                
                const signedUrl = data.signed_url;
                
                if (!signedUrl) {
                    console.error('A1: No signed URL in response data:', data);
                    throw new Error('No signed URL received from server');
                }
                
                // Validate signed URL format
                if (!signedUrl.startsWith('wss://api.elevenlabs.io/v1/convai/conversation')) {
                    console.error('A1: Invalid signed URL format:', signedUrl);
                    throw new Error('Invalid signed URL format received');
                }
                
                console.log('A1: Connecting with signed URL:', signedUrl);
                console.log('A1: Using agent ID:', data.agent_id);
                console.log('A1: Agent ID length:', data.agent_id?.length);
                console.log('A1: Creating WebSocket connection...');
                
                // Add connection state tracking
                let connectionAttempted = false;
                
                this.websocket = new WebSocket(signedUrl);
                console.log('A1: WebSocket created, readyState:', this.websocket.readyState);
                connectionAttempted = true;

                this.websocket.onopen = () => {
                console.log('A1: WebSocket connected successfully');
                this.isConnected = true;
                this.updateConnectionStatus(true);
                
                // Get current datetime for context
                const dateTime = window.utils ? window.utils.getCurrentDateTime() : {
                    date: new Date().toLocaleDateString(),
                    time: new Date().toLocaleTimeString(),
                    day: new Date().toLocaleDateString('en-US', { weekday: 'long' })
                };

                // Send conversation initiation according to official ElevenLabs docs
                console.log('A1: Sending conversation initiation (official format)...');
                this.sendMessage({
                    type: 'conversation_initiation_client_data',
                    conversation_config_override: {
                        agent: {
                            first_message: 'Hello! I\'m your AI assistant. How can I help you today?',
                            language: 'en'
                        }
                    },
                    dynamic_variables: {
                        current_date: dateTime.date,
                        current_time: dateTime.time,
                        current_day: dateTime.day,
                        user_name: 'User'
                    }
                });
                
                // Send a contextual update after initialization
                setTimeout(() => {
                    this.sendDateTimeUpdate();
                }, 1000);
                
                resolve();
            };

            this.websocket.onmessage = (event) => {
                this.handleWebSocketMessage(event);
            };

            this.websocket.onclose = (event) => {
                console.log('A1: WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
                console.log('A1: Was clean:', event.wasClean);
                console.log('A1: Agent ID being used:', data.agent_id);
                console.log('A1: URL that was used:', signedUrl);
                console.log('A1: Selected agent type:', this.selectedAgent);
                
                // Common WebSocket close codes
                const closeCodes = {
                    1000: 'Normal Closure',
                    1001: 'Going Away',
                    1002: 'Protocol Error',
                    1003: 'Unsupported Data',
                    1006: 'Abnormal Closure',
                    1007: 'Invalid frame payload data',
                    1008: 'Policy Violation',
                    1009: 'Message Too Big',
                    1010: 'Mandatory Extension',
                    1011: 'Internal Error',
                    1012: 'Service Restart',
                    1013: 'Try Again Later',
                    1014: 'Bad Gateway',
                    1015: 'TLS Handshake'
                };
                
                console.log('A1: Close code meaning:', closeCodes[event.code] || 'Unknown');
                
                // Log additional debugging info for ReadyState 2 (CLOSING)
                if (this.websocket?.readyState === 2) {
                    console.log('A1: WebSocket was in CLOSING state');
                    console.log('A1: This usually indicates authentication failure or server rejection');
                }
                
                this.isConnected = false;
                this.cleanup();
                reject(new Error(`WebSocket connection closed: ${event.code} - ${event.reason || closeCodes[event.code] || 'Unknown'}`));
            };

            this.websocket.onerror = (error) => {
                console.error('A1: WebSocket error:', error);
                console.log('A1: WebSocket readyState:', this.websocket?.readyState);
                console.log('A1: WebSocket readyState meanings: CONNECTING=0, OPEN=1, CLOSING=2, CLOSED=3');
                console.log('A1: Error occurred with agent:', data.agent_id);
                console.log('A1: Error occurred with URL:', signedUrl);
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

    async setupAudioRecording(stream) {
        try {
            // Create MediaRecorder for capturing audio
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            // Create audio processing for real-time streaming
            console.log('A1: Setting up audio processing...');
            const source = this.audioContext.createMediaStreamSource(stream);
            
            // Note: createScriptProcessor is deprecated but still used for compatibility
            // TODO: Migrate to AudioWorkletNode in future update
            const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (event) => {
                if (this.isRecording && this.isConnected) {
                    const inputData = event.inputBuffer.getChannelData(0);
                    const audioData = this.convertFloat32ToPCM16(inputData);
                    const base64Audio = this.arrayBufferToBase64(audioData);
                    
                    console.log('A1: Sending audio chunk, size:', base64Audio.length);
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
            console.log('A1: Full message data:', data);
            
            switch (data.type) {
                case 'conversation_initiation_metadata':
                    console.log('Conversation initialized:', data.conversation_initiation_metadata_event);
                    break;
                    
                case 'user_transcript':
                    const transcript = data.user_transcription_event.user_transcript;
                    console.log('User transcript:', transcript);
                    if (this.callbacks.onTranscript) {
                        this.callbacks.onTranscript(transcript, 'user');
                    }
                    break;
                    
                case 'agent_response':
                    const response = data.agent_response_event.agent_response;
                    console.log('Agent response:', response);
                    if (this.callbacks.onAgentResponse) {
                        this.callbacks.onAgentResponse(response);
                    }
                    break;
                    
                case 'audio':
                    const audioData = data.audio_event.audio_base_64;
                    const eventId = data.audio_event.event_id;
                    console.log('A1: Received audio data, length:', audioData?.length, 'eventId:', eventId);
                    if (audioData && audioData.length > 0) {
                        console.log('A1: Playing audio response...');
                        this.playAudioResponse(audioData, eventId);
                    } else {
                        console.warn('A1: Received empty audio data');
                    }
                    break;
                    
                case 'ping':
                    const pingEventId = data.ping_event.event_id;
                    const pingMs = data.ping_event.ping_ms || 0;
                    
                    setTimeout(() => {
                        this.sendMessage({
                            type: 'pong',
                            event_id: pingEventId
                        });
                    }, pingMs);
                    break;
                    
                case 'interruption':
                    console.log('Conversation interrupted:', data.interruption_event);
                    this.stopAudioPlayback();
                    break;
                    
                case 'vad_score':
                    // Voice Activity Detection score
                    const vadScore = data.vad_score_event.vad_score;
                    console.log('VAD Score:', vadScore);
                    break;
                    
                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error handling WebSocket message:', error);
        }
    }

    async playAudioResponse(base64Audio, eventId) {
        try {
            console.log('A1: Playing audio response, eventId:', eventId, 'base64 length:', base64Audio?.length);
            
            if (!base64Audio) {
                console.warn('A1: No audio data received');
                return;
            }
            
            // Decode base64 audio
            const audioBuffer = this.base64ToArrayBuffer(base64Audio);
            console.log('A1: Decoded audio buffer size:', audioBuffer.byteLength);
            
            // Add to audio queue for sequential playback
            this.audioQueue.push({ buffer: audioBuffer, eventId });
            console.log('A1: Audio queue length:', this.audioQueue.length);
            
            // Start playback if not already playing
            if (!this.isPlaying) {
                console.log('A1: Starting audio queue processing...');
                this.processAudioQueue();
            } else {
                console.log('A1: Audio already playing, added to queue');
            }
        } catch (error) {
            console.error('A1: Error playing audio response:', error);
        }
    }

    async processAudioQueue() {
        console.log('A1: processAudioQueue called, queue length:', this.audioQueue.length);
        
        if (this.audioQueue.length === 0) {
            console.log('A1: Audio queue empty, stopping playback');
            this.isPlaying = false;
            return;
        }

        this.isPlaying = true;
        const audioItem = this.audioQueue.shift();
        
        try {
            // Resume audio context if suspended
            if (this.audioContext.state === 'suspended') {
                console.log('A1: Resuming audio context...');
                await this.audioContext.resume();
            }
            
            console.log('A1: Processing audio queue item, buffer size:', audioItem.buffer.byteLength);
            
            // Convert PCM data to audio buffer
            const audioBuffer = await this.pcmToAudioBuffer(audioItem.buffer);
            
            if (!audioBuffer) {
                console.warn('A1: Skipping invalid audio buffer');
                this.processAudioQueue(); // Continue with next audio
                return;
            }
            
            console.log('A1: Created audio buffer:', audioBuffer.length, 'frames,', audioBuffer.duration, 'seconds');
            
            // Create audio source and play
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.audioContext.destination);
            
            source.onended = () => {
                console.log('A1: Audio playback ended');
                // Process next audio in queue
                this.processAudioQueue();
            };
            
            console.log('A1: Starting audio playback...');
            source.start();
            console.log('A1: Audio source started successfully');
            
        } catch (error) {
            console.error('Error processing audio queue:', error);
            this.processAudioQueue(); // Continue with next audio
        }
    }

    async pcmToAudioBuffer(pcmData) {
        console.log('Converting PCM data, buffer size:', pcmData.byteLength);
        
        if (!pcmData || pcmData.byteLength === 0) {
            console.warn('Empty PCM data received');
            return null;
        }
        
        const frameCount = pcmData.byteLength / 2;
        if (frameCount <= 0) {
            console.warn('Invalid frame count:', frameCount);
            return null;
        }
        
        const audioBuffer = this.audioContext.createBuffer(1, frameCount, this.config.sampleRate);
        const channelData = audioBuffer.getChannelData(0);
        
        // Convert 16-bit PCM to Float32
        const view = new DataView(pcmData);
        for (let i = 0; i < channelData.length; i++) {
            channelData[i] = view.getInt16(i * 2, true) / 32768.0;
        }
        
        console.log('Successfully converted PCM to audio buffer, duration:', audioBuffer.duration, 'seconds');
        return audioBuffer;
    }

    stopAudioPlayback() {
        this.audioQueue = [];
        this.isPlaying = false;
    }

    sendMessage(message) {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            console.log('A1: Sending WebSocket message:', message.type);
            this.websocket.send(JSON.stringify(message));
        } else {
            console.warn('A1: WebSocket not connected, cannot send message. ReadyState:', this.websocket?.readyState);
            console.log('A1: WebSocket states - CONNECTING:', WebSocket.CONNECTING, 'OPEN:', WebSocket.OPEN, 'CLOSING:', WebSocket.CLOSING, 'CLOSED:', WebSocket.CLOSED);
        }
    }

    sendContextualUpdate(text) {
        this.sendMessage({
            type: 'contextual_update',
            text: text
        });
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
        
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
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

    // Utility functions for audio processing
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

    // Public API
    isConnectedToVoice() {
        return this.isConnected;
    }

    isRecordingVoice() {
        return this.isRecording;
    }
}

// Make VoiceChat globally available
window.VoiceChat = VoiceChat;