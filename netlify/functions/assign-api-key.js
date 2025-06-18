const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { userEmail } = JSON.parse(event.body);
    
    if (!userEmail) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'User email is required' })
      };
    }

    // Read users data and get API keys from environment variables
    const usersPath = path.join(process.cwd(), 'data', 'users.json');
    
    let users;
    
    try {
      const usersData = await fs.readFile(usersPath, 'utf8');
      users = JSON.parse(usersData);
    } catch (error) {
      users = {};
    }
    
    // Get API keys from environment variables
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
      ].filter(key => key) // Remove undefined keys
    };

    if (apiKeys.keys.length === 0) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'No API keys configured in environment variables' })
      };
    }

    // Check if user already has an API key
    if (users[userEmail]) {
      const userApiKey = apiKeys.keys[users[userEmail].apiKeyIndex];
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          apiKey: userApiKey,
          isNewUser: false,
          userInfo: users[userEmail]
        })
      };
    }

    // Find next available API key (round-robin assignment)
    const usedKeys = Object.values(users).map(user => user.apiKeyIndex);
    let nextKeyIndex = 0;
    
    for (let i = 0; i < apiKeys.keys.length; i++) {
      if (!usedKeys.includes(i)) {
        nextKeyIndex = i;
        break;
      }
    }

    // If all keys are used, use round-robin
    if (usedKeys.length >= apiKeys.keys.length) {
      nextKeyIndex = Object.keys(users).length % apiKeys.keys.length;
    }

    // Assign API key to user
    const newUser = {
      apiKeyIndex: nextKeyIndex,
      assignedDate: new Date().toISOString(),
      totalMessages: 0,
      totalCost: 0
    };

    users[userEmail] = newUser;

    // Save updated users
    await fs.writeFile(usersPath, JSON.stringify(users, null, 2));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        apiKey: apiKeys.keys[nextKeyIndex],
        isNewUser: true,
        userInfo: newUser
      })
    };

  } catch (error) {
    console.error('Error in assign-api-key:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};