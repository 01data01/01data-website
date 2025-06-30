exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, error: 'Method not allowed' })
        };
    }

    try {
        const apiKey = event.headers['x-api-key'] || event.headers['X-API-Key'];
        
        if (!apiKey) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ success: false, error: 'API key required' })
            };
        }

        const validKeys = ['sk_a1pvc_demo123', 'sk_test_key_123', 'sk_demo_widget_2024'];
        if (!validKeys.includes(apiKey)) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ success: false, error: 'Invalid API key' })
            };
        }

        const agentId = process.env.ELEVENLABS_AGENT_ID;
        if (!agentId) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ success: false, error: 'Agent ID not configured' })
            };
        }

        console.log('Voice token request successful for API key:', apiKey.substring(0, 10) + '...');

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
            body: JSON.stringify({ success: false, error: error.message })
        };
    }
};