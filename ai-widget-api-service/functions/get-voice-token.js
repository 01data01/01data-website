const axios = require('axios');

// Temporary API keys storage (should match conversation.js)
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

    // Get ElevenLabs agent link/token
    const agentId = process.env.ELEVENLABS_AGENT_ID;
    
    if (!agentId) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'ElevenLabs agent ID not configured' })
      };
    }

    const response = await axios.get(
      `https://api.elevenlabs.io/v1/convai/agents/${agentId}/link`,
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY
        }
      }
    );

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        agent_id: response.data.agent_id,
        token: response.data.token,
        conversationUrl: `https://elevenlabs.io/convai/agent/${agentId}`,
        embedUrl: `https://elevenlabs.io/convai/embed/${agentId}`,
        usage: {
          used: client.used,
          limit: client.limit,
          remaining: client.limit - client.used,
          company: client.company
        }
      })
    };

  } catch (error) {
    console.error('ElevenLabs API Error:', error.response?.data || error.message);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Failed to get voice token',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};