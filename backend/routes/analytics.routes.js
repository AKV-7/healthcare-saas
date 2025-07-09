const express = require('express');
const { query } = require('express-validator');
const AnalyticsService = require('../utils/analytics');
const { protect, authorizeHospitalManager, authorizeAdminLevel, authorize } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { logger } = require('../utils/logger');
const { adminLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Validation middleware
const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365')
];

// @desc    Get dashboard overview
// @route   GET /api/analytics/dashboard
// @access  Private/Admin (all levels)
router.get('/dashboard', protect, authorizeHospitalManager, adminLimiter, async (req, res) => {
  try {
    // Get appointment counts by status
    const totalAppointments = await Appointment.countDocuments();
    const pendingAppointments = await Appointment.countDocuments({ status: 'pending' });
    const confirmedAppointments = await Appointment.countDocuments({ status: 'confirmed' });
    const completedAppointments = await Appointment.countDocuments({ status: 'completed' });
    const cancelledAppointments = await Appointment.countDocuments({ status: 'cancelled' });
    
    // Get total users
    const totalUsers = await User.countDocuments({ role: 'patient' });

    // Get recent appointments (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentAppointments = await Appointment.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Get appointments by type
    const appointmentsByType = await Appointment.aggregate([
      {
        $group: {
          _id: '$appointmentType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get appointments by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const appointmentsByMonth = await Appointment.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    const dashboardStats = {
      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments,
      totalUsers,
      recentAppointments,
      appointmentsByType,
      appointmentsByMonth
    };

    res.json(dashboardStats);
  } catch (error) {
    logger.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard analytics' });
  }
});

// @desc    Get system statistics
// @route   GET /api/analytics/system-stats
// @access  Private/Admin (admin and super_admin only)
router.get('/system-stats', protect, authorizeAdminLevel, adminLimiter, async (req, res) => {
  try {
    const result = await AnalyticsService.getSystemStats();
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching system statistics'
    });
  }
});

// @desc    Get appointment statistics
// @route   GET /api/analytics/appointment-stats
// @access  Private/Admin (all levels)
router.get('/appointment-stats', protect, authorizeHospitalManager, adminLimiter, validateDateRange, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let start, end;
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      // Default to current month
      start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      end = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    }

    const result = await AnalyticsService.getAppointmentStats(start, end);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching appointment statistics'
    });
  }
});

// @desc    Get doctor performance statistics
// @route   GET /api/analytics/doctor-performance
// @access  Private/Admin (admin and super_admin only)
router.get('/doctor-performance', protect, authorizeAdminLevel, adminLimiter, validateDateRange, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let start, end;
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      // Default to current month
      start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      end = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    }

    const result = await AnalyticsService.getDoctorPerformance(start, end);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching doctor performance'
    });
  }
});

// @desc    Get patient statistics
// @route   GET /api/analytics/patient-stats
// @access  Private/Admin/Doctor
router.get('/patient-stats', protect, authorize('admin', 'doctor'), adminLimiter, async (req, res) => {
  try {
    const result = await AnalyticsService.getPatientStats();
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patient statistics'
    });
  }
});

// @desc    Get revenue statistics
// @route   GET /api/analytics/revenue-stats
// @access  Private/Admin
router.get('/revenue-stats', protect, authorize('admin'), adminLimiter, validateDateRange, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let start, end;
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      // Default to current month
      start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      end = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    }

    const result = await AnalyticsService.getRevenueStats(start, end);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching revenue statistics'
    });
  }
});

// @desc    Get trends data
// @route   GET /api/analytics/trends
// @access  Private/Admin/Doctor
router.get('/trends', protect, authorize('admin', 'doctor'), [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365')
], async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const result = await AnalyticsService.getTrendsData(days);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching trends data'
    });
  }
});

// @desc    Get appointment analytics
// @route   GET /api/analytics/appointments
// @access  Private/Admin/Doctor
router.get('/appointments', protect, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const appointments = await Appointment.find({
      createdAt: { $gte: startDate }
    }).populate('userId', 'firstName lastName');

    const appointmentsByStatus = await Appointment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const appointmentsByType = await Appointment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$appointmentType',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      appointments,
      appointmentsByStatus,
      appointmentsByType
    });
  } catch (error) {
    logger.error('Error fetching appointment analytics:', error);
    res.status(500).json({ message: 'Failed to fetch appointment analytics' });
  }
});

// @desc    Get user analytics
// @route   GET /api/analytics/users
// @access  Private/Admin/Doctor
router.get('/users', protect, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const totalUsers = await User.countDocuments({ role: 'patient' });
    const newUsers = await User.countDocuments({
      role: 'patient',
      createdAt: { $gte: startDate }
    });

    const usersByGender = await User.aggregate([
      {
        $match: { role: 'patient' }
      },
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 }
        }
      }
    ]);

    const usersByAge = await User.aggregate([
      {
        $match: { role: 'patient' }
      },
      {
        $addFields: {
          age: {
            $floor: {
              $divide: [
                { $subtract: [new Date(), '$dateOfBirth'] },
                365 * 24 * 60 * 60 * 1000
              ]
            }
          }
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $lt: ['$age', 18] },
              'Under 18',
              {
                $cond: [
                  { $lt: ['$age', 30] },
                  '18-29',
                  {
                    $cond: [
                      { $lt: ['$age', 50] },
                      '30-49',
                      {
                        $cond: [
                          { $lt: ['$age', 65] },
                          '50-64',
                          '65+'
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      totalUsers,
      newUsers,
      usersByGender,
      usersByAge
    });
  } catch (error) {
    logger.error('Error fetching user analytics:', error);
    res.status(500).json({ message: 'Failed to fetch user analytics' });
  }
});

module.exports = router; 