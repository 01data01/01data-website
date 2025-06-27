# ElevenLabs Voice Chat Integration Guide

## Overview

This guide explains how to integrate ElevenLabs Conversational AI voice capabilities into your existing website. The integration adds real-time voice conversation features to your AI chat system.

## Features Added

- **Real-time Voice Conversations**: Speak directly to your AI assistant using ElevenLabs WebSocket API
- **Audio Processing**: Microphone input capture and audio response playback
- **Voice Activity Detection**: Visual indicators for voice activity and connection status
- **Seamless Integration**: Works alongside existing text chat functionality
- **Modern UI**: Professional voice controls with animated indicators

## Files Added/Modified

### New Files Created

1. **`js/modules/features/voice-chat.js`** - Core voice chat functionality
   - WebSocket connection management
   - Audio recording and playback
   - Real-time communication with ElevenLabs API

2. **`css/modules/voice-chat.css`** - Voice chat styling
   - Voice control buttons and indicators
   - Audio visualizations and animations
   - Responsive design for mobile devices

3. **`ELEVENLABS_INTEGRATION_GUIDE.md`** - This documentation file

### Modified Files

1. **`js/modules/features/ai-chat.js`** - Enhanced with voice capabilities
   - Added voice chat integration
   - Voice mode toggle functionality
   - UI updates for voice status

2. **`intelligent-management.html`** - Updated HTML structure
   - Added voice control buttons
   - Included voice status indicators
   - Added CSS and JS module imports

3. **`config.js`** - Added ElevenLabs configuration
   - Agent ID configuration
   - Voice and audio settings
   - Global configuration object

## Setup Instructions

### 1. ElevenLabs Account Setup

1. **Create an ElevenLabs Account**
   - Visit [ElevenLabs](https://elevenlabs.io)
   - Sign up for an account
   - Navigate to the Conversational AI section

2. **Create a Conversational AI Agent**
   - Go to the Conversational AI dashboard
   - Create a new agent
   - Configure your agent's personality and behavior
   - Note the Agent ID for configuration

3. **Get Your API Key**
   - Go to your profile settings
   - Copy your API key for server-side operations (if needed)

### 2. Configuration

Update the `config.js` file with your ElevenLabs credentials:

```javascript
const ELEVENLABS_CONFIG = {
  // Replace with your actual ElevenLabs Agent ID
  agentId: "your-agent-id-here", // Required for voice chat
  apiKey: "your-api-key-here", // Optional, for server-side operations
  
  // Voice configuration
  voiceSettings: {
    stability: 0.5,
    similarityBoost: 0.8,
    speed: 1.0
  },
  
  // Audio settings
  audioSettings: {
    sampleRate: 16000,
    format: 'pcm_16000'
  }
};
```

### 3. Testing the Integration

1. **Open the Application**
   - Navigate to `intelligent-management.html`
   - Go to the AI Chat section

2. **Test Voice Mode**
   - Click the "Voice Mode" button (🎤)
   - Allow microphone access when prompted
   - Start speaking to test voice input
   - Listen for AI voice responses

3. **Check Indicators**
   - Voice status should show "Connected" when active
   - Voice activity bars should animate during speech
   - Button should change to "Stop Voice" with a red indicator

## Technical Architecture

### Voice Chat Module (`voice-chat.js`)

The `VoiceChat` class handles all voice-related functionality:

- **WebSocket Management**: Establishes and maintains connection to ElevenLabs API
- **Audio Processing**: Captures microphone input and processes audio responses
- **Event Handling**: Manages conversation events (transcripts, responses, interruptions)
- **Audio Queue**: Handles sequential playback of audio responses

### Key Methods

```javascript
// Initialize voice chat
const voiceChat = new VoiceChat();

// Configure with agent ID
voiceChat.setConfig({
  agentId: 'your-agent-id'
});

// Set up callbacks
voiceChat.setCallbacks({
  onConnectionChange: (connected) => { /* handle connection */ },
  onTranscript: (transcript, role) => { /* handle transcription */ },
  onAgentResponse: (response) => { /* handle AI response */ },
  onError: (error) => { /* handle errors */ }
});

// Start/stop conversation
await voiceChat.startConversation();
voiceChat.stopConversation();
```

### Integration with Existing Chat

The voice chat integrates seamlessly with the existing `AIChatModule`:

- Voice transcripts appear as user messages
- AI responses are displayed in the chat
- Voice mode disables text input automatically
- Both modes can be used interchangeably

## UI Components

### Voice Controls

- **Voice Toggle Button**: Start/stop voice mode
- **Voice Status Indicator**: Shows connection status
- **Voice Activity Bars**: Animated indicators during speech
- **Voice Mode Overlay**: Full-screen voice interaction mode (optional)

### Responsive Design

The voice controls adapt to different screen sizes:

- **Desktop**: Full controls with status indicators
- **Mobile**: Compact layout optimized for touch
- **Tablet**: Balanced layout with easy access

## Security Considerations

### Client-Side Security

- Agent ID is safe to expose on client-side
- WebSocket connections use secure WSS protocol
- Audio data is transmitted securely

### Server-Side Security (Optional)

For enhanced security, you can:

1. **Use Signed URLs**: Generate signed URLs on your server
2. **Private Agents**: Keep agents private and use server authentication
3. **Rate Limiting**: Implement usage limits on your server

Example server-side signed URL generation:

```javascript
// Server-side code (Node.js example)
const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`, {
  headers: {
    'xi-api-key': process.env.ELEVENLABS_API_KEY
  }
});

const { signed_url } = await response.json();
// Send signed_url to client
```

## Browser Compatibility

### Supported Features

- **WebSocket**: All modern browsers
- **Web Audio API**: All modern browsers
- **MediaRecorder**: All modern browsers
- **getUserMedia**: All modern browsers (requires HTTPS)

### Requirements

- **HTTPS**: Required for microphone access
- **Modern Browser**: Chrome 60+, Firefox 55+, Safari 11+, Edge 79+
- **Microphone**: Required for voice input

## Troubleshooting

### Common Issues

1. **Microphone Access Denied**
   - Ensure site is served over HTTPS
   - Check browser microphone permissions
   - Reload page and grant permissions

2. **WebSocket Connection Failed**
   - Verify Agent ID is correct
   - Check network connectivity
   - Ensure agent is active in ElevenLabs dashboard

3. **No Audio Playback**
   - Check browser audio permissions
   - Verify Web Audio API support
   - Test with other audio on the site

4. **Voice Not Recognized**
   - Speak clearly and close to microphone
   - Check microphone input levels
   - Reduce background noise

### Debug Mode

Enable debug logging:

```javascript
// In browser console
localStorage.setItem('voiceChatDebug', 'true');
// Reload page to see debug logs
```

## Performance Optimization

### Audio Processing

- Audio is processed in chunks for low latency
- Automatic audio queue management prevents overlapping
- Optimized buffer sizes for real-time performance

### Network Optimization

- WebSocket connection reuse
- Efficient audio encoding (16kHz PCM)
- Automatic reconnection on connection loss

### Memory Management

- Automatic cleanup of audio buffers
- Proper WebSocket connection disposal
- Event listener cleanup on module destruction

## Future Enhancements

### Planned Features

1. **Voice Settings Panel**: Adjust voice parameters in real-time
2. **Multiple Voice Options**: Switch between different AI voices
3. **Voice Shortcuts**: Voice commands for app navigation
4. **Conversation Analytics**: Track voice interaction metrics
5. **Offline Mode**: Local speech processing for basic functionality

### Extension Points

The architecture supports easy extension:

- **Custom Audio Processing**: Add noise reduction, echo cancellation
- **Voice Recognition**: Add custom wake words or commands
- **Multi-language Support**: Automatic language detection and switching
- **Voice Cloning**: Integration with ElevenLabs voice cloning features

## API Reference

### VoiceChat Class

```javascript
class VoiceChat {
  constructor()
  
  // Configuration
  setConfig(config)
  setCallbacks(callbacks)
  
  // Connection Management
  async startConversation()
  stopConversation()
  
  // Status
  isConnectedToVoice()
  isRecordingVoice()
  
  // Messaging
  sendContextualUpdate(text)
  
  // Cleanup
  cleanup()
}
```

### Configuration Options

```javascript
{
  agentId: 'string',          // Required: ElevenLabs agent ID
  sampleRate: 16000,          // Audio sample rate
  audioFormat: 'pcm_16000'    // Audio format
}
```

### Callback Events

```javascript
{
  onConnectionChange: (connected) => {},
  onTranscript: (transcript, role) => {},
  onAgentResponse: (response) => {},
  onError: (error) => {}
}
```

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review ElevenLabs documentation at [docs.elevenlabs.io](https://docs.elevenlabs.io)
3. Check browser console for error messages
4. Verify all configuration settings are correct

## License

This integration follows the same license as your main project. Make sure to comply with ElevenLabs terms of service for voice API usage.