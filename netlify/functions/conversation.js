const axios = require('axios');

// Temporary API keys storage (in production, use database)
const API_KEYS = {
  'sk_a1pvc_demo123': {
    company: 'A1 PVC Market',
    limit: 5000,
    used: 0,
    active: true
  },
  'sk_test_demo456': {
    company: 'Test Company',
    limit: 1000,
    used: 0,
    active: true
  }
};

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Check API key
    const apiKey = event.headers['x-api-key'];
    const client = API_KEYS[apiKey];
    
    if (!client || !client.active) {
      return {
        statusCode: 403,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid or inactive API key' })
      };
    }

    // Check usage limit
    if (client.used >= client.limit) {
      return {
        statusCode: 429,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Usage limit exceeded',
          limit: client.limit,
          used: client.used
        })
      };
    }

    // Parse request body
    const requestBody = JSON.parse(event.body);
    const { message, sessionId, language = 'tr', mode = 'text' } = requestBody;

    // For voice mode, check for audio data
    if (mode === 'voice' && !message && !requestBody.audioData) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Audio data or message is required for voice mode' })
      };
    }

    // For text mode, check for message
    if (mode === 'text' && !message) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Message is required' })
      };
    }

    let response;
    
    if (mode === 'voice') {
      // Handle voice input
      if (requestBody.audioData) {
        // For now, convert audio to text using a simple approach
        // In production, you'd use speech-to-text service
        const transcribedText = message || 'Merhaba, nasıl yardımcı olabilirim?'; // Fallback text
        
        // Use ElevenLabs Conversational AI
        response = await axios.post(
          'https://api.elevenlabs.io/v1/convai/conversation',
          {
            text: transcribedText,
            agent_id: process.env.ELEVENLABS_AGENT_ID,
            language: language
          },
          {
            headers: {
              'xi-api-key': process.env.ELEVENLABS_API_KEY,
              'Content-Type': 'application/json'
            }
          }
        );
      } else {
        // Text message in voice mode
        response = await axios.post(
          'https://api.elevenlabs.io/v1/convai/conversation',
          {
            text: message,
            agent_id: process.env.ELEVENLABS_AGENT_ID,
            language: language
          },
          {
            headers: {
              'xi-api-key': process.env.ELEVENLABS_API_KEY,
              'Content-Type': 'application/json'
            }
          }
        );
      }
    } else {
      // Claude API for text
      response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: message
          }],
          system: `You are a helpful customer service assistant for ${client.company}. Respond in ${language === 'tr' ? 'Turkish' : 'English'}.`
        },
        {
          headers: {
            'x-api-key': process.env.CLAUDE_API_KEY,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          }
        }
      );
    }

    // Increment usage
    client.used++;

    // Log usage (in production, save to database)
    console.log(`API Usage - Client: ${client.company}, Message: ${message.substring(0, 50)}...`);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        response: response.data,
        usage: {
          used: client.used,
          limit: client.limit,
          remaining: client.limit - client.used,
          company: client.company
        },
        metadata: {
          sessionId,
          language,
          mode,
          timestamp: new Date().toISOString()
        }
      })
    };

  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Service temporarily unavailable',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};