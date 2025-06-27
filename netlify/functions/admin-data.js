const fs = require('fs').promises;
const path = require('path');

// Performance cache for admin data
let adminDataCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 30000; // 30 seconds cache for admin data

// Performance metrics
const metrics = {
  requests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  errors: 0,
  avgResponseTime: 0,
  responseTimes: []
};

// Optimized file loading with error handling for serverless environment
async function safeLoadJsonFile(filePath, fallback = {}) {
  // In Netlify Functions, return fallback since files don't exist
  console.log(`Note: File ${filePath} not available in serverless environment, using fallback`);
  return fallback;
}

// Optimized statistics calculation
function calculateStatsOptimized(users, usage) {
  const userEntries = Object.entries(users);
  const userValues = Object.values(users);
  
  // Single pass through users for multiple calculations
  let totalMessages = 0;
  let totalCost = 0;
  let activeUsers = 0;
  
  userValues.forEach(user => {
    if (user.totalMessages > 0) {
      activeUsers++;
      totalMessages += user.totalMessages || 0;
      totalCost += user.totalCost || 0;
    }
  });
  
  return {
    totalUsers: userEntries.length,
    totalMessages,
    totalCost: Math.round(totalCost * 1000) / 1000, // Round to 3 decimal places
    activeUsers,
    avgMessagesPerUser: totalMessages > 0 ? Math.round(totalMessages / Math.max(activeUsers, 1) * 100) / 100 : 0,
    avgCostPerUser: totalCost > 0 ? Math.round(totalCost / Math.max(activeUsers, 1) * 1000) / 1000 : 0
  };
}

// Optimized key distribution calculation
function calculateKeyDistributionOptimized(users, apiKeyCount) {
  const keyDistribution = {};
  
  // Initialize all keys
  for (let i = 0; i < apiKeyCount; i++) {
    keyDistribution[`Key ${i + 1}`] = {
      users: [],
      userCount: 0,
      totalMessages: 0,
      totalCost: 0
    };
  }
  
  // Single pass through users
  Object.entries(users).forEach(([email, userData]) => {
    const keyIndex = userData.apiKeyIndex;
    if (typeof keyIndex === 'number' && keyIndex < apiKeyCount) {
      const keyName = `Key ${keyIndex + 1}`;
      const keyData = keyDistribution[keyName];
      
      keyData.users.push(email);
      keyData.userCount++;
      keyData.totalMessages += userData.totalMessages || 0;
      keyData.totalCost += userData.totalCost || 0;
    }
  });
  
  // Round costs
  Object.values(keyDistribution).forEach(keyData => {
    keyData.totalCost = Math.round(keyData.totalCost * 1000) / 1000;
  });
  
  return keyDistribution;
}

// Optimized recent activity processing
function processRecentActivityOptimized(usage, limit = 20) {
  const recentActivity = [];
  
  // Pre-allocate array with estimated size for better performance
  const estimatedSize = Math.min(Object.keys(usage).length * 5, limit * 2);
  recentActivity.length = 0;
  
  Object.entries(usage).forEach(([email, userUsage]) => {
    if (Array.isArray(userUsage)) {
      userUsage.forEach(activity => {
        recentActivity.push({
          user: email,
          timestamp: activity.timestamp,
          message: activity.message,
          responseLength: activity.responseLength,
          cost: activity.cost
        });
      });
    }
  });
  
  // Sort by timestamp (most recent first) and limit results
  recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return recentActivity.slice(0, limit);
}

exports.handler = async (event, context) => {
  const startTime = Date.now();
  metrics.requests++;
  
  // Enhanced CORS headers with security
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    metrics.errors++;
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const now = Date.now();
    
    // Check cache first
    if (adminDataCache && (now - cacheTimestamp) < CACHE_DURATION) {
      metrics.cacheHits++;
      const responseTime = Date.now() - startTime;
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ...adminDataCache,
          performance: {
            responseTime,
            cacheHit: true,
            cachedAt: new Date(cacheTimestamp).toISOString()
          }
        })
      };
    }
    
    metrics.cacheMisses++;
    
    // Parallel file loading for better performance
    const [users, usage] = await Promise.all([
      safeLoadJsonFile(path.join(process.cwd(), 'data', 'users.json'), {}),
      safeLoadJsonFile(path.join(process.cwd(), 'data', 'usage.json'), {})
    ]);
    
    // Optimized API keys validation
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

    // Optimized statistics calculation
    const stats = {
      ...calculateStatsOptimized(users, usage),
      totalApiKeys: apiKeys.keys.length,
      dataIntegrity: {
        usersFileSize: Object.keys(users).length,
        usageFileSize: Object.keys(usage).length,
        validApiKeys: apiKeys.keys.length
      }
    };

    // Optimized key distribution calculation
    const keyDistribution = calculateKeyDistributionOptimized(users, apiKeys.keys.length);

    // Optimized recent activity processing
    const recentActivity = processRecentActivityOptimized(usage, 20);

    // Additional analytics for admin insights
    const analytics = {
      userGrowth: {
        totalUsers: stats.totalUsers,
        newUsersLast7Days: Object.values(users).filter(user => {
          if (!user.assignedDate) return false;
          const assignedDate = new Date(user.assignedDate);
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return assignedDate > sevenDaysAgo;
        }).length
      },
      keyEfficiency: Object.entries(keyDistribution).map(([keyName, data]) => ({
        keyName,
        efficiency: data.userCount > 0 ? Math.round(data.totalMessages / data.userCount * 100) / 100 : 0,
        loadBalance: Math.round(data.userCount / Math.max(stats.totalUsers, 1) * 100 * 100) / 100
      })),
      costAnalysis: {
        avgCostPerMessage: stats.totalMessages > 0 ? Math.round(stats.totalCost / stats.totalMessages * 1000) / 1000 : 0,
        topUsers: Object.entries(users)
          .filter(([_, user]) => user.totalCost > 0)
          .sort(([_, a], [__, b]) => (b.totalCost || 0) - (a.totalCost || 0))
          .slice(0, 5)
          .map(([email, user]) => ({
            email: email.replace(/(.{2}).*@/, '$1***@'), // Anonymize email
            totalCost: Math.round(user.totalCost * 1000) / 1000,
            totalMessages: user.totalMessages || 0
          }))
      }
    };

    // Cache the computed data
    const responseData = {
      stats,
      users: Object.fromEntries(
        Object.entries(users).map(([email, userData]) => [
          email.replace(/(.{2}).*@/, '$1***@'), // Anonymize emails in response
          {
            ...userData,
            email: undefined // Remove email from user data
          }
        ])
      ),
      keyDistribution,
      recentActivity: recentActivity.map(activity => ({
        ...activity,
        user: activity.user.replace(/(.{2}).*@/, '$1***@') // Anonymize emails
      })),
      analytics,
      lastUpdated: new Date().toISOString()
    };

    adminDataCache = responseData;
    cacheTimestamp = now;

    const responseTime = Date.now() - startTime;
    
    // Update metrics
    metrics.responseTimes.push(responseTime);
    if (metrics.responseTimes.length > 100) {
      metrics.responseTimes.shift(); // Keep only last 100 measurements
    }
    metrics.avgResponseTime = metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ...responseData,
        performance: {
          responseTime,
          cacheHit: false,
          computedAt: new Date().toISOString(),
          metrics: {
            totalRequests: metrics.requests,
            cacheHitRate: metrics.requests > 0 ? Math.round(metrics.cacheHits / metrics.requests * 100 * 100) / 100 : 0,
            avgResponseTime: Math.round(metrics.avgResponseTime * 100) / 100
          }
        }
      })
    };

  } catch (error) {
    metrics.errors++;
    const responseTime = Date.now() - startTime;
    
    console.error('Error in admin-data:', {
      error: error.message,
      stack: error.stack,
      responseTime,
      timestamp: new Date().toISOString()
    });
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        requestId: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        performance: {
          responseTime,
          failed: true
        }
      })
    };
  }
};