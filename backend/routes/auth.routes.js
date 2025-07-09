const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const { register } = require('../controllers/auth.controller');
const { authRateLimit } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');
const { getCurrentAdminPasskey, setAdminPasskey } = require('../utils/passkey-storage');

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit(authRateLimit);

// Validation middleware for simplified registration
const validateRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phone')
    .matches(/^\+91[6-9]\d{9}$/)
    .withMessage('Please provide a valid Indian mobile number with +91'),
  body('age')
    .isInt({ min: 1, max: 120 })
    .withMessage('Age must be between 1 and 120 years'),
  body('gender')
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other')
];

// Simplified routes for passwordless registration
router.post('/register', authLimiter, validateRegistration, register);

// Keep admin login with passkey for admin access
router.post('/admin-login', async (req, res) => {
  try {
    const { passkey } = req.body;
    logger.info('Admin login attempt with passkey');

    if (!passkey) {
      return res.status(400).json({
        success: false,
        message: 'Passkey is required'
      });
    }

    // Verify admin passkey
    const adminPasskey = getCurrentAdminPasskey();
    if (passkey !== adminPasskey) {
      logger.info(`Admin login failed - invalid passkey. Expected: ${adminPasskey}, Received: ${passkey}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid admin passkey'
      });
    }

    // Generate admin session token
    const token = jwt.sign(
      { 
        role: 'admin',
        type: 'admin_session'
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    logger.info('Admin login successful');

    res.json({
      success: true,
      message: 'Admin login successful',
      token,
      user: {
        role: 'admin',
        type: 'admin_session'
      }
    });

  } catch (error) {
    logger.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin login'
    });
  }
});

// Simple admin token verification endpoint
router.get('/verify-admin', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify admin session token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type === 'admin_session' && decoded.role === 'admin') {
      return res.json({
        success: true,
        message: 'Token is valid',
        admin: {
          role: 'admin',
          type: 'admin_session'
        }
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid admin token'
    });
  } catch (error) {
    logger.error('Admin token verification error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
});

// Get current admin info endpoint
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify admin session token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type === 'admin_session' && decoded.role === 'admin') {
      return res.json({
        success: true,
        data: {
          id: 'admin_session',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@healthcare.com',
          role: 'admin',
          type: 'admin_session'
        }
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid admin token'
    });
  } catch (error) {
    logger.error('Get admin info error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
});

// Forgot admin passkey - send OTP to clinic email
router.post('/admin/forgot-passkey', authLimiter, async (req, res) => {
  try {
    const clinicEmail = 'khushihomeopathicclinic@gmail.com';
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP temporarily (in production, use Redis or database)
    // For now, store in memory with expiration
    global.resetOTP = {
      otp: otp,
      expires: Date.now() + 10 * 60 * 1000, // 10 minutes
      email: clinicEmail
    };
    
    // Log OTP for testing (remove in production)
    console.log(`🔐 ADMIN PASSKEY RESET OTP: ${otp} (expires in 10 minutes)`);
    
    // Try to send OTP email, but don't fail if email service is down
    try {
      const { sendMail } = require('../utils/email-simple');
      const emailTemplates = require('../utils/emailTemplates');
      
      // Use the proper email template
      const emailContent = emailTemplates.adminOtp({ otp });
      
      await sendMail({
        to: clinicEmail,
        subject: emailContent.subject,
        html: emailContent.html
      });
      logger.info('Passkey reset OTP sent to clinic email');
      
      res.json({
        success: true,
        message: 'OTP sent to clinic email address. Please check your email.',
        email: clinicEmail.replace(/(.{2}).*@/, '$1***@') // Partially mask email
      });
    } catch (emailError) {
      logger.error('Email sending failed, but OTP generated:', emailError);
      
      // If email fails, still provide the OTP for testing/emergency access
      res.json({
        success: true,
        message: 'OTP generated successfully. Check server console for OTP (email service temporarily unavailable).',
        email: clinicEmail.replace(/(.{2}).*@/, '$1***@'),
        note: 'Email service temporarily unavailable. Contact system administrator.',
        serverOtp: process.env.NODE_ENV === 'development' ? otp : undefined // Only show in development
      });
    }
  } catch (error) {
    logger.error('Forgot passkey error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate reset OTP. Please try again.'
    });
  }
});

// Reset admin passkey with OTP
router.post('/admin/reset-passkey', authLimiter, async (req, res) => {
  try {
    const { otp, newPasskey } = req.body;
    
    if (!otp || !newPasskey) {
      return res.status(400).json({
        success: false,
        message: 'OTP and new passkey are required'
      });
    }
    
    // Validate new passkey
    if (newPasskey.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New passkey must be at least 6 characters long'
      });
    }
    
    // Check if OTP exists and is valid
    if (!global.resetOTP) {
      return res.status(400).json({
        success: false,
        message: 'No active reset request found. Please request a new OTP.'
      });
    }
    
    // Check if OTP is expired
    if (Date.now() > global.resetOTP.expires) {
      global.resetOTP = null; // Clear expired OTP
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }
    
    // Verify OTP
    if (otp !== global.resetOTP.otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check and try again.'
      });
    }
    
    // Update the admin passkey using the persistent storage
    const passkeyUpdated = setAdminPasskey(newPasskey);
    
    if (!passkeyUpdated) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update admin passkey'
      });
    }
    
    // Clear the OTP
    global.resetOTP = null;
    
    // Send confirmation email
    try {
      const { sendMail } = require('../utils/email-simple');
      const subject = 'Admin Passkey Successfully Reset - Khushi Homeopathic Clinic';
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Passkey Reset Successful</h2>
          <p>Hello Admin,</p>
          <p>Your admin passkey has been successfully reset.</p>
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0;">
            <p style="color: #166534; margin: 0;"><strong>✅ Your new passkey is now active and ready to use.</strong></p>
          </div>
          <p>You can now login to the admin dashboard using your new passkey.</p>
          <p>If you did not make this change, please contact system support immediately.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            Khushi Homeopathic Clinic<br>
            Admin Dashboard Security System<br>
            Reset completed at: ${new Date().toLocaleString()}
          </p>
        </div>
      `;
      
      await sendMail({
        to: 'khushihomeopathicclinic@gmail.com',
        subject: subject,
        html: html
      });
    } catch (emailError) {
      logger.warn('Confirmation email failed (but passkey was reset):', emailError);
    }
    
    logger.info('Admin passkey successfully reset');
    
    res.json({
      success: true,
      message: 'Passkey reset successful! You can now login with your new passkey.'
    });
  } catch (error) {
    logger.error('Reset passkey error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset passkey. Please try again.'
    });
  }
});

// Simple passkey verification endpoint for admin actions
router.post('/verify-passkey', async (req, res) => {
  try {
    const { passkey } = req.body;
    
    if (!passkey) {
      return res.status(400).json({
        success: false,
        message: 'Passkey is required'
      });
    }

    // Verify admin passkey
    const adminPasskey = getCurrentAdminPasskey();
    if (passkey !== adminPasskey) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin passkey'
      });
    }

    res.json({
      success: true,
      message: 'Passkey verified successfully'
    });

  } catch (error) {
    logger.error('Passkey verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during passkey verification'
    });
  }
});

module.exports = router;
