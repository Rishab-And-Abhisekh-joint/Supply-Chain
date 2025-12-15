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

// --- Service URLs ---
const services = {
  inventory: process.env.INVENTORY_SERVICE_URL,
  order: process.env.ORDER_SERVICE_URL,
  warehouse: process.env.WAREHOUSE_SERVICE_URL,
  delivery: process.env.DELIVERY_SERVICE_URL,
  notification: process.env.NOTIFICATION_SERVICE_URL,
  forecasting: process.env.FORECASTING_SERVICE_URL,
  agentic: process.env.AGENTIC_AI_SERVICE_URL,
};

// --- Proxy options with longer timeout for Render cold starts ---
const createProxy = (target, pathRewrite) => createProxyMiddleware({
  target,
  changeOrigin: true,
  pathRewrite,
  timeout: 60000, // 60 seconds for Render cold starts
  proxyTimeout: 60000,
  onError: (err, req, res) => {
    console.error(`Proxy error for ${req.path}:`, err.message);
    res.status(502).json({ 
      error: 'Service temporarily unavailable', 
      message: 'Please try again in a moment'
    });
  }
});

// --- Health Check ---
app.get('/health', (req, res) => {
  res.json({ status: 'API Gateway running', services });
});

// --- Service Routes ---
// Inventory: /api/inventory/products -> inventory-service/products
if (services.inventory) {
  app.use('/api/inventory', createProxy(services.inventory, {
    '^/api/inventory': ''  // Remove /api/inventory prefix
  }));
}

// Orders: /api/orders -> order-service/orders
if (services.order) {
  app.use('/api/orders', createProxy(services.order, {
    '^/api/orders': '/orders'  // /api/orders -> /orders
  }));
}

// Warehouse: /api/warehouse -> warehouse-service/warehouse
if (services.warehouse) {
  app.use('/api/warehouse', createProxy(services.warehouse, {
    '^/api/warehouse': '/warehouse'  // /api/warehouse -> /warehouse
  }));
}

// Delivery: /api/delivery -> delivery-service/delivery
if (services.delivery) {
  app.use('/api/delivery', createProxy(services.delivery, {
    '^/api/delivery': '/delivery'
  }));
}

// Notifications
if (services.notification) {
  app.use('/api/notifications', createProxy(services.notification, {
    '^/api/notifications': '/notifications'
  }));
}

// Forecasting
if (services.forecasting) {
  app.use('/api/forecast', createProxy(services.forecasting, {
    '^/api/forecast': '/api'
  }));
}

// Agentic AI
if (services.agentic) {
  app.use('/api/agentic', createProxy(services.agentic, {
    '^/api/agentic': '/api/v1'
  }));
}

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// --- Start Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log('Services:', services);
});