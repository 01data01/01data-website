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
        const ELEVENLABS_API_KEY_3 = process.env.ELEVENLABS_API_KEY_3;
        
        // Get agent IDs from environment variables
        const requestedAgentId = event.queryStringParameters?.agent_id;
        const defaultAgentId = process.env.ELEVENLABS_AGENT_ID || 'DpUHUaJeMXPge91Sev0l';
        const secondaryAgentId = process.env.ELEVENLABS_AGENT_ID_2;
        const a1AgentId = process.env.ELEVENLABS_AGENT_ID_3; // A1 Assistant default
        
        // Set A1 Agent (ELEVENLABS_AGENT_ID_3) as the primary default for A1 Assistant
        let AGENT_ID = a1AgentId || defaultAgentId;
        let API_KEY = ELEVENLABS_API_KEY_3 || ELEVENLABS_API_KEY;
        
        // Allow switching between multiple agents and their corresponding API keys
        if (requestedAgentId) {
            if (requestedAgentId === a1AgentId && ELEVENLABS_API_KEY_3) {
                // A1 Assistant agent (highest priority)
                AGENT_ID = requestedAgentId;
                API_KEY = ELEVENLABS_API_KEY_3;
            } else if (requestedAgentId === secondaryAgentId && ELEVENLABS_API_KEY_2) {
                // Secondary agent
                AGENT_ID = requestedAgentId;
                API_KEY = ELEVENLABS_API_KEY_2;
            } else if (requestedAgentId === defaultAgentId && ELEVENLABS_API_KEY) {
                // Original default agent
                AGENT_ID = requestedAgentId;
                API_KEY = ELEVENLABS_API_KEY;
            } else {
                console.warn(`Requested agent ID ${requestedAgentId} not in allowed list`);
            }
        }
        
        console.log(`Using Agent ID: ${AGENT_ID} (A1 default: ${a1AgentId})`);

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