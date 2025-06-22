/**
 * Netlify Function: Generate ElevenLabs Signed URL
 * For enhanced security - creates signed URLs for private agents
 */

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        // Get ElevenLabs API keys from environment variables
        const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
        const ELEVENLABS_API_KEY_2 = process.env.ELEVENLABS_API_KEY_2;
        
        // Get agent ID from query parameter or environment variable
        const requestedAgentId = event.queryStringParameters?.agent_id;
        // Temporarily use the known working agent ID until environment variables are sorted
        const defaultAgentId = 'DpUHUaJeMXPge91Sev0l'; // Original working agent ID
        const secondaryAgentId = process.env.ELEVENLABS_AGENT_ID_2;
        
        let AGENT_ID = defaultAgentId;
        let API_KEY = ELEVENLABS_API_KEY;
        
        // Allow switching between multiple agents and their corresponding API keys
        if (requestedAgentId) {
            if (requestedAgentId === secondaryAgentId && ELEVENLABS_API_KEY_2) {
                AGENT_ID = requestedAgentId;
                API_KEY = ELEVENLABS_API_KEY_2;
            } else if (requestedAgentId === defaultAgentId) {
                AGENT_ID = requestedAgentId;
                API_KEY = ELEVENLABS_API_KEY;
            } else {
                console.warn(`Requested agent ID ${requestedAgentId} not in allowed list`);
            }
        }

        if (!API_KEY) {
            console.error('ElevenLabs API key not configured');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    error: 'ElevenLabs API key not configured' 
                })
            };
        }

        // Request signed URL from ElevenLabs
        const response = await fetch(
            `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${AGENT_ID}`,
            {
                method: 'GET',
                headers: {
                    'xi-api-key': API_KEY
                }
            }
        );

        if (!response.ok) {
            throw new Error(`ElevenLabs API error: ${response.status}`);
        }

        const data = await response.json();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                signed_url: data.signed_url,
                agent_id: AGENT_ID
            })
        };

    } catch (error) {
        console.error('Error generating signed URL:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to generate signed URL',
                details: error.message 
            })
        };
    }
};