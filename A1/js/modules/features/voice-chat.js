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
        
        this.selectedAgent = 'primary'; // Default to primary agent

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
        console.log(`Voice chat agent selected: ${agentType === 'primary' ? 'SMART' : 'ELA'}`);
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
        if (this.isConnected) {
            console.log('Conversation already active');
            return;
        }

        try {
            // Request microphone permission
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    sampleRate: this.config.sampleRate,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });

            // Set up WebSocket connection
            await this.connectWebSocket();
            
            // Set up audio recording
            await this.setupAudioRecording(stream);
            
            console.log('Voice conversation started');
            
        } catch (error) {
            console.error('Failed to start conversation:', error);
            this.handleError('Failed to start voice conversation: ' + error.message);
        }
    }

    async connectWebSocket() {
        return new Promise(async (resolve, reject) => {
            try {
                console.log('Getting signed URL from server...');
                
                // Build URL with agent selection
                let url = '/.netlify/functions/elevenlabs-signed-url';
                if (this.selectedAgent === 'secondary') {
                    // Add agent_id parameter for secondary agent
                    url += '?agent_id=' + encodeURIComponent(window.config?.elevenlabs?.agentId2 || 'secondary');
                }
                
                // Get signed URL from Netlify function
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Failed to get signed URL: ${response.status}`);
                }
                
                const data = await response.json();
                const signedUrl = data.signed_url;
                
                if (!signedUrl) {
                    throw new Error('No signed URL received from server');
                }
                
                console.log('Connecting with signed URL...');
                this.websocket = new WebSocket(signedUrl);

                this.websocket.onopen = () => {
                console.log('WebSocket connected');
                this.isConnected = true;
                this.updateConnectionStatus(true);
                
                // Get current datetime for context
                const dateTime = window.utils ? window.utils.getCurrentDateTime() : {
                    date: new Date().toLocaleDateString(),
                    time: new Date().toLocaleTimeString(),
                    day: new Date().toLocaleDateString('en-US', { weekday: 'long' })
                };

                // Send conversation initiation
                this.sendMessage({
                    type: 'conversation_initiation_client_data',
                    conversation_config_override: {
                        agent: {
                            language: 'en',
                            first_message: 'Hello! I\'m your AI assistant. How can I help you today?'
                        },
                        tts: {
                            agent_output_audio_format: this.config.audioFormat,
                            model_id: 'eleven_turbo_v2_5'
                        },
                        conversation: {
                            text_only: false,
                            client_events: [
                                'conversation_initiation_metadata',
                                'audio',
                                'user_transcript',
                                'agent_response',
                                'ping',
                                'interruption'
                            ]
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

            this.websocket.onclose = () => {
                console.log('WebSocket disconnected');
                this.cleanup();
                reject(new Error('WebSocket connection closed'));
            };

            this.websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
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
            const source = this.audioContext.createMediaStreamSource(stream);
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
            console.log('Audio recording started');
            
        } catch (error) {
            console.error('Failed to setup audio recording:', error);
            throw error;
        }
    }

    handleWebSocketMessage(event) {
        try {
            const data = JSON.parse(event.data);
            console.log('Received WebSocket message:', data.type, data);
            
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
                    console.log('Received audio data, length:', audioData?.length, 'eventId:', eventId);
                    this.playAudioResponse(audioData, eventId);
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
            console.log('Playing audio response, eventId:', eventId, 'base64 length:', base64Audio?.length);
            
            if (!base64Audio) {
                console.warn('No audio data received');
                return;
            }
            
            // Decode base64 audio
            const audioBuffer = this.base64ToArrayBuffer(base64Audio);
            console.log('Decoded audio buffer size:', audioBuffer.byteLength);
            
            // Add to audio queue for sequential playback
            this.audioQueue.push({ buffer: audioBuffer, eventId });
            console.log('Audio queue length:', this.audioQueue.length);
            
            // Start playback if not already playing
            if (!this.isPlaying) {
                this.processAudioQueue();
            }
        } catch (error) {
            console.error('Error playing audio response:', error);
        }
    }

    async processAudioQueue() {
        if (this.audioQueue.length === 0) {
            this.isPlaying = false;
            return;
        }

        this.isPlaying = true;
        const audioItem = this.audioQueue.shift();
        
        try {
            // Resume audio context if suspended
            if (this.audioContext.state === 'suspended') {
                console.log('Resuming audio context...');
                await this.audioContext.resume();
            }
            
            console.log('Processing audio queue item, buffer size:', audioItem.buffer.byteLength);
            
            // Convert PCM data to audio buffer
            const audioBuffer = await this.pcmToAudioBuffer(audioItem.buffer);
            
            if (!audioBuffer) {
                console.warn('Skipping invalid audio buffer');
                this.processAudioQueue(); // Continue with next audio
                return;
            }
            
            console.log('Created audio buffer:', audioBuffer.length, 'frames,', audioBuffer.duration, 'seconds');
            
            // Create audio source and play
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.audioContext.destination);
            
            source.onended = () => {
                console.log('Audio playback ended');
                // Process next audio in queue
                this.processAudioQueue();
            };
            
            console.log('Starting audio playback...');
            source.start();
            
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
            this.websocket.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket not connected, cannot send message');
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