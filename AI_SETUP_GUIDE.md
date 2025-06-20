# 🤖 AI Assistant Setup Guide

This guide will help you set up and test your Claude AI assistant with Netlify.

## 📋 Prerequisites

1. A Claude API key from [Anthropic Console](https://console.anthropic.com/)
2. Netlify account with your site deployed
3. Access to your Netlify environment variables

## 🚀 Quick Setup Steps

### Step 1: Add API Keys to Netlify

1. Go to your Netlify dashboard: https://app.netlify.com/projects/coruscating-phoenix-a6ac78/configuration/env
2. Add these environment variables:

```
CLAUDE_API_KEY_1=sk-ant-your-actual-api-key-here
CLAUDE_API_KEY_2=sk-ant-another-key (optional)
CLAUDE_API_KEY_3=sk-ant-another-key (optional)
```

⚠️ **Important**: Replace `sk-ant-your-actual-api-key-here` with your real Claude API key!

### Step 2: Deploy Your Changes

1. Commit and push your code changes to GitHub
2. Netlify will automatically redeploy your site
3. Wait for the deployment to complete

### Step 3: Test Your AI Assistant

#### Option A: Simple Test Page
Visit: `https://your-site.netlify.app/test-ai.html`

This page will:
- ✅ Test API connection
- 💬 Allow simple chat with Claude
- 🔧 Show connection status

#### Option B: Main Application
Visit: `https://your-site.netlify.app/intelligent-management.html`

1. Sign in with Google
2. Try the "Quick Add Task" with AI
3. Use the AI Chat feature

## 🧪 Testing Commands

### In Browser Console

```javascript
// Test simple AI assistant
await simpleAI.initialize('test@example.com');
const result = await simpleAI.testConnection();
console.log(result);

// Send a message
const response = await simpleAI.sendMessage('Hello! How are you?');
console.log(response);

// Parse a task with AI
const task = await simpleAI.parseTaskWithAI('Call John tomorrow at 2pm');
console.log(task);
```

### Expected Responses

#### ✅ Successful Connection:
```json
{
  "success": true,
  "message": "Claude API connection successful!",
  "response": "Connection successful"
}
```

#### ❌ Failed Connection:
```json
{
  "success": false,
  "error": "No valid API keys configured"
}
```

## 🐛 Troubleshooting

### Problem: "No valid API keys configured"
**Solution**: 
1. Check your Netlify environment variables
2. Ensure API keys start with `sk-ant-`
3. Redeploy your site after adding variables

### Problem: "Method not allowed" or 404 errors
**Solution**:
1. Ensure Netlify Functions are enabled
2. Check that files exist in `netlify/functions/` folder
3. Verify the function names match your code

### Problem: "Invalid JSON payload"
**Solution**:
1. Check browser network tab for request details
2. Ensure `Content-Type: application/json` header
3. Verify JSON format in request body

### Problem: Claude API rate limits
**Solution**:
1. Add more API keys (CLAUDE_API_KEY_2, etc.)
2. The system automatically load balances across keys
3. Consider upgrading your Anthropic plan

## 📊 Monitoring Usage

The system automatically tracks:
- API usage per user
- Cost estimation
- Message history
- Key distribution

Check your usage in:
- `data/users.json` - User data
- `data/usage.json` - Usage logs

## 🔧 Advanced Configuration

### Multiple API Keys
The system supports up to 15 API keys for load balancing:
```
CLAUDE_API_KEY_1=sk-ant-...
CLAUDE_API_KEY_2=sk-ant-...
...
CLAUDE_API_KEY_15=sk-ant-...
```

### Model Configuration
Edit `netlify/functions/claude-chat.js` to change the model:
```javascript
model: 'claude-3-5-sonnet-20241022' // Change this line
```

Available models:
- `claude-3-5-sonnet-20241022` (recommended)
- `claude-3-haiku-20240307` (faster, cheaper)
- `claude-3-opus-20240229` (most capable)

## 📈 Performance Tips

1. **Use Multiple API Keys**: Distributes load across keys
2. **Cache Responses**: Avoid repeated identical requests
3. **Optimize Prompts**: Shorter prompts = lower costs
4. **Monitor Usage**: Track costs via Anthropic Console

## 🛡️ Security Notes

- API keys are stored securely in Netlify environment variables
- Keys are never exposed to the client browser
- User emails are used for key assignment and tracking
- All API requests go through your Netlify Functions

## 📞 Support

If you need help:
1. Check the browser console for error messages
2. Review Netlify Function logs
3. Test with the simple test page first
4. Verify your API key works in Anthropic Console

---

**Last Updated**: Created for initial AI assistant setup
**Next Steps**: Once working, explore advanced features in the full application!