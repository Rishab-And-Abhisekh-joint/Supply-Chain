// ============================================================================
// API GATEWAY - REQUIRED MODIFICATIONS
// Based on frontend API expectations from lib/api.ts
// ============================================================================

// =============================================================================
// FILE: src/server.js
// ACTION: MODIFY - Add all proxy routes and new endpoints
// =============================================================================

const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import middleware and services
const { verifyFirebaseToken } = require('./middleware/auth.middleware');
const { errorHandler } = require('./middleware/error.middleware');
const { requestLogger } = require('./middleware/logging.middleware');
const customerRoutes = require('./routes/customer.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// =============================================================================
// Service URLs (from environment variables)
// =============================================================================
const SERVICE_URLS = {
  inventory: process.env.INVENTORY_SERVICE_URL || 'http://localhost:3001',
  orders: process.env.ORDER_SERVICE_URL || 'http://localhost:3002',
  warehouse: process.env.WAREHOUSE_SERVICE_URL || 'http://localhost:3003',
  delivery: process.env.DELIVERY_SERVICE_URL || 'http://localhost:3004',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005',
  forecasting: process.env.FORECASTING_SERVICE_URL || 'http://localhost:8000',
  agentic: process.env.AGENTIC_SERVICE_URL || 'http://localhost:8001',
};

// =============================================================================
// Middleware Setup
// =============================================================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:9002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Request logging (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Custom request logger for activity tracking
app.use(requestLogger);

// Parse JSON bodies for non-proxied routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// =============================================================================
// Health Check (no auth required)
// =============================================================================
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: Object.keys(SERVICE_URLS),
  });
});

// =============================================================================
// API Version endpoint
// =============================================================================
app.get('/api/version', (req, res) => {
  res.json({
    version: '1.0.0',
    name: 'Supply Chain API Gateway',
    environment: process.env.NODE_ENV || 'development',
  });
});

// =============================================================================
// Proxy Middleware Factory
// =============================================================================
const createServiceProxy = (target, pathRewrite = {}) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
    logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
    onProxyReq: (proxyReq, req) => {
      // Forward user info if authenticated
      if (req.user) {
        proxyReq.setHeader('X-User-Id', req.user.uid);
        proxyReq.setHeader('X-User-Email', req.user.email || '');
      }
    },
    onError: (err, req, res) => {
      console.error(`Proxy error for ${req.url}:`, err.message);
      res.status(503).json({
        error: 'Service temporarily unavailable',
        service: req.path.split('/')[2],
      });
    },
  });
};

// =============================================================================
// Protected Routes (require authentication)
// =============================================================================

// Customer management routes (handled by API Gateway)
app.use('/api/customers', verifyFirebaseToken, customerRoutes);

// Inventory Service
// Frontend: inventoryApi from lib/api.ts
app.use('/api/inventory',
  verifyFirebaseToken,
  createServiceProxy(SERVICE_URLS.inventory, {
    '^/api/inventory': '/inventory',
  })
);

// Products alias (some frontend calls use /products)
app.use('/api/products',
  verifyFirebaseToken,
  createServiceProxy(SERVICE_URLS.inventory, {
    '^/api/products': '/inventory',
  })
);

// Orders Service
// Frontend: ordersApi from lib/api.ts
app.use('/api/orders',
  verifyFirebaseToken,
  createServiceProxy(SERVICE_URLS.orders, {
    '^/api/orders': '/orders',
  })
);

// Warehouse Service
// Frontend: warehouseApi from lib/api.ts
app.use('/api/warehouse',
  verifyFirebaseToken,
  createServiceProxy(SERVICE_URLS.warehouse, {
    '^/api/warehouse': '/warehouse',
  })
);
app.use('/api/warehouses',
  verifyFirebaseToken,
  createServiceProxy(SERVICE_URLS.warehouse, {
    '^/api/warehouses': '/warehouse',
  })
);

// Delivery Service
// Frontend: deliveryApi from lib/api.ts
app.use('/api/delivery',
  verifyFirebaseToken,
  createServiceProxy(SERVICE_URLS.delivery, {
    '^/api/delivery': '/delivery',
  })
);
app.use('/api/deliveries',
  verifyFirebaseToken,
  createServiceProxy(SERVICE_URLS.delivery, {
    '^/api/deliveries': '/delivery',
  })
);

// Notification Service
app.use('/api/notifications',
  verifyFirebaseToken,
  createServiceProxy(SERVICE_URLS.notification, {
    '^/api/notifications': '/notification',
  })
);

// Events Stream (for operations-client.tsx real-time events)
// Frontend: getRealTimeEvents from operations/actions.ts
app.use('/api/events',
  verifyFirebaseToken,
  createServiceProxy(SERVICE_URLS.notification, {
    '^/api/events': '/events',
  })
);

// Forecasting Service (Python/FastAPI)
// Frontend: forecastApi and getDemandForecast from actions.ts
app.use('/api/forecast',
  verifyFirebaseToken,
  createServiceProxy(SERVICE_URLS.forecasting, {
    '^/api/forecast': '',
  })
);

// Agentic AI Service (Python/FastAPI)
// Frontend: agenticApi and getAnomalySummary from actions.ts
app.use('/api/agentic',
  verifyFirebaseToken,
  createServiceProxy(SERVICE_URLS.agentic, {
    '^/api/agentic': '',
  })
);

// Logistics Optimization (routes to Agentic service)
// Frontend: getLogisticsOptimization from logistics/actions.ts
app.use('/api/logistics',
  verifyFirebaseToken,
  createServiceProxy(SERVICE_URLS.agentic, {
    '^/api/logistics': '/logistics',
  })
);

// Marketplace & Bidding (routes to internal handler or dedicated service)
app.use('/api/marketplace',
  verifyFirebaseToken,
  createServiceProxy(SERVICE_URLS.warehouse, {
    '^/api/marketplace': '/marketplace',
  })
);

// Analytics & Dashboard
app.use('/api/analytics',
  verifyFirebaseToken,
  createServiceProxy(SERVICE_URLS.orders, {
    '^/api/analytics': '/analytics',
  })
);

// =============================================================================
// Semi-Protected Routes (optional auth)
// =============================================================================

// Locations API (can be accessed for public warehouse lookup)
app.use('/api/locations',
  createServiceProxy(SERVICE_URLS.warehouse, {
    '^/api/locations': '/locations',
  })
);

// Suppliers API
app.use('/api/suppliers',
  verifyFirebaseToken,
  createServiceProxy(SERVICE_URLS.warehouse, {
    '^/api/suppliers': '/suppliers',
  })
);

// Carriers API
app.use('/api/carriers',
  createServiceProxy(SERVICE_URLS.delivery, {
    '^/api/carriers': '/carriers',
  })
);

// Routes optimization API
app.use('/api/routes',
  verifyFirebaseToken,
  createServiceProxy(SERVICE_URLS.agentic, {
    '^/api/routes': '/routes',
  })
);

// AI Monitoring API
app.use('/api/ai',
  verifyFirebaseToken,
  createServiceProxy(SERVICE_URLS.agentic, {
    '^/api/ai': '/ai',
  })
);

// =============================================================================
// Catch-all for 404
// =============================================================================
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.originalUrl} not found`,
    availableEndpoints: [
      '/api/inventory',
      '/api/orders',
      '/api/warehouse',
      '/api/delivery',
      '/api/forecast',
      '/api/agentic',
      '/api/logistics',
      '/api/notifications',
      '/api/customers',
    ],
  });
});

// =============================================================================
// Error Handler
// =============================================================================
app.use(errorHandler);

// =============================================================================
// Start Server
// =============================================================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Services configured:`);
  Object.entries(SERVICE_URLS).forEach(([name, url]) => {
    console.log(`   - ${name}: ${url}`);
  });
});

module.exports = app;