const fs = require('fs').promises;
const path = require('path');

// Performance monitoring
const metrics = {
  requests: 0,
  errors: 0
};

// Email validation pattern
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Optimized file operations with retry logic
async function safeFileOperation(operation, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 100 * (i + 1))); // Exponential backoff
    }
  }
}

// Load user data - using memory storage for Netlify Functions
async function loadUserData() {
  // In Netlify Functions, we'll use environment variables or external storage
  // For now, return empty object (users will be assigned keys each time)
  return {};
}

// Save user data - placeholder for Netlify Functions
async function saveUserData(users) {
  // In Netlify Functions, file system is read-only
  // For now, we'll skip saving and assign keys dynamically
  console.log('Note: User data not persisted in serverless environment');
  return true;
}

exports.handler = async (event, context) => {
  const startTime = Date.now();
  metrics.requests++;
  
  // Enable CORS with security headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    metrics.errors++;
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Enhanced input validation
    let userEmail;
    try {
      const body = JSON.parse(event.body || '{}');
      userEmail = body.userEmail;
    } catch (parseError) {
      metrics.errors++;
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON payload' })
      };
    }
    
    if (!userEmail || typeof userEmail !== 'string' || !EMAIL_PATTERN.test(userEmail)) {
      metrics.errors++;
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Valid user email is required' })
      };
    }

    // Normalize email
    userEmail = userEmail.toLowerCase().trim();

    // Load user data
    const users = await loadUserData();
    
    // Load API keys with validation
    const apiKeys = {
      keys: [
        process.env.CLAUDE_API_KEY_1,
        process.env.CLAUDE_API_KEY_2,
        process.env.CLAUDE_API_KEY_3,
        process.env.CLAUDE_API_KEY_4,
        process.env.CLAUDE_API_KEY_5,
        process.env.CLAUDE_API_KEY_6,
        process.env.CLAUDE_API_KEY_7,
        process.env.CLAUDE_API_KEY_8,
        process.env.CLAUDE_API_KEY_9,
        process.env.CLAUDE_API_KEY_10,
        process.env.CLAUDE_API_KEY_11,
        process.env.CLAUDE_API_KEY_12,
        process.env.CLAUDE_API_KEY_13,
        process.env.CLAUDE_API_KEY_14,
        process.env.CLAUDE_API_KEY_15
      ].filter(key => key && typeof key === 'string' && key.startsWith('sk-ant-')) // Enhanced validation
    };

    if (apiKeys.keys.length === 0) {
      metrics.errors++;
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'No valid API keys configured',
          metrics: { processedAt: new Date().toISOString(), requestId: Math.random().toString(36).substr(2, 9) }
        })
      };
    }

    // Check if user already exists with optimized lookup
    const existingUser = users[userEmail];
    if (existingUser && typeof existingUser.apiKeyIndex === 'number') {
      const userApiKey = apiKeys.keys[existingUser.apiKeyIndex];
      
      if (userApiKey) {
        const responseTime = Date.now() - startTime;
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            apiKey: userApiKey,
            isNewUser: false,
            userInfo: {
              ...existingUser,
              lastAccessed: new Date().toISOString()
            },
            performance: {
              responseTime
            }
          })
        };
      }
    }

    // Simple round-robin key assignment for serverless environment
    // Use a hash of the email to consistently assign the same key to the same user
    const emailHash = userEmail.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const nextKeyIndex = Math.abs(emailHash) % apiKeys.keys.length;

    // Create new user record (not persisted in serverless environment)
    const newUser = {
      apiKeyIndex: nextKeyIndex,
      assignedDate: new Date().toISOString(),
      totalMessages: 0,
      totalCost: 0,
      userAgent: event.headers['user-agent'] || 'unknown'
    };

    // Note: In serverless environment, user data is not persisted
    console.log(`Assigning API key ${nextKeyIndex} to user ${userEmail}`);

    const responseTime = Date.now() - startTime;
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        apiKey: apiKeys.keys[nextKeyIndex],
        isNewUser: true,
        userInfo: newUser,
        performance: {
          responseTime
        }
      })
    };

  } catch (error) {
    metrics.errors++;
    const responseTime = Date.now() - startTime;
    
    console.error('Error in assign-api-key:', {
      error: error.message,
      stack: error.stack,
      userEmail: userEmail || 'unknown',
      responseTime
    });
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        requestId: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString()
      })
    };
  }
};