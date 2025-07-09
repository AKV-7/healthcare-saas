const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // increased from 100 to 500 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.'
    });
  }
});

// Less restrictive limiter for admin routes
const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // increased from 60 to 200 requests per minute
  message: {
    success: false,
    message: 'Too many admin requests. Please wait a moment before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many admin requests. Please wait a moment before trying again.'
    });
  }
});

// Stricter limiter for appointment search
const appointmentSearchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // increased from 5 to 30 searches per minute
  message: {
    success: false,
    message: 'Too many appointment searches. Please wait a minute before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many appointment searches. Please wait a minute before trying again.'
    });
  },
  keyGenerator: (req) => {
    // Use IP + User ID for more granular rate limiting
    return `${req.ip}-${req.params.userId || 'anonymous'}`;
  }
});

// Auth endpoints rate limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // increased from 5 to 20 auth attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again later.'
    });
  }
});

module.exports = {
  apiLimiter,
  adminLimiter,
  appointmentSearchLimiter,
  authLimiter
}; 