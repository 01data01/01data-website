// Debug function to check API keys (temporary - remove after debugging)
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const apiKeys = [
      process.env.CLAUDE_API_KEY_1,
      process.env.CLAUDE_API_KEY_2,
      process.env.CLAUDE_API_KEY_3,
      process.env.CLAUDE_API_KEY_4,
      process.env.CLAUDE_API_KEY_5
    ].filter(key => key && typeof key === 'string');

    const keyInfo = apiKeys.map((key, index) => ({
      index: index + 1,
      exists: !!key,
      startsWithSkAnt: key ? key.startsWith('sk-ant-') : false,
      length: key ? key.length : 0,
      preview: key ? key.substring(0, 20) + '...' : 'NOT_SET'
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        totalKeys: apiKeys.length,
        validKeys: apiKeys.filter(key => key && key.startsWith('sk-ant-')).length,
        keyInfo: keyInfo,
        environment: process.env.NODE_ENV || 'unknown'
      }, null, 2)
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};