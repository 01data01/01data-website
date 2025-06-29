// Simple API key verification endpoint

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
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
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
    const apiKey = event.headers['x-api-key'];
    const client = API_KEYS[apiKey];

    if (!client) {
      return {
        statusCode: 403,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          valid: false, 
          error: 'Invalid API key' 
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valid: true,
        company: client.company,
        usage: {
          used: client.used,
          limit: client.limit,
          remaining: client.limit - client.used
        },
        active: client.active
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        valid: false,
        error: 'Service error' 
      })
    };
  }
};