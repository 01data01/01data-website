/**
 * ElevenLabs Voice Chat Module - Official SDK Integration
 * Provides real-time voice conversation capabilities using ElevenLabs official SDK
 */

class ElevenLabsVoice {
    constructor() {
        this.conversation = null;
        this.isConnected = false;
        this.isActive = false;
        
        this.callbacks = {
            onConnectionChange: null,
            onTranscript: null,
            onAgentResponse: null,
            onError: null
        };

        this.config = {
            agentId: null
        };
    }

    setConfig(config) {
        this.config = { ...this.config, ...config };
    }

    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    async startConversation() {
        if (this.isActive) {
            console.log('Conversation already active');
            return;
        }

        try {
            if (!this.config.agentId) {
                throw new Error('Agent ID not configured');
            }

            console.log('Starting ElevenLabs conversation with agent:', this.config.agentId);

            // Request microphone permission first
            await navigator.mediaDevices.getUserMedia({ audio: true });

            // Import the ElevenLabs Conversation class
            const { Conversation } = await import('https://unpkg.com/@elevenlabs/client@latest/dist/index.js');

            // Start the conversation session
            this.conversation = await Conversation.startSession({
                agentId: this.config.agentId,
                onConnect: () => {
                    console.log('ElevenLabs conversation connected');
                    this.isConnected = true;
                    this.isActive = true;
                    this.updateConnectionStatus(true);
                },
                onDisconnect: () => {
                    console.log('ElevenLabs conversation disconnected');
                    this.isConnected = false;
                    this.isActive = false;
                    this.updateConnectionStatus(false);
                },
                onMessage: (message) => {
                    console.log('ElevenLabs message:', message);
                    this.handleConversationMessage(message);
                },
                onError: (error) => {
                    console.error('ElevenLabs conversation error:', error);
                    this.handleError(error.message || 'Conversation error');
                },
                onStatusChange: (status) => {
                    console.log('ElevenLabs status change:', status);
                },
                onModeChange: (mode) => {
                    console.log('ElevenLabs mode change:', mode);
                }
            });

            console.log('ElevenLabs conversation started successfully');

        } catch (error) {
            console.error('Failed to start ElevenLabs conversation:', error);
            this.handleError('Failed to start voice conversation: ' + error.message);
            throw error;
        }
    }

    async stopConversation() {
        if (!this.isActive || !this.conversation) {
            return;
        }

        try {
            console.log('Stopping ElevenLabs conversation');
            await this.conversation.endSession();
            this.conversation = null;
            this.isConnected = false;
            this.isActive = false;
            this.updateConnectionStatus(false);
            console.log('ElevenLabs conversation stopped');
        } catch (error) {
            console.error('Error stopping conversation:', error);
        }
    }

    handleConversationMessage(message) {
        try {
            // Handle different types of messages from ElevenLabs
            if (message.type === 'user_transcript' || message.source === 'user') {
                const transcript = message.message || message.text || '';
                if (transcript && this.callbacks.onTranscript) {
                    this.callbacks.onTranscript(transcript, 'user');
                }
            } else if (message.type === 'agent_response' || message.source === 'agent') {
                const response = message.message || message.text || '';
                if (response && this.callbacks.onAgentResponse) {
                    this.callbacks.onAgentResponse(response);
                }
            }
        } catch (error) {
            console.error('Error handling conversation message:', error);
        }
    }

    updateConnectionStatus(connected) {
        if (this.callbacks.onConnectionChange) {
            this.callbacks.onConnectionChange(connected);
        }
    }

    handleError(message) {
        console.error('ElevenLabs voice error:', message);
        if (this.callbacks.onError) {
            this.callbacks.onError(message);
        }
    }

    // Utility methods for integration
    isConnectedToVoice() {
        return this.isConnected;
    }

    isRecordingVoice() {
        return this.isActive && this.isConnected;
    }

    // Volume control methods
    async setVolume(volume) {
        if (this.conversation && this.conversation.setVolume) {
            try {
                await this.conversation.setVolume({ volume: Math.max(0, Math.min(1, volume)) });
            } catch (error) {
                console.error('Error setting volume:', error);
            }
        }
    }

    async getInputVolume() {
        if (this.conversation && this.conversation.getInputVolume) {
            try {
                return await this.conversation.getInputVolume();
            } catch (error) {
                console.error('Error getting input volume:', error);
                return 0;
            }
        }
        return 0;
    }

    async getOutputVolume() {
        if (this.conversation && this.conversation.getOutputVolume) {
            try {
                return await this.conversation.getOutputVolume();
            } catch (error) {
                console.error('Error getting output volume:', error);
                return 0;
            }
        }
        return 0;
    }

    // Cleanup
    cleanup() {
        this.stopConversation();
    }
}

// Make ElevenLabsVoice globally available
window.ElevenLabsVoice = ElevenLabsVoice;