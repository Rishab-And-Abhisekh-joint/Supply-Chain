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
console.log('Configured Service URLs:');
Object.entries(services).forEach(([name, url]) => {
  console.log(`  ${name}: ${url || 'NOT SET'}`);
});

// --- Proxy factory with timeout and error handling ---
const createProxy = (target, pathRewriteFn) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: pathRewriteFn,
    timeout: 60000,        // 60 seconds for cold starts
    proxyTimeout: 60000,
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[PROXY] ${req.method} ${req.originalUrl} → ${target}${proxyReq.path}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`[PROXY] Response: ${proxyRes.statusCode} for ${req.originalUrl}`);
    },
    onError: (err, req, res) => {
      console.error(`[PROXY ERROR] ${req.originalUrl}:`, err.message);
      if (!res.headersSent) {
        res.status(502).json({ 
          error: 'Service temporarily unavailable', 
          message: 'The backend service may be starting up. Please try again in a moment.',
          path: req.originalUrl
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
      Object.entries(services).map(([k, v]) => [k, v ? 'configured' : 'not set'])
    )
  });
});

// --- Service Routes ---

// Inventory: /api/inventory/* → inventory-service/*
// Controller uses @Controller('products'), so:
// /api/inventory/products → /products
// /api/inventory/products/123 → /products/123
if (services.inventory) {
  app.use('/api/inventory', createProxy(services.inventory, (path) => {
    // path is what comes after /api/inventory
    // e.g., /api/inventory/products → path = /products
    const newPath = path || '/';
    console.log(`[PATH] inventory: ${path} → ${newPath}`);
    return newPath;
  }));
}

// Orders: /api/orders/* → order-service/orders/*
// Controller uses @Controller('orders'), so:
// /api/orders → /orders
// /api/orders/123 → /orders/123
if (services.order) {
  app.use('/api/orders', createProxy(services.order, (path) => {
    // path is what comes after /api/orders
    // e.g., /api/orders → path = '' or '/'
    // e.g., /api/orders/123 → path = /123
    const newPath = '/orders' + (path || '');
    console.log(`[PATH] orders: ${path} → ${newPath}`);
    return newPath;
  }));
}

// Warehouse: /api/warehouse/* → warehouse-service/warehouse/*
// Controller uses @Controller('warehouse')
if (services.warehouse) {
  app.use('/api/warehouse', createProxy(services.warehouse, (path) => {
    const newPath = '/warehouse' + (path || '');
    console.log(`[PATH] warehouse: ${path} → ${newPath}`);
    return newPath;
  }));
}

// Delivery: /api/delivery/* → delivery-service/delivery/*
// Controller uses @Controller('delivery')
if (services.delivery) {
  app.use('/api/delivery', createProxy(services.delivery, (path) => {
    const newPath = '/delivery' + (path || '');
    console.log(`[PATH] delivery: ${path} → ${newPath}`);
    return newPath;
  }));
}

// Notifications: /api/notifications/* → notification-service/notifications/*
// Controller uses @Controller('notifications')
if (services.notification) {
  app.use('/api/notifications', createProxy(services.notification, (path) => {
    const newPath = '/notifications' + (path || '');
    console.log(`[PATH] notifications: ${path} → ${newPath}`);
    return newPath;
  }));
}

// Forecasting: /api/forecast/* → forecasting-service/api/*
// FastAPI uses prefix="/api"
if (services.forecasting) {
  app.use('/api/forecast', createProxy(services.forecasting, (path) => {
    const newPath = '/api' + (path || '');
    console.log(`[PATH] forecasting: ${path} → ${newPath}`);
    return newPath;
  }));
}

// Agentic AI: /api/agentic/* → agentic-service/api/v1/*
// FastAPI uses prefix="/api/v1"
if (services.agentic) {
  app.use('/api/agentic', createProxy(services.agentic, (path) => {
    const newPath = '/api/v1' + (path || '');
    console.log(`[PATH] agentic: ${path} → ${newPath}`);
    return newPath;
  }));
}

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found on API Gateway',
    path: req.originalUrl,
    availableRoutes: [
      '/health',
      '/api/inventory/*',
      '/api/orders/*',
      '/api/warehouse/*',
      '/api/delivery/*',
      '/api/notifications/*',
      '/api/forecast/*',
      '/api/agentic/*'
    ]
  });
});

// --- Error Handler ---
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// --- Start Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`========================================\n`);
});