const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const proxy = require('express-http-proxy');

// Initialize Express app
const app = express();

// --- CORS Configuration ---
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Allow Vercel URLs
    if (origin && origin.includes('.vercel.app')) {
      return callback(null, true);
    }
    
    // Allow localhost
    if (origin && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    // Allow all in production for now
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// --- Middleware ---
app.use(cors(corsOptions));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(morgan('dev'));
app.use(express.json());

// --- Service URLs from Environment Variables ---
const inventoryServiceUrl = process.env.INVENTORY_SERVICE_URL;
const orderServiceUrl = process.env.ORDER_SERVICE_URL;
const warehouseServiceUrl = process.env.WAREHOUSE_SERVICE_URL;
const deliveryServiceUrl = process.env.DELIVERY_SERVICE_URL;
const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL;
const forecastingServiceUrl = process.env.FORECASTING_SERVICE_URL;
const agenticServiceUrl = process.env.AGENTIC_AI_SERVICE_URL;

// --- Health Check Route ---
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'API Gateway is up and running' });
});

// --- Service Routes (NO AUTH - for testing) ---
if (inventoryServiceUrl) {
  app.use('/api/inventory', proxy(inventoryServiceUrl, {
    proxyReqPathResolver: (req) => req.url
  }));
}

if (orderServiceUrl) {
  app.use('/api/orders', proxy(orderServiceUrl, {
    proxyReqPathResolver: (req) => req.url
  }));
}

if (warehouseServiceUrl) {
  app.use('/api/warehouse', proxy(warehouseServiceUrl, {
    proxyReqPathResolver: (req) => req.url
  }));
}

if (deliveryServiceUrl) {
  app.use('/api/delivery', proxy(deliveryServiceUrl, {
    proxyReqPathResolver: (req) => req.url
  }));
}

if (notificationServiceUrl) {
  app.use('/api/notifications', proxy(notificationServiceUrl, {
    proxyReqPathResolver: (req) => req.url
  }));
}

if (forecastingServiceUrl) {
  app.use('/api/forecast', proxy(forecastingServiceUrl, {
    proxyReqPathResolver: (req) => req.url
  }));
}

if (agenticServiceUrl) {
  app.use('/api/agentic', proxy(agenticServiceUrl, {
    proxyReqPathResolver: (req) => req.url
  }));
}

// --- 404 Handler ---
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found on API Gateway' });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error('Gateway Error:', err.message);
  res.status(500).json({ message: 'An internal server error occurred' });
});

// --- Start Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log('Service URLs:');
  console.log('  Inventory:', inventoryServiceUrl);
  console.log('  Orders:', orderServiceUrl);
  console.log('  Warehouse:', warehouseServiceUrl);
  console.log('  Delivery:', deliveryServiceUrl);
});