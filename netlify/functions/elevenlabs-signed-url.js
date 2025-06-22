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
        const ELEVENLABS_API_KEY_4 = process.env.ELEVENLABS_API_KEY_4;
        
        // Get agent IDs from environment variables
        const requestedAgentId = event.queryStringParameters?.agent_id;
        const originalAgentId = 'DpUHUaJeMXPge91Sev0l'; // Known working agent ID
        const defaultAgentId = process.env.ELEVENLABS_AGENT_ID || originalAgentId;
        const secondaryAgentId = process.env.ELEVENLABS_AGENT_ID_2;
        const a1AgentId = process.env.ELEVENLABS_AGENT_ID_3; // A1 Assistant preferred agent (problematic)
        const a1AgentId4 = process.env.ELEVENLABS_AGENT_ID_4; // A1 Assistant new agent (clean setup)
        
        // Use AGENT_ID_4 for A1 Assistant if available, otherwise fall back to original
        let AGENT_ID = a1AgentId4 || originalAgentId; // Prefer AGENT_ID_4, fallback to original
        let API_KEY = ELEVENLABS_API_KEY_4 || ELEVENLABS_API_KEY; // Corresponding API key
        
        if (a1AgentId4 && ELEVENLABS_API_KEY_4) {
            console.log('A1: Using ELEVENLABS_AGENT_ID_4 for A1 Assistant');
        } else {
            console.log('A1: Using original working agent (AGENT_ID_4 not configured yet)');
        }
        
        // Allow switching between multiple agents and their corresponding API keys
        if (requestedAgentId) {
            if (requestedAgentId === a1AgentId4 && ELEVENLABS_API_KEY_4) {
                // A1 Assistant Agent ID 4 (preferred)
                AGENT_ID = requestedAgentId;
                API_KEY = ELEVENLABS_API_KEY_4;
                console.log('Using A1 Agent (ELEVENLABS_AGENT_ID_4)');
            } else if (requestedAgentId === 'test-agent-4' && a1AgentId4 && ELEVENLABS_API_KEY_4) {
                // Test AGENT_ID_4 when explicitly requested
                AGENT_ID = a1AgentId4;
                API_KEY = ELEVENLABS_API_KEY_4;
                console.log('Testing A1 Agent (ELEVENLABS_AGENT_ID_4)');
            } else if (requestedAgentId === 'test-agent-3' && a1AgentId && ELEVENLABS_API_KEY_3) {
                // Test AGENT_ID_3 when explicitly requested
                AGENT_ID = a1AgentId;
                API_KEY = ELEVENLABS_API_KEY_3;
                console.log('Testing A1 Agent (ELEVENLABS_AGENT_ID_3)');
            } else if (requestedAgentId === a1AgentId && ELEVENLABS_API_KEY_3) {
                // A1 Assistant agent ID 3 (when directly requested by ID)
                AGENT_ID = requestedAgentId;
                API_KEY = ELEVENLABS_API_KEY_3;
                console.log('Using A1 Agent (ELEVENLABS_AGENT_ID_3)');
            } else if (requestedAgentId === secondaryAgentId && ELEVENLABS_API_KEY_2) {
                // Secondary agent (ELA)
                AGENT_ID = requestedAgentId;
                API_KEY = ELEVENLABS_API_KEY_2;
                console.log('Using Secondary Agent (ELEVENLABS_AGENT_ID_2)');
            } else if (requestedAgentId === defaultAgentId && ELEVENLABS_API_KEY) {
                // Original default agent
                AGENT_ID = requestedAgentId;
                API_KEY = ELEVENLABS_API_KEY;
                console.log('Using Original Default Agent');
            } else if (requestedAgentId === originalAgentId && ELEVENLABS_API_KEY) {
                // Fallback to known working agent
                AGENT_ID = requestedAgentId;
                API_KEY = ELEVENLABS_API_KEY;
                console.log('Using Known Working Agent (fallback)');
            } else {
                console.warn(`Requested agent ID ${requestedAgentId} not in allowed list`);
            }
        }
        
        console.log(`Final Agent Selection - ID: ${AGENT_ID}, Available: A1_ID_4=${!!a1AgentId4}, A1_ID_3=${!!a1AgentId}, Secondary=${!!secondaryAgentId}, Default=${!!defaultAgentId}`);

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