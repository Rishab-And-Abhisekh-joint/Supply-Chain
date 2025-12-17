// =============================================================================
// FILE: src/middleware/logging.middleware.js
// ACTION: CREATE NEW
// =============================================================================

const { Pool } = require('pg');

// Optional: PostgreSQL connection for logging
let pool = null;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
}

const requestLogger = async (req, res, next) => {
  const startTime = Date.now();
  
  // Capture response
  const originalSend = res.send;
  res.send = function (body) {
    res.responseBody = body;
    return originalSend.call(this, body);
  };
  
  res.on('finish', async () => {
    const duration = Date.now() - startTime;
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
    
    // Log to database if configured
    if (pool && req.path.startsWith('/api/')) {
      try {
        await pool.query(
          `INSERT INTO activity_logs 
           (method, path, status_code, duration_ms, user_id, ip_address, user_agent, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [
            req.method,
            req.originalUrl,
            res.statusCode,
            duration,
            req.user?.uid || null,
            req.ip,
            req.headers['user-agent'],
          ]
        );
      } catch (err) {
        // Don't fail the request if logging fails
        console.error('Failed to log request:', err.message);
      }
    }
  });
  
  next();
};

module.exports = { requestLogger };
