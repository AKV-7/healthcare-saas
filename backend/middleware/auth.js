const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  let token;

  // Check for token in headers or cookies
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Handle admin session tokens
    if (decoded.type === 'admin_session' && decoded.role === 'admin') {
      req.user = {
        role: 'admin',
        type: 'admin_session',
        isActive: true
      };
      return next();
    }

    // Handle regular user tokens
    if (!decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format'
      });
    }

    // Get user from token
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated'
      });
    }

    // Check if password was changed after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: 'User recently changed password! Please log in again'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Token verification failed:', error);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }

    next();
  };
};

// Check if user owns the resource or is admin
const checkOwnership = (modelName, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      // Validate user ID
      if (!req.user._id) {
        return res.status(401).json({
          success: false,
          message: 'Invalid user authentication'
        });
      }

      const Model = require(`../models/${modelName}`);
      const resource = await Model.findById(req.params[paramName]);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      // Admin can access everything
      if (req.user.role === 'admin') {
        req.resource = resource;
        return next();
      }

      // Check ownership based on model
      let isOwner = false;
      
      switch (modelName) {
        case 'User':
          isOwner = resource._id.toString() === req.user._id.toString();
          break;
        case 'Appointment':
          isOwner = resource.patient.toString() === req.user._id.toString() || 
                   resource.doctor.toString() === req.user._id.toString();
          break;
        default:
          // For other models, check if there's a user field
          if (resource.user) {
            isOwner = resource.user.toString() === req.user._id.toString();
          }
      }

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this resource'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      logger.error('Ownership check failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during ownership verification'
      });
    }
  };
};

// Rate limiting for authentication endpoints
const authRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 50 : 5, // More lenient in development
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
};

const loginRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    code: 'RATE_LIMIT_001',
    message: 'Too many login attempts from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
};

// Validate JWT token without database lookup (for performance)
const validateToken = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.tokenData = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Authorize admin roles with different levels
const authorizeAdmin = (requiredLevel = 2) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    // Handle admin session tokens (from admin login passkey)
    if (req.user.type === 'admin_session' && req.user.role === 'admin') {
      // Admin session tokens have full access
      return next();
    }

    // Check if user is an admin type
    if (!['super_admin', 'admin', 'hospital_manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Check admin level permissions
    // Lower admin levels (1, 2) have higher privileges than higher levels (3)
    // So users with level 1 or 2 can access level 3 routes
    const userLevel = req.user.adminLevel;
    if (userLevel > requiredLevel) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient admin privileges'
      });
    }

    next();
  };
};

// Super Admin only (level 1)
const authorizeSuperAdmin = authorizeAdmin(1);

// Admin and above (level 2 and below)
const authorizeAdminLevel = authorizeAdmin(2);

// Hospital Manager and above (level 3 and below)
const authorizeHospitalManager = authorizeAdmin(3);

module.exports = {
  protect,
  authorize,
  authorizeAdmin,
  authorizeSuperAdmin,
  authorizeAdminLevel,
  authorizeHospitalManager,
  authRateLimit,
  loginRateLimit,
  validateToken,
  checkOwnership
};
