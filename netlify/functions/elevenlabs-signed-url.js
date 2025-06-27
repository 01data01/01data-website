/**
 * Netlify Function: Generate ElevenLabs Signed URL
 * Simplified approach using direct API calls with better error handling
 */

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
    console.log('🚀 ElevenLabs Signed URL Function - Enhanced Version 2.0');
    console.log('Timestamp:', new Date().toISOString());
    
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        // Use your configured ELEVENLABS_AGENT_ID and ELEVENLABS_API_KEY
        const AGENT_ID = process.env.ELEVENLABS_AGENT_ID || 'DpUHUaJeMXPge91Sev0l';
        const API_KEY = process.env.ELEVENLABS_API_KEY;
        
        console.log('Using Agent ID:', AGENT_ID);
        console.log('API Key available:', !!API_KEY);
        console.log('API Key length:', API_KEY?.length || 0);

        if (!API_KEY) {
            console.error('No ElevenLabs API key configured');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    error: 'ElevenLabs API key not configured' 
                })
            };
        }

        if (!AGENT_ID) {
            console.error('No ElevenLabs Agent ID configured');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    error: 'ElevenLabs Agent ID not configured' 
                })
            };
        }

        // Request signed URL from ElevenLabs
        const elevenlabsUrl = `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${AGENT_ID}`;
        console.log('Requesting signed URL from ElevenLabs API...');
        
        const response = await fetch(elevenlabsUrl, {
            method: 'GET',
            headers: {
                'xi-api-key': API_KEY
            }
        });

        console.log('ElevenLabs API response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('ElevenLabs API error:', errorText);
            
            // Return specific error based on status code
            if (response.status === 401) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ 
                        error: 'Invalid API key' 
                    })
                };
            } else if (response.status === 404) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ 
                        error: 'Agent not found' 
                    })
                };
            } else {
                return {
                    statusCode: response.status,
                    headers,
                    body: JSON.stringify({ 
                        error: `ElevenLabs API error: ${response.status}`,
                        details: errorText 
                    })
                };
            }
        }

        const data = await response.json();
        console.log('✅ Successfully generated signed URL');

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                signed_url: data.signed_url,
                agent_id: AGENT_ID
            })
        };

    } catch (error) {
        console.error('❌ Function error:', error.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                details: error.message 
            })
        };
    }
};