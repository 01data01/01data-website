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
    const { userEmail, message, apiKey } = JSON.parse(event.body);
    
    if (!userEmail || !message || !apiKey) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Make request to Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: message
          }
        ]
      })
    });

    if (!claudeResponse.ok) {
      const errorData = await claudeResponse.json().catch(() => ({}));
      return {
        statusCode: claudeResponse.status,
        headers,
        body: JSON.stringify({ 
          error: `Claude API error: ${claudeResponse.status} ${claudeResponse.statusText}`,
          details: errorData
        })
      };
    }

    const claudeData = await claudeResponse.json();
    const responseText = claudeData.content[0].text;

    // Calculate approximate cost (rough estimate)
    const inputTokens = message.length / 4; // Rough estimate
    const outputTokens = responseText.length / 4; // Rough estimate
    const estimatedCost = (inputTokens * 0.003 + outputTokens * 0.015) / 1000; // Claude pricing estimate

    // Update user usage
    await updateUsage(userEmail, message, responseText, estimatedCost);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: responseText,
        usage: {
          inputTokens: Math.round(inputTokens),
          outputTokens: Math.round(outputTokens),
          estimatedCost: Math.round(estimatedCost * 1000) / 1000
        }
      })
    };

  } catch (error) {
    console.error('Error in claude-chat:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error: ' + error.message })
    };
  }
};

async function updateUsage(userEmail, message, response, cost) {
  try {
    // Update users.json
    const usersPath = path.join(process.cwd(), 'data', 'users.json');
    let users = {};
    
    try {
      const usersData = await fs.readFile(usersPath, 'utf8');
      users = JSON.parse(usersData);
    } catch (error) {
      // File doesn't exist, start fresh
    }

    if (users[userEmail]) {
      users[userEmail].totalMessages += 1;
      users[userEmail].totalCost += cost;
      users[userEmail].lastUsed = new Date().toISOString();
    }

    await fs.writeFile(usersPath, JSON.stringify(users, null, 2));

    // Update usage.json
    const usagePath = path.join(process.cwd(), 'data', 'usage.json');
    let usage = {};
    
    try {
      const usageData = await fs.readFile(usagePath, 'utf8');
      usage = JSON.parse(usageData);
    } catch (error) {
      // File doesn't exist, start fresh
    }

    if (!usage[userEmail]) {
      usage[userEmail] = [];
    }

    usage[userEmail].push({
      timestamp: new Date().toISOString(),
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      responseLength: response.length,
      cost: cost
    });

    // Keep only last 100 messages per user to prevent huge files
    if (usage[userEmail].length > 100) {
      usage[userEmail] = usage[userEmail].slice(-100);
    }

    await fs.writeFile(usagePath, JSON.stringify(usage, null, 2));
    
  } catch (error) {
    console.error('Error updating usage:', error);
  }
}