# Netlify Functions Setup for AI Widget API

## 🚀 Quick Setup Guide

### Step 1: Add Environment Variables in Netlify Dashboard

Go to **Netlify Dashboard → Your Site → Site Settings → Environment Variables** and add:

```
ADMIN_PASSWORD=your_secure_admin_password_123
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_AGENT_ID=your_elevenlabs_agent_id_here
CLAUDE_API_KEY=your_claude_api_key_here
```

### Step 2: Install Dependencies (if needed)

```bash
npm install axios @supabase/supabase-js
```

### Step 3: Deploy to Netlify

Commit and push your changes:

```bash
git add .
git commit -m "Add AI Widget API functions to main site"
git push
```

### Step 4: Test Functions

After deployment, your functions will be available at:

- `https://01data.org/.netlify/functions/conversation`
- `https://01data.org/.netlify/functions/generate-api-key`  
- `https://01data.org/.netlify/functions/verify-key`

### Step 5: Access Admin Dashboard

- **Server-connected**: `https://01data.org/admin/dashboard.html`
- **Independent**: `https://01data.org/admin/independent-dashboard.html`

---

## 🔧 API Endpoints Available

### `/conversation` - Main Chat API
```bash
curl -X POST https://01data.org/.netlify/functions/conversation \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk_test_demo456" \
  -d '{"message": "Hello", "language": "tr", "mode": "text"}'
```

### `/generate-api-key` - Create API Keys
```bash
curl -X POST https://01data.org/.netlify/functions/generate-api-key \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_admin_password" \
  -d '{"company": "A1 PVC Market", "limit": 5000, "pricePerMinute": 1.50}'
```

### `/verify-key` - Validate API Keys
```bash
curl -X GET https://01data.org/.netlify/functions/verify-key \
  -H "x-api-key: sk_test_demo456"
```

---

## 🎯 Widget Integration

### For A1 PVC Company:

```html
<script src="https://01data.org/widget/embed.js"></script>
<script>
AIWidget.init({
  apiKey: 'sk_a1pvcmarket_abc123',
  language: 'tr',
  company: 'A1 PVC Market'
});
</script>
```

---

## 🛡️ Security Notes

1. **Change Admin Password**: Never use the default password in production
2. **Environment Variables**: Store all secrets in Netlify environment variables
3. **API Key Rotation**: Regularly rotate API keys for security
4. **Rate Limiting**: Monitor usage to prevent abuse

---

## 💰 Business Operation

1. **Generate API Key**: Use admin dashboard to create client keys
2. **Client Integration**: Send integration code to clients
3. **Monitor Usage**: Track via dashboard or Netlify function logs
4. **Monthly Billing**: Bill clients based on actual usage minutes

---

## 🔄 Troubleshooting

### Common Issues:

**Functions not working?**
- Check environment variables are set in Netlify
- Verify function deployment in Netlify dashboard
- Check function logs for errors

**Dashboard not loading?**
- Ensure admin/dashboard.html is deployed
- Check browser console for errors
- Verify API endpoints are accessible

**Widget not connecting?**
- Check API key is valid
- Verify CORS headers in functions
- Test with verify-key endpoint first

---

## ✅ Deployment Checklist

- [ ] Environment variables added to Netlify
- [ ] Dependencies installed (axios, supabase)
- [ ] Functions deployed successfully
- [ ] Admin dashboard accessible
- [ ] Widget demo working
- [ ] API key generation tested
- [ ] A1 PVC integration ready

Ready to start earning revenue! 🚀