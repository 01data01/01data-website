const crypto = require('crypto');

// Admin authentication (change this password!)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change_this_admin_password_123';

// Temporary storage (in production, use database)
let API_KEYS_DB = {
  'sk_a1pvc_demo123': {
    company: 'A1 PVC Market',
    limit: 5000,
    used: 0,
    active: true,
    createdAt: '2025-06-29',
    pricePerMinute: 1.50
  },
  'sk_test_demo456': {
    company: 'Test Company',
    limit: 1000,
    used: 0,
    active: true,
    createdAt: '2025-06-29',
    pricePerMinute: 1.00
  }
};

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE, OPTIONS'
      },
      body: ''
    };
  }

  try {
    // Check admin authentication
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Authorization required' })
      };
    }

    const token = authHeader.split(' ')[1];
    if (token !== ADMIN_PASSWORD) {
      return {
        statusCode: 403,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid admin credentials' })
      };
    }

    // Handle different operations
    switch (event.httpMethod) {
      case 'POST':
        return await createApiKey(event);
      case 'GET':
        return await listApiKeys(event);
      case 'PUT':
        return await updateApiKey(event);
      case 'DELETE':
        return await deleteApiKey(event);
      default:
        return {
          statusCode: 405,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

  } catch (error) {
    console.error('API Key Management Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};

// Create new API key
async function createApiKey(event) {
  const { company, limit = 1000, pricePerMinute = 1.50 } = JSON.parse(event.body);

  if (!company) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Company name is required' })
    };
  }

  // Generate unique API key
  const companySlug = company.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10);
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  const apiKey = `sk_${companySlug}_${randomSuffix}`;

  // Create API key record
  const keyData = {
    company: company,
    limit: parseInt(limit),
    used: 0,
    active: true,
    createdAt: new Date().toISOString().split('T')[0],
    pricePerMinute: parseFloat(pricePerMinute)
  };

  // Store in temporary database (in production, save to real database)
  API_KEYS_DB[apiKey] = keyData;

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      apiKey: apiKey,
      company: company,
      limit: limit,
      pricePerMinute: pricePerMinute,
      message: 'API key created successfully'
    })
  };
}

// List all API keys
async function listApiKeys(event) {
  const keys = Object.entries(API_KEYS_DB).map(([key, data]) => ({
    apiKey: key,
    company: data.company,
    limit: data.limit,
    used: data.used,
    remaining: data.limit - data.used,
    active: data.active,
    createdAt: data.createdAt,
    pricePerMinute: data.pricePerMinute,
    revenue: (data.used * data.pricePerMinute).toFixed(2)
  }));

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      keys: keys,
      totalKeys: keys.length,
      totalRevenue: keys.reduce((sum, key) => sum + parseFloat(key.revenue), 0).toFixed(2)
    })
  };
}

// Update API key
async function updateApiKey(event) {
  const { apiKey, limit, active, pricePerMinute } = JSON.parse(event.body);

  if (!apiKey || !API_KEYS_DB[apiKey]) {
    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'API key not found' })
    };
  }

  // Update fields
  if (limit !== undefined) API_KEYS_DB[apiKey].limit = parseInt(limit);
  if (active !== undefined) API_KEYS_DB[apiKey].active = active;
  if (pricePerMinute !== undefined) API_KEYS_DB[apiKey].pricePerMinute = parseFloat(pricePerMinute);

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      message: 'API key updated successfully',
      apiKey: apiKey,
      data: API_KEYS_DB[apiKey]
    })
  };
}

// Delete API key
async function deleteApiKey(event) {
  const { apiKey } = JSON.parse(event.body);

  if (!apiKey || !API_KEYS_DB[apiKey]) {
    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'API key not found' })
    };
  }

  delete API_KEYS_DB[apiKey];

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      message: 'API key deleted successfully'
    })
  };
}