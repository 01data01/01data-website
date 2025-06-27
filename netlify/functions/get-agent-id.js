exports.handler = async (event, context) => {
    try {
        const agentId = process.env.ELEVENLABS_AGENT_ID;
        
        if (!agentId) {
            return {
                statusCode: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: 'Agent ID not configured' 
                })
            };
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                agentId: agentId 
            })
        };
    } catch (error) {
        console.error('Error in get-agent-id function:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                error: 'Internal server error' 
            })
        };
    }
};