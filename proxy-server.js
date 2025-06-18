const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'anthropic-version']
}));

// Proxy middleware for Claude API
const claudeProxy = createProxyMiddleware({
    target: 'https://api.anthropic.com',
    changeOrigin: true,
    pathRewrite: {
        '^/api/claude': '/v1'
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`Proxying request: ${req.method} ${req.url}`);
    },
    onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).json({ error: 'Proxy error: ' + err.message });
    }
});

// Apply the proxy middleware
app.use('/api/claude', claudeProxy);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Claude API Proxy Server is running' });
});

app.listen(PORT, () => {
    console.log(`🚀 Claude API Proxy Server running on http://localhost:${PORT}`);
    console.log(`📡 Proxying requests to Claude API`);
    console.log(`🔗 Use http://localhost:${PORT}/api/claude in your app`);
});