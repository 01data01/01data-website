const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3001;

// Performance and security optimizations
app.use(compression()); // Enable gzip compression
app.use(express.json({ limit: '10mb' })); // Set JSON payload limit

// Request caching for repeated API calls
const cache = new Map();
const CACHE_DURATION = 300000; // 5 minutes
const MAX_CACHE_SIZE = 1000;

// Performance metrics tracking
const metrics = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    errors: 0,
    avgResponseTime: 0,
    requestTimes: []
};

// Rate limiting middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        metrics.errors++;
        res.status(429).json({
            error: 'Rate limit exceeded',
            retryAfter: Math.round(req.rateLimit.resetTime / 1000)
        });
    }
});

// Apply rate limiting to API routes
app.use('/api', limiter);

// Enhanced CORS configuration
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'anthropic-version'],
    credentials: false,
    maxAge: 86400 // 24 hours preflight cache
}));

// Request cache middleware
function cacheMiddleware(req, res, next) {
    // Only cache GET requests
    if (req.method !== 'GET') {
        return next();
    }

    const cacheKey = `${req.method}:${req.url}:${JSON.stringify(req.headers)}`;
    const cached = cache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        metrics.cacheHits++;
        return res.json(cached.data);
    }

    metrics.cacheMisses++;
    
    // Store original send function
    const originalSend = res.json;
    res.json = function(data) {
        // Cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
            // Limit cache size
            if (cache.size >= MAX_CACHE_SIZE) {
                const oldestKey = cache.keys().next().value;
                cache.delete(oldestKey);
            }
            
            cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });
        }
        
        return originalSend.call(this, data);
    };
    
    next();
}

// Performance monitoring middleware
function performanceMiddleware(req, res, next) {
    const startTime = Date.now();
    
    metrics.totalRequests++;
    
    res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        
        // Update metrics
        metrics.requestTimes.push(responseTime);
        if (metrics.requestTimes.length > 100) {
            metrics.requestTimes.shift(); // Keep only last 100 measurements
        }
        
        metrics.avgResponseTime = metrics.requestTimes.reduce((a, b) => a + b, 0) / metrics.requestTimes.length;
        
        // Log slow requests
        if (responseTime > 5000) {
            console.warn(`Slow request: ${req.method} ${req.url} took ${responseTime}ms`);
        }
    });
    
    next();
}

// Apply middleware
app.use(performanceMiddleware);
app.use('/api/claude', cacheMiddleware);

// Enhanced proxy middleware for Claude API
const claudeProxy = createProxyMiddleware({
    target: 'https://api.anthropic.com',
    changeOrigin: true,
    timeout: 30000, // 30 second timeout
    pathRewrite: {
        '^/api/claude': '/v1'
    },
    onProxyReq: (proxyReq, req, res) => {
        const requestId = Math.random().toString(36).substr(2, 9);
        req.requestId = requestId;
        console.log(`[${requestId}] Proxying: ${req.method} ${req.url}`);
        
        // Add request timeout handling
        proxyReq.setTimeout(30000, () => {
            console.error(`[${requestId}] Request timeout`);
            metrics.errors++;
            proxyReq.destroy();
        });
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`[${req.requestId}] Response: ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
        const requestId = req.requestId || 'unknown';
        console.error(`[${requestId}] Proxy error:`, err.message);
        metrics.errors++;
        
        if (!res.headersSent) {
            res.status(502).json({ 
                error: 'Gateway error',
                message: 'Unable to reach Claude API',
                requestId: requestId
            });
        }
    }
});

// Apply the proxy middleware
app.use('/api/claude', claudeProxy);

// Enhanced health check endpoint with metrics
app.get('/health', (req, res) => {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    res.json({ 
        status: 'OK', 
        message: 'Claude API Proxy Server is running',
        uptime: Math.round(uptime),
        metrics: {
            ...metrics,
            cacheSize: cache.size,
            memoryUsage: {
                rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB'
            }
        },
        timestamp: new Date().toISOString()
    });
});

// Metrics endpoint for monitoring
app.get('/metrics', (req, res) => {
    res.json({
        ...metrics,
        cacheSize: cache.size,
        cacheHitRate: metrics.totalRequests > 0 ? (metrics.cacheHits / metrics.totalRequests * 100).toFixed(2) + '%' : '0%',
        errorRate: metrics.totalRequests > 0 ? (metrics.errors / metrics.totalRequests * 100).toFixed(2) + '%' : '0%',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

app.listen(PORT, () => {
    console.log(`🚀 Claude API Proxy Server running on http://localhost:${PORT}`);
    console.log(`📡 Proxying requests to Claude API`);
    console.log(`🔗 Use http://localhost:${PORT}/api/claude in your app`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📈 Metrics: http://localhost:${PORT}/metrics`);
});