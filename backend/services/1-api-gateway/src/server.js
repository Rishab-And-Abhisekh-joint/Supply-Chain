const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const proxy = require('express-http-proxy');

const authMiddleware = require('./middleware/auth.middleware');

// Initialize Express app
const app = express();

// --- CORS Configuration ---
const allowedOrigins = [
  'http://localhost:9002',
  'http://localhost:3001',
  process.env.FRONTEND_URL,
  // Vercel preview URLs pattern
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Allow Vercel preview URLs
    if (origin && origin.includes('.vercel.app')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
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

// --- Service Routes ---
// All routes are protected by the Firebase auth middleware.
app.use('/api/inventory', authMiddleware, proxy(inventoryServiceUrl));
app.use('/api/orders', authMiddleware, proxy(orderServiceUrl));
app.use('/api/warehouse', authMiddleware, proxy(warehouseServiceUrl));
app.use('/api/delivery', authMiddleware, proxy(deliveryServiceUrl));
app.use('/api/notifications', authMiddleware, proxy(notificationServiceUrl));
app.use('/api/forecast', authMiddleware, proxy(forecastingServiceUrl));
app.use('/api/agentic', authMiddleware, proxy(agenticServiceUrl));

// --- 404 Handler ---
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found on API Gateway' });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'An internal server error occurred' });
});

// --- Start Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}, proxying to all services.`);
});