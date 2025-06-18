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

// Load user data from file
async function loadUserData() {
  try {
    const usersPath = path.join(process.cwd(), 'data', 'users.json');
    const usersData = await safeFileOperation(() => fs.readFile(usersPath, 'utf8'));
    return JSON.parse(usersData);
  } catch (error) {
    // If file doesn't exist or is corrupted, return empty object
    return {};
  }
}

// Save user data with atomic writes
async function saveUserData(users) {
  try {
    const usersPath = path.join(process.cwd(), 'data', 'users.json');
    const tempPath = usersPath + '.tmp';
    
    // Write to temporary file first (atomic operation)
    await safeFileOperation(() => fs.writeFile(tempPath, JSON.stringify(users, null, 2)));
    
    // Rename to final file (atomic on most filesystems)
    await safeFileOperation(() => fs.rename(tempPath, usersPath));
    
  } catch (error) {
    console.error('Failed to save user data:', error);
    throw new Error('Failed to save user data');
  }
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

    // Key assignment algorithm
    const userKeys = Object.values(users);
    const keyUsageCount = new Array(apiKeys.keys.length).fill(0);
    
    // Count usage of each key for balanced distribution
    userKeys.forEach(user => {
      if (typeof user.apiKeyIndex === 'number' && user.apiKeyIndex < keyUsageCount.length) {
        keyUsageCount[user.apiKeyIndex]++;
      }
    });
    
    // Find the least used key index
    let nextKeyIndex = 0;
    let minUsage = keyUsageCount[0];
    
    for (let i = 1; i < keyUsageCount.length; i++) {
      if (keyUsageCount[i] < minUsage) {
        minUsage = keyUsageCount[i];
        nextKeyIndex = i;
      }
    }

    // Create new user record
    const newUser = {
      apiKeyIndex: nextKeyIndex,
      assignedDate: new Date().toISOString(),
      totalMessages: 0,
      totalCost: 0,
      keyUsageRank: minUsage + 1,
      userAgent: event.headers['user-agent'] || 'unknown'
    };

    users[userEmail] = newUser;

    // Save user data
    await saveUserData(users);

    const responseTime = Date.now() - startTime;
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        apiKey: apiKeys.keys[nextKeyIndex],
        isNewUser: true,
        userInfo: newUser,
        performance: {
          responseTime,
          keyDistribution: keyUsageCount
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