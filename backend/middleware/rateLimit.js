const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

// Create Redis client for rate limiting (optional, falls back to memory if not available)
let redisClient;
try {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });
  redisClient.connect().catch(console.error);
} catch (error) {
  console.warn('Redis not available, using memory store for rate limiting');
  redisClient = null;
}

// General API rate limiter
const apiLimiter = rateLimit({
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }) : undefined,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.'
    });
  }
});

// Stricter limiter for appointment search
const appointmentSearchLimiter = rateLimit({
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }) : undefined,
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 searches per minute
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
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }) : undefined,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth attempts per 15 minutes
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
  appointmentSearchLimiter,
  authLimiter
}; 