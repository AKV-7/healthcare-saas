const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { logger } = require('../utils/logger');

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const { role, isActive, page = 1, limit = 10, search } = req.query;
    let query = {};

    // Apply filters
    if (role) {
      query.role = role;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Search functionality
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      data: users
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check access permissions
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this user'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user'
    });
  }
};

// @desc    Create user (Admin only)
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      role,
      phone,
      dateOfBirth,
      gender,
      address
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role: role || 'patient',
      phone,
      dateOfBirth,
      gender,
      address
    });

    logger.info(`New user created by admin: ${user.email} with role: ${user.role}`);

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        address: user.address,
        isActive: user.isActive,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    logger.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
const updateUser = async (req, res) => {
  try {
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user'
      });
    }

    // Define update fields based on role
    const updateFields = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      dateOfBirth: req.body.dateOfBirth,
      gender: req.body.gender,
      address: req.body.address,
      // Medical Information
      occupation: req.body.occupation,
      emergencyContactName: req.body.emergencyContactName,
      emergencyContactNumber: req.body.emergencyContactNumber,
      primaryPhysician: req.body.primaryPhysician,
      insuranceProvider: req.body.insuranceProvider,
      insurancePolicyNumber: req.body.insurancePolicyNumber,
      allergies: req.body.allergies,
      currentMedication: req.body.currentMedication,
      familyMedicalHistory: req.body.familyMedicalHistory,
      pastMedicalHistory: req.body.pastMedicalHistory,
      identificationType: req.body.identificationType,
      identificationNumber: req.body.identificationNumber,
      identificationDocument: req.body.identificationDocument,
      // Consent fields
      treatmentConsent: req.body.treatmentConsent,
      disclosureConsent: req.body.disclosureConsent,
      privacyConsent: req.body.privacyConsent,
    };

    // Only admin can update these fields
    if (req.user.role === 'admin') {
      Object.assign(updateFields, {
        role: req.body.role,
        isActive: req.body.isActive,
        emailVerified: req.body.emailVerified
      });
    }

    // Remove undefined fields
    Object.keys(updateFields).forEach(key => 
      updateFields[key] === undefined && delete updateFields[key]
    );

    user = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    logger.info(`User updated: ${user.email} by user: ${req.user.email}`);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user'
    });
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has active appointments
    const activeAppointments = await Appointment.countDocuments({
      $or: [
        { patient: req.params.id, status: { $in: ['pending', 'confirmed'] } },
        { doctor: req.params.id, status: { $in: ['pending', 'confirmed'] } }
      ]
    });

    if (activeAppointments > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete user with active appointments'
      });
    }

    await user.deleteOne();

    logger.info(`User deleted: ${user.email} by admin: ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
};

// @desc    Get doctors list
// @route   GET /api/users/doctors
// @access  Public
const getDoctors = async (req, res) => {
  try {
    const { search } = req.query;
    // specialty is not currently used in query but could be used for filtering
    // const { specialty } = req.query;
    let query = { role: 'doctor', isActive: true };

    // Search functionality
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // TODO: Add specialty field to User model if needed
    // if (specialty) {
    //   query.specialty = specialty;
    // }

    const doctors = await User.find(query)
      .select('_id firstName lastName email phone profileImage')
      .sort({ firstName: 1, lastName: 1 });

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors
    });
  } catch (error) {
    logger.error('Get doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching doctors'
    });
  }
};

// @desc    Get user statistics (Admin only)
// @route   GET /api/users/stats
// @access  Private/Admin
const getUserStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: { $cond: ['$isActive', 1, 0] }
          }
        }
      }
    ]);

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const verifiedUsers = await User.countDocuments({ emailVerified: true });

    const statsObject = {
      total: totalUsers,
      active: activeUsers,
      verified: verifiedUsers,
      byRole: {}
    };

    stats.forEach(stat => {
      statsObject.byRole[stat._id] = {
        total: stat.count,
        active: stat.active
      };
    });

    res.status(200).json({
      success: true,
      data: statsObject
    });
  } catch (error) {
    logger.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics'
    });
  }
};

// @desc    Toggle user active status (Admin only)
// @route   PUT /api/users/:id/toggle-status
// @access  Private/Admin
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    logger.info(`User status toggled: ${user.email} to ${user.isActive} by admin: ${req.user.email}`);

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    logger.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling user status'
    });
  }
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getDoctors,
  getUserStats,
  toggleUserStatus
};
