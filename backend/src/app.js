const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const config = require('./config/env');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const restaurantRoutes = require('./routes/restaurants');
const paymentMethodRoutes = require('./routes/paymentMethods');
const cashDiscountRoutes = require('./routes/cashDiscounts');
const ratingsRoutes = require('./routes/ratings');
const adminRoutes = require('./routes/admin');
const monitoringRoutes = require('./routes/monitoring');
const geocodeRoutes = require('./routes/geocode');

// Create Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration - support multiple origins (comma-separated in env)
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Parse CORS_ORIGIN which can be a single origin or comma-separated list
    const allowedOrigins = config.CORS_ORIGIN.split(',').map(o => o.trim());
    
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
      callback(null, true); // Allow anyway in case of misconfiguration, but log warning
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Compression middleware
app.use(compression());

// Logging middleware
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT.WINDOW_MS,
  max: config.RATE_LIMIT.MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.NODE_ENV,
  });
});

// Serve static files for restaurant images
// Images are stored in /uploads/restaurants/ and accessed via /uploads/restaurants/:filename
// Add CORS headers for static files to allow cross-origin image loading
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', '*');
  next();
}, express.static(path.join(__dirname, '../uploads'), {
  maxAge: '1d', // Cache images for 1 day
  etag: true,
  lastModified: true,
}));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/cash-discounts', cashDiscountRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/geocode', geocodeRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Cash-or-Card-ON API',
    version: '1.0.0',
    description: 'Backend API for restaurant payment information platform',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      restaurants: '/api/restaurants',
      paymentMethods: '/api/payment-methods',
      cashDiscounts: '/api/cash-discounts',
    },
  });
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;
