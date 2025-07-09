require('express-async-errors');
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { createServer } = require('http');
const { logger } = require('./utils/logger');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
try {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  
  // Verify Cloudinary configuration
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    console.log('✅ Cloudinary configured successfully');
  } else {
    console.warn('⚠️ Cloudinary configuration incomplete - some environment variables missing');
  }
} catch (error) {
  console.error('❌ Cloudinary configuration failed:', error.message);
}

// Import custom modules
const connectDB = require('./config/db');
const realtimeService = require('./utils/realtime');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const paymentRoutes = require('./routes/payment.routes');

// Import middleware
const { protect } = require('./middleware/auth');
const { apiLimiter, adminLimiter } = require('./middleware/rateLimit');

const app = express();
app.set('trust proxy', 1); // trust first proxy
const server = createServer(app);

// Initialize real-time service
realtimeService.initialize(server);

// Connect to database
connectDB();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting - apply general limiter to all API routes
app.use('/api/', apiLimiter);

// Apply admin-specific rate limiter to admin routes
app.use('/api/appointments/admin', adminLimiter);
app.use('/api/users', adminLimiter);
app.use('/api/analytics', adminLimiter);

// CORS configuration
const getAllowedOrigins = () => {
  if (process.env.NODE_ENV === 'production') {
    // Support multiple origins separated by comma
    const prodOrigins = process.env.FRONTEND_URL_PROD;
    if (prodOrigins && prodOrigins.includes(',')) {
      return prodOrigins.split(',').map(origin => origin.trim());
    }
    return [prodOrigins || 'https://healthcare-saas-m1v4.vercel.app'];
  }
  return [process.env.FRONTEND_URL || 'http://localhost:3000'];
};

const corsOptions = {
  origin: getAllowedOrigins(),
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Healthcare API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    realtime: {
      connectedUsers: realtimeService.getConnectedUsersStats()
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/payments', paymentRoutes);

// File upload route with enhanced error handling
const { uploadSingleFile } = require('./utils/upload');
app.post('/api/upload', (req, res) => {
  uploadSingleFile(req, res, (err) => {
    try {
      if (err) {
        console.error('Upload middleware error:', err);
        return res.status(400).json({ 
          error: 'Upload failed', 
          details: err.message 
        });
      }
      
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      console.log('File uploaded successfully:', req.file.filename);
      res.json({ 
        url: req.file.path,
        public_id: req.file.filename 
      });
    } catch (error) {
      console.error('Upload route error:', error);
      res.status(500).json({ 
        error: 'Upload processing failed',
        details: error.message 
      });
    }
  });
});

// Real-time connection status endpoint
app.get('/api/realtime/status', protect, (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      connectedUsers: realtimeService.getConnectedUsersStats(),
      isConnected: realtimeService.isUserConnected(req.user.id)
    }
  });
});

// Validation error handler middleware
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format'
    });
  }
  next(err);
});

// Express validator error handler
app.use((err, req, res, next) => {
  if (err.type === 'validation') {
    const errors = err.errors.map(error => ({
      field: error.path,
      message: error.message
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }
  next(err);
});

// Global error handler
app.use((err, req, res, _next) => {
  logger.error('Unhandled error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(error => ({
      field: error.path,
      message: error.message
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`🚀 Healthcare API server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  logger.info(`✅ MongoDB Connected: ${process.env.MONGODB_URI?.includes('localhost') ? 'localhost' : 'Atlas'}`);
  logger.info(`🔌 Real-time service initialized`);
  
  if (process.env.NODE_ENV === 'development') {
    logger.info(`📊 Analytics dashboard available at: http://localhost:${PORT}/api/analytics/dashboard`);
    logger.info(`💳 Payment system ready at: http://localhost:${PORT}/api/payments`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', err);
  // Don't exit in development, just log the error
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  } else {
    logger.warn('Continuing server operation in development mode...');
  }
});

// Uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  // Don't exit in development, just log the error
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  } else {
    logger.warn('Continuing server operation in development mode...');
  }
});

module.exports = app;
