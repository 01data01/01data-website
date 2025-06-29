# API Key Generation Guide 🔑

## Quick Start for Generating API Keys

### 1. Access Admin Dashboard
Open: `https://01data.org/admin/dashboard.html`

**Admin Password**: `change_this_admin_password_123` (Change this!)

### 2. Generate API Key for A1 PVC
1. Login to admin dashboard
2. Fill in the form:
   - **Company Name**: "A1 PVC Market"
   - **Usage Limit**: 5000 (requests per month)
   - **Price per Minute**: $1.50
3. Click "Generate API Key"
4. Copy the generated key (e.g., `sk_a1pvcmarket_abc123`)

### 3. Give API Key to A1 PVC
Send them:
```javascript
// Integration code for A1 PVC
<script src="https://01data.org/widget/embed.js"></script>
<script>
AIWidget.init({
  apiKey: 'sk_a1pvcmarket_abc123',  // Their unique key
  language: 'tr',
  company: 'A1 PVC Market'
});
</script>
```

---

## API Key Management

### Creating API Keys via API
```bash
# Create new API key
curl -X POST https://01data.org/.netlify/functions/generate-api-key \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_admin_password" \
  -d '{
    "company": "A1 PVC Market",
    "limit": 5000,
    "pricePerMinute": 1.50
  }'
```

### Response Example
```json
{
  "success": true,
  "apiKey": "sk_a1pvcmarket_abc123",
  "company": "A1 PVC Market",
  "limit": 5000,
  "pricePerMinute": 1.50,
  "message": "API key created successfully"
}
```

---

## Pricing & Billing

### Usage Tracking
- Each conversation minute = 1 API request
- Track usage automatically
- Monthly billing based on actual usage

### Example Pricing
```
A1 PVC Company:
- Used: 150 minutes this month
- Rate: $1.50/minute  
- Bill: 150 × $1.50 = $225
- Your costs: ~$45 (ElevenLabs + Claude)
- Your profit: ~$180
```

---

## Security Setup

### 1. Change Admin Password
Set environment variable in Netlify:
```
ADMIN_PASSWORD=your_secure_admin_password_here
```

### 2. API Key Format
```
sk_[company]_[random]
Examples:
- sk_a1pvcmarket_abc123
- sk_testcompany_xyz789
```

---

## Dashboard Features

### ✅ What You Can Do:
- **Generate new API keys** for clients
- **View all active keys** and usage stats
- **Track revenue** per client
- **Activate/deactivate** keys
- **Monitor usage** in real-time

### 📊 Dashboard Sections:
1. **Stats Overview**: Total keys, revenue, active clients
2. **Create New Key**: Generate keys for new clients
3. **Manage Keys**: View and control existing keys

---

## Client Onboarding Process

### For New Clients Like A1 PVC:

1. **Create API Key**
   ```
   Company: A1 PVC Market
   Limit: 5000 requests/month
   Price: $1.50/minute
   ```

2. **Send Integration Code**
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

3. **Monthly Billing**
   - Monitor usage via dashboard
   - Send invoice based on actual minutes used
   - Profit = (Usage × Your Rate) - (Your Costs)

---

## Environment Variables Needed

Set these in Netlify Dashboard → Site Settings → Environment Variables:

```
ADMIN_PASSWORD=your_secure_password
ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_AGENT_ID=your_agent_id
CLAUDE_API_KEY=your_claude_key
```

---

## Testing the System

### Test API Key Creation:
1. Go to `/admin/dashboard.html`
2. Login with admin password
3. Create test key for "Test Company"
4. Verify it appears in the list

### Test Widget Integration:
1. Use generated API key in widget demo
2. Test both text and voice modes
3. Check usage tracking in dashboard

---

## Next Steps

1. **Change admin password** (security)
2. **Generate A1 PVC's API key**
3. **Send them integration code**
4. **Monitor usage** and bill monthly
5. **Scale to more clients**

**Ready to start making money!** 💰