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

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Read data files and get API keys from environment variables
    const usersPath = path.join(process.cwd(), 'data', 'users.json');
    const usagePath = path.join(process.cwd(), 'data', 'usage.json');
    
    let users = {};
    let usage = {};
    
    try {
      const usersData = await fs.readFile(usersPath, 'utf8');
      users = JSON.parse(usersData);
    } catch (error) {
      // File doesn't exist
    }
    
    try {
      const usageData = await fs.readFile(usagePath, 'utf8');
      usage = JSON.parse(usageData);
    } catch (error) {
      // File doesn't exist
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

    // Calculate statistics
    const stats = {
      totalUsers: Object.keys(users).length,
      totalMessages: Object.values(users).reduce((sum, user) => sum + (user.totalMessages || 0), 0),
      totalCost: Object.values(users).reduce((sum, user) => sum + (user.totalCost || 0), 0),
      totalApiKeys: apiKeys.keys.length,
      activeUsers: Object.values(users).filter(user => user.totalMessages > 0).length
    };

    // API key distribution
    const keyDistribution = {};
    apiKeys.keys.forEach((key, index) => {
      const usersWithThisKey = Object.entries(users)
        .filter(([email, userData]) => userData.apiKeyIndex === index)
        .map(([email]) => email);
      
      keyDistribution[`Key ${index + 1}`] = {
        users: usersWithThisKey,
        userCount: usersWithThisKey.length,
        totalMessages: usersWithThisKey.reduce((sum, email) => sum + (users[email]?.totalMessages || 0), 0),
        totalCost: usersWithThisKey.reduce((sum, email) => sum + (users[email]?.totalCost || 0), 0)
      };
    });

    // Recent activity (last 20 messages across all users)
    const recentActivity = [];
    Object.entries(usage).forEach(([email, userUsage]) => {
      userUsage.forEach(activity => {
        recentActivity.push({
          user: email,
          ...activity
        });
      });
    });
    
    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const last20Activities = recentActivity.slice(0, 20);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        stats,
        users,
        keyDistribution,
        recentActivity: last20Activities,
        lastUpdated: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Error in admin-data:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};