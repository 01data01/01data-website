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
    const { userEmail, message, apiKey, stream } = JSON.parse(event.body);
    
    if (!userEmail || !message || !apiKey) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Get current date and time
    const currentDateTime = new Date().toISOString();
    
    // Prepare Claude API request body
    const claudeRequestBody = {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      system: `You are a helpful AI assistant. The current date and time is: ${currentDateTime}`,
      messages: [
        {
          role: 'user',
          content: message
        }
      ]
    };

    // Add streaming parameter if requested
    if (stream) {
      claudeRequestBody.stream = true;
    }

    // Make request to Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(claudeRequestBody)
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

    // Handle streaming response
    if (stream) {
      // For Netlify Functions, we'll collect the full response and send it back
      // The client will simulate streaming
      const reader = claudeResponse.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'content_block_delta' && data.delta && data.delta.type === 'text_delta') {
                  fullContent += data.delta.text;
                } else if (data.type === 'message_stop') {
                  break;
                } else if (data.type === 'error') {
                  throw new Error(data.error.message || 'Streaming error');
                }
              } catch (parseError) {
                // Skip invalid JSON lines
                continue;
              }
            }
          }
        }
      } catch (streamError) {
        console.error('Streaming error:', streamError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Streaming error: ' + streamError.message })
        };
      }

      // Calculate approximate cost (rough estimate)
      const inputTokens = message.length / 4;
      const outputTokens = fullContent.length / 4;
      const estimatedCost = (inputTokens * 0.003 + outputTokens * 0.015) / 1000;

      // Update user usage
      await updateUsage(userEmail, message, fullContent, estimatedCost);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          response: fullContent,
          isStreaming: true,
          usage: {
            inputTokens: Math.round(inputTokens),
            outputTokens: Math.round(outputTokens),
            estimatedCost: Math.round(estimatedCost * 1000) / 1000
          }
        })
      };
    }

    // Handle regular (non-streaming) response
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
    // Log usage to console for monitoring (since file system is read-only in Netlify Functions)
    console.log(`Usage - User: ${userEmail}, Cost: $${cost.toFixed(4)}, Message length: ${message.length}, Response length: ${response.length}`);
    
    // In a production environment, you would send this data to:
    // - A database (PostgreSQL, MongoDB, etc.)
    // - An external service (Airtable, Google Sheets, etc.)
    // - A logging service (LogRocket, DataDog, etc.)
    
  } catch (error) {
    console.error('Error logging usage:', error);
    // Don't throw error, just log it so chat continues to work
  }
}