const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// --- CORS Configuration ---
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(morgan('dev'));
app.use(express.json());

// --- Helper function to ensure URL has https:// prefix ---
const ensureHttps = (url) => {
  if (!url) return null;
  url = url.trim();
  // If URL already has a protocol, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // Otherwise, add https:// prefix (Render services use HTTPS)
  return `https://${url}`;
};

// --- Service URLs (with https:// prefix ensured) ---
const services = {
  inventory: ensureHttps(process.env.INVENTORY_SERVICE_URL),
  order: ensureHttps(process.env.ORDER_SERVICE_URL),
  warehouse: ensureHttps(process.env.WAREHOUSE_SERVICE_URL),
  delivery: ensureHttps(process.env.DELIVERY_SERVICE_URL),
  notification: ensureHttps(process.env.NOTIFICATION_SERVICE_URL),
  forecasting: ensureHttps(process.env.FORECASTING_SERVICE_URL),
  agentic: ensureHttps(process.env.AGENTIC_AI_SERVICE_URL),
};

// Log service URLs on startup for debugging
console.log('\n====== SERVICE URL CONFIGURATION ======');
Object.entries(services).forEach(([name, url]) => {
  console.log(`  ${name.padEnd(15)}: ${url || '❌ NOT SET'}`);
});
console.log('========================================\n');

// --- Proxy factory with timeout and error handling ---
const createProxy = (serviceName, target, pathRewriteFn) => {
  if (!target) {
    // Return a middleware that returns 503 if service URL not configured
    return (req, res) => {
      console.error(`[ERROR] ${serviceName} service URL not configured`);
      res.status(503).json({
        error: 'Service not configured',
        message: `The ${serviceName} service URL is not set in environment variables`,
      });
    };
  }

  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: pathRewriteFn,
    timeout: 120000,        // 120 seconds for cold starts
    proxyTimeout: 120000,
    secure: true,
    onProxyReq: (proxyReq, req, res) => {
      const targetPath = proxyReq.path;
      console.log(`[PROXY →] ${req.method} ${req.originalUrl} → ${target}${targetPath}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`[PROXY ←] ${proxyRes.statusCode} ${req.method} ${req.originalUrl}`);
    },
    onError: (err, req, res) => {
      console.error(`[PROXY ERROR] ${serviceName}: ${err.message}`);
      console.error(`[PROXY ERROR] Target: ${target}`);
      console.error(`[PROXY ERROR] Original URL: ${req.originalUrl}`);
      
      if (!res.headersSent) {
        res.status(502).json({ 
          error: 'Bad Gateway', 
          message: `Could not connect to ${serviceName} service. It may be starting up (cold start can take 30-60 seconds on free tier).`,
          service: serviceName,
          target: target,
          originalError: err.message
        });
      }
    }
  });
};

// --- Health Check ---
app.get('/health', (req, res) => {
  res.json({ 
    status: 'API Gateway running', 
    timestamp: new Date().toISOString(),
    services: Object.fromEntries(
      Object.entries(services).map(([k, v]) => [k, v ? '✅ ' + v : '❌ not set'])
    )
  });
});

// --- Debug endpoint to check service URLs ---
app.get('/debug/services', (req, res) => {
  res.json({
    message: 'Service URL configuration',
    raw_env: {
      INVENTORY_SERVICE_URL: process.env.INVENTORY_SERVICE_URL || 'not set',
      ORDER_SERVICE_URL: process.env.ORDER_SERVICE_URL || 'not set',
      WAREHOUSE_SERVICE_URL: process.env.WAREHOUSE_SERVICE_URL || 'not set',
      DELIVERY_SERVICE_URL: process.env.DELIVERY_SERVICE_URL || 'not set',
      NOTIFICATION_SERVICE_URL: process.env.NOTIFICATION_SERVICE_URL || 'not set',
      FORECASTING_SERVICE_URL: process.env.FORECASTING_SERVICE_URL || 'not set',
      AGENTIC_AI_SERVICE_URL: process.env.AGENTIC_AI_SERVICE_URL || 'not set',
    },
    processed: services
  });
});

// --- Service Routes ---

// Inventory: /api/inventory/* → inventory-service/*
// Controller uses @Controller('products'), so:
// /api/inventory/products → /products
// /api/inventory/products/123 → /products/123
app.use('/api/inventory', createProxy('inventory', services.inventory, (path) => {
  // path comes in as what's after /api/inventory was matched
  // e.g., /api/inventory/products → path = /products
  const newPath = path || '/';
  console.log(`  [PATH REWRITE] inventory: "${path}" → "${newPath}"`);
  return newPath;
}));

// Orders: /api/orders/* → order-service/orders/*
// Controller uses @Controller('orders'), so:
// /api/orders → /orders
// /api/orders/123 → /orders/123
app.use('/api/orders', createProxy('order', services.order, (path) => {
  // path comes in as what's after /api/orders
  // e.g., /api/orders → path = '' or '/'
  // e.g., /api/orders/123 → path = /123
  const newPath = '/orders' + (path === '/' ? '' : path);
  console.log(`  [PATH REWRITE] orders: "${path}" → "${newPath}"`);
  return newPath;
}));

// Warehouse: /api/warehouse/* → warehouse-service/warehouse/*
// Controller uses @Controller('warehouse')
app.use('/api/warehouse', createProxy('warehouse', services.warehouse, (path) => {
  const newPath = '/warehouse' + (path === '/' ? '' : path);
  console.log(`  [PATH REWRITE] warehouse: "${path}" → "${newPath}"`);
  return newPath;
}));

// Delivery: /api/delivery/* → delivery-service/delivery/*
// Controller uses @Controller('delivery')
app.use('/api/delivery', createProxy('delivery', services.delivery, (path) => {
  const newPath = '/delivery' + (path === '/' ? '' : path);
  console.log(`  [PATH REWRITE] delivery: "${path}" → "${newPath}"`);
  return newPath;
}));

// Notifications: /api/notifications/* → notification-service/notifications/*
// Controller uses @Controller('notifications')
app.use('/api/notifications', createProxy('notification', services.notification, (path) => {
  const newPath = '/notifications' + (path === '/' ? '' : path);
  console.log(`  [PATH REWRITE] notifications: "${path}" → "${newPath}"`);
  return newPath;
}));

// Forecasting: /api/forecast/* → forecasting-service/api/*
// FastAPI uses prefix="/api"
app.use('/api/forecast', createProxy('forecasting', services.forecasting, (path) => {
  const newPath = '/api' + (path === '/' ? '' : path);
  console.log(`  [PATH REWRITE] forecasting: "${path}" → "${newPath}"`);
  return newPath;
}));

// Agentic AI: /api/agentic/* → agentic-service/api/v1/*
// FastAPI uses prefix="/api/v1"
app.use('/api/agentic', createProxy('agentic', services.agentic, (path) => {
  const newPath = '/api/v1' + (path === '/' ? '' : path);
  console.log(`  [PATH REWRITE] agentic: "${path}" → "${newPath}"`);
  return newPath;
}));

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found on API Gateway',
    path: req.originalUrl,
    hint: 'Available routes: /health, /debug/services, /api/inventory/*, /api/orders/*, /api/warehouse/*, /api/delivery/*, /api/notifications/*, /api/forecast/*, /api/agentic/*'
  });
});

// --- Error Handler ---
app.use((err, req, res, next) => {
  console.error('[UNHANDLED ERROR]', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// --- Start Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════════╗`);
  console.log(`║  API Gateway running on port ${PORT}       ║`);
  console.log(`╚════════════════════════════════════════╝\n`);
  console.log(`Test endpoints:`);
  console.log(`  GET /health          - Check gateway status`);
  console.log(`  GET /debug/services  - Check service URLs\n`);
});