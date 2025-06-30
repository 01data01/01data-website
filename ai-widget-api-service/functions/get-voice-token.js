/**
 * Get Voice Token API - Updated for ElevenLabs SDK
 * Returns the ElevenLabs agent ID for voice conversations
 */

exports.handler = async (event, context) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Method not allowed. Use POST.'
            })
        };
    }

    try {
        // Validate API key
        const apiKey = event.headers['x-api-key'] || event.headers['X-API-Key'];
        
        if (!apiKey) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'API key is required'
                })
            };
        }

        // Simple API key validation (you should implement proper validation)
        const validApiKeys = [
            'sk_a1pvc_demo123',
            'sk_test_key_123',
            'sk_demo_widget_2024'
        ];

        if (!validApiKeys.includes(apiKey)) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Invalid API key'
                })
            };
        }

        // Get ElevenLabs agent ID from environment variables
        const agentId = process.env.ELEVENLABS_AGENT_ID;
        
        if (!agentId) {
            console.error('ELEVENLABS_AGENT_ID environment variable not set');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Voice chat service not configured. Please contact support.'
                })
            };
        }

        // Validate agent ID format (ElevenLabs agent IDs are typically UUIDs)
        const agentIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!agentIdPattern.test(agentId)) {
            console.error('Invalid ELEVENLABS_AGENT_ID format:', agentId);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Voice chat service misconfigured. Please contact support.'
                })
            };
        }

        // Log the request for analytics (remove sensitive data)
        console.log('Voice token requested:', {
            apiKey: apiKey.substring(0, 10) + '...',
            timestamp: new Date().toISOString(),
            userAgent: event.headers['user-agent']
        });

        // Return the agent ID
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                agent_id: agentId,
                message: 'Agent ID retrieved successfully'
            })
        };

    } catch (error) {
        console.error('Error in get-voice-token:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Internal server error. Please try again later.'
            })
        };
    }
};