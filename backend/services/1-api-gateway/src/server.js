require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// ============ MIDDLEWARE ============

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.FRONTEND_URL,
    /\.vercel\.app$/,
    /\.render\.com$/,
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
};
app.use(cors(corsOptions));

// Request logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ============ HEALTH CHECK ============

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
  });
});

// ============ SERVICE URLS ============

const SERVICES = {
  inventory: process.env.INVENTORY_SERVICE_URL || 'http://localhost:3001',
  order: process.env.ORDER_SERVICE_URL || 'http://localhost:3002',
  warehouse: process.env.WAREHOUSE_SERVICE_URL || 'http://localhost:3003',
  delivery: process.env.DELIVERY_SERVICE_URL || 'http://localhost:3004',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006',
  ai: process.env.AI_SERVICE_URL || 'http://localhost:3007',
};

// ============ PROXY OPTIONS ============

const createProxyOptions = (target, pathRewrite = {}) => ({
  target,
  changeOrigin: true,
  pathRewrite,
  timeout: 30000,
  proxyTimeout: 30000,
  onError: (err, req, res) => {
    console.error(`Proxy error for ${target}:`, err.message);
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Service temporarily unavailable',
        service: target,
        message: err.message,
      });
    }
  },
  onProxyReq: (proxyReq, req) => {
    // Forward original headers
    if (req.headers.authorization) {
      proxyReq.setHeader('Authorization', req.headers.authorization);
    }
    if (req.headers['x-api-key']) {
      proxyReq.setHeader('X-API-Key', req.headers['x-api-key']);
    }
    // Add request ID for tracing
    proxyReq.setHeader('X-Request-ID', req.headers['x-request-id'] || `req-${Date.now()}`);
  },
});

// ============ PROXY ROUTES ============

// Inventory Service
app.use('/api/inventory', createProxyMiddleware(createProxyOptions(SERVICES.inventory, {
  '^/api/inventory': '/inventory',
})));

app.use('/api/products', createProxyMiddleware(createProxyOptions(SERVICES.inventory, {
  '^/api/products': '/products',
})));

// Order Service
app.use('/api/orders', createProxyMiddleware(createProxyOptions(SERVICES.order, {
  '^/api/orders': '/orders',
})));

// Warehouse Service
app.use('/api/warehouse', createProxyMiddleware(createProxyOptions(SERVICES.warehouse, {
  '^/api/warehouse': '/warehouse',
})));

// Delivery Service
app.use('/api/delivery', createProxyMiddleware(createProxyOptions(SERVICES.delivery, {
  '^/api/delivery': '/delivery',
})));

app.use('/api/routes', createProxyMiddleware(createProxyOptions(SERVICES.delivery, {
  '^/api/routes': '/routes',
})));

app.use('/api/drivers', createProxyMiddleware(createProxyOptions(SERVICES.delivery, {
  '^/api/drivers': '/drivers',
})));

// Notification Service
app.use('/api/notifications', createProxyMiddleware(createProxyOptions(SERVICES.notification, {
  '^/api/notifications': '/notifications',
})));

// AI Service
app.use('/api/ai', createProxyMiddleware(createProxyOptions(SERVICES.ai, {
  '^/api/ai': '/api',
})));

app.use('/api/forecast', createProxyMiddleware(createProxyOptions(SERVICES.ai, {
  '^/api/forecast': '/api/forecast',
})));

// ============ ERROR HANDLING ============

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    error: message,
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  });
});

// ============ START SERVER ============

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log('\nConfigured services:');
  Object.entries(SERVICES).forEach(([name, url]) => {
    console.log(`  - ${name}: ${url}`);
  });
});

module.exports = app;