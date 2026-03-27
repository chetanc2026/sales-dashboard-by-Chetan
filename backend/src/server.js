const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');
const dashboardRoutes = require('./routes/dashboard');
const authMiddleware = require('./middleware/auth');

const app = express();

const parseAllowedOrigins = () => {
  const configured = process.env.CORS_ORIGIN || 'http://localhost:3000';
  return configured
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const allowedOrigins = parseAllowedOrigins();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests without Origin (curl, health checks, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/data', authMiddleware, dataRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Sales Dashboard Backend API`);
});
