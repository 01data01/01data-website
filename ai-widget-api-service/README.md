# AI Widget API Service 🤖

A SaaS API service that provides AI-powered customer support widgets for companies.

## 🚀 Quick Start

### For API Consumers (Companies)
```javascript
// Include widget in your website
<script src="https://01data.org/widget/embed.js"></script>
<script>
AIWidget.init({
  apiKey: 'sk_yourcompany_abc123',
  language: 'tr', // or 'en'
  position: 'bottom-right'
});
</script>
```

### For API Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Test API
curl -X POST http://localhost:8888/.netlify/functions/conversation \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk_test_demo456" \
  -d '{"message": "Hello", "language": "en"}'
```

## 📁 Project Structure
```
ai-widget-api-service/
├── netlify/functions/     # API endpoints
├── widget/               # Embeddable widget
├── docs/                 # Documentation
├── admin/                # Admin dashboard
└── tests/                # Test files
```

## 🔧 Environment Variables
Set these in Netlify Dashboard:
```
ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_AGENT_ID=your_agent_id
CLAUDE_API_KEY=your_claude_key
```

## 📊 Usage Tracking
- **Pricing**: $1-2 per conversation minute
- **Billing**: Monthly usage-based
- **Limits**: Configurable per client

## 🎯 Current Status
See [PROJECT_PLAN.md](./PROJECT_PLAN.md) for detailed progress tracking.

---
Built with ❤️ for seamless AI customer support integration