const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { sendAppointmentConfirmation } = require('../utils/notification');
const { protect, authorizeHospitalManager, authorizeAdminLevel } = require('../middleware/auth');

// Import appointment controller functions
const {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  cancelAppointment
} = require('../controllers/appointment.controller');

// Controller-based routes for full functionality
router.get('/admin', protect, authorizeHospitalManager, getAppointments);
router.get('/admin/:id', protect, authorizeHospitalManager, getAppointment);
router.post('/admin', protect, authorizeHospitalManager, createAppointment);
router.put('/admin/:id', protect, authorizeHospitalManager, updateAppointment);
router.delete('/admin/:id', protect, authorizeAdminLevel, deleteAppointment);
router.put('/admin/:id/cancel', protect, authorizeHospitalManager, cancelAppointment);

// Frontend-compatible routes (also using controller for email functionality)
router.put('/:id', protect, authorizeHospitalManager, updateAppointment);

// Get all appointments (all admin levels can view)
router.get('/', protect, authorizeHospitalManager, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [appointments, total] = await Promise.all([
      Appointment.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Appointment.countDocuments()
    ]);

    // Transform the data to match frontend expectations
    const transformedAppointments = appointments.map(appointment => {
      // Handle both old and new schema formats
      const patientName = appointment.patientName || 'Unknown Patient';
      const patientEmail = appointment.patientEmail || 'unknown@email.com';
      const patientPhone = appointment.patientPhone || 'Unknown Phone';
      return {
        id: appointment._id,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        appointmentType: appointment.appointmentType,
        reason: appointment.symptoms || appointment.reason || 'No reason provided',
        status: appointment.status,
        doctorName: appointment.doctor || 'TBD',
        user: {
          id: appointment.userId || appointment.patient || 'N/A',
          firstName: patientName.split(' ')[0] || patientName,
          lastName: patientName.split(' ').slice(1).join(' ') || '',
          email: patientEmail,
          phone: patientPhone
        },
        createdAt: appointment.createdAt
      };
    });

    res.json({
      data: transformedAppointments,
      total,
      page,
      limit
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Failed to fetch appointments' });
  }
});

// Get appointment by ID (all admin levels can view)
router.get('/:id', protect, authorizeHospitalManager, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Handle both old and new schema formats
    const patientName = appointment.patientName || 'Unknown Patient';
    const patientEmail = appointment.patientEmail || 'unknown@email.com';
    const patientPhone = appointment.patientPhone || 'Unknown Phone';

    // Fetch user data to get dateOfBirth and gender
    let userData = null;
    if (appointment.userId) {
      try {
        userData = await User.findOne({ userId: appointment.userId }).select('dateOfBirth gender');
      } catch (userError) {
        console.warn('Could not fetch user data:', userError.message);
      }
    }

    // Transform the data to match frontend expectations
    const transformedAppointment = {
      id: appointment._id,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      appointmentType: appointment.appointmentType,
      reason: appointment.symptoms || appointment.reason || 'No reason provided',
      status: appointment.status,
      doctorName: appointment.doctor || 'TBD',
      doctor: appointment.doctor,
      user: {
        id: appointment.userId || appointment.patient || 'N/A',
        firstName: patientName.split(' ')[0] || patientName,
        lastName: patientName.split(' ').slice(1).join(' ') || '',
        email: patientEmail,
        phone: patientPhone,
        userId: appointment.userId || appointment.patient,
        dateOfBirth: userData?.dateOfBirth || null,
        gender: userData?.gender || null
      },
      createdAt: appointment.createdAt
    };

    res.json(transformedAppointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ message: 'Failed to fetch appointment' });
  }
});

// Public route to get appointment details by appointment ID and user ID (no authentication required)
router.get('/public/:id', async (req, res) => {
  try {
    const { userId } = req.query;
    const appointmentId = req.params.id;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Verify that the appointment belongs to the specified user
    if (appointment.userId?.toString() !== userId && appointment.patient?.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Handle both old and new schema formats
    const patientName = appointment.patientName || 'Unknown Patient';
    const patientEmail = appointment.patientEmail || 'unknown@email.com';
    const patientPhone = appointment.patientPhone || 'Unknown Phone';

    // Fetch user data to get dateOfBirth and gender
    let userData = null;
    if (appointment.userId) {
      try {
        userData = await User.findOne({ userId: appointment.userId }).select('dateOfBirth gender');
      } catch (userError) {
        console.warn('Could not fetch user data:', userError.message);
      }
    }

    // Transform the data to match frontend expectations
    const transformedAppointment = {
      id: appointment._id,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      appointmentType: appointment.appointmentType,
      reason: appointment.symptoms || appointment.reason || 'No reason provided',
      status: appointment.status,
      doctorName: appointment.doctor || 'TBD',
      doctor: appointment.doctor,
      user: {
        id: appointment.userId || appointment.patient || 'N/A',
        firstName: patientName.split(' ')[0] || patientName,
        lastName: patientName.split(' ').slice(1).join(' ') || '',
        email: patientEmail,
        phone: patientPhone,
        userId: appointment.userId || appointment.patient,
        dateOfBirth: userData?.dateOfBirth || null,
        gender: userData?.gender || null
      },
      createdAt: appointment.createdAt
    };

    res.json(transformedAppointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ message: 'Failed to fetch appointment' });
  }
});

// Register user and create appointment in one request
router.post('/register-appointment', async (req, res) => {
  try {
    const { user, appointment } = req.body;

    // Validate required fields
    if (!user || !appointment) {
      return res.status(400).json({ message: 'User and appointment data are required' });
    }

    // Check if user already exists by email
    let existingUser = await User.findOne({ email: user.email });
    
    if (!existingUser) {
      // Create new user
      existingUser = new User({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        role: 'patient'
      });
      await existingUser.save();
    }

    // Create appointment
    const newAppointment = new Appointment({
      userId: existingUser._id,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      appointmentType: appointment.appointmentType,
      reason: appointment.reason,
      notes: appointment.notes,
      status: 'pending'
    });

    await newAppointment.save();

    // Send confirmation email
    try {
      // Create a mock doctor object since we don't have doctor data in this route
      const mockDoctor = {
        firstName: appointment.appointmentType?.split(' ')[1] || 'Doctor',
        lastName: appointment.appointmentType?.split(' ')[0] || 'Unknown'
      };
      await sendAppointmentConfirmation(newAppointment, existingUser, mockDoctor);
    } catch (emailError) {
      console.warn(`Failed to send confirmation email: ${emailError.message}`);
    }

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointmentId: newAppointment._id,
      userId: existingUser._id
    });

  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ message: 'Failed to create appointment' });
  }
});

// Update appointment date, time and status (all admin levels can update)
router.patch('/:id', protect, authorizeHospitalManager, async (req, res) => {
  try {
    const updateFields = {};
    if (req.body.appointmentDate) updateFields.appointmentDate = req.body.appointmentDate;
    if (req.body.appointmentTime) updateFields.appointmentTime = req.body.appointmentTime;
    if (req.body.status) updateFields.status = req.body.status;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided for update' });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Fetch user data to get dateOfBirth and gender
    let userData = null;
    if (appointment.userId) {
      try {
        userData = await User.findOne({ userId: appointment.userId }).select('dateOfBirth gender');
      } catch (userError) {
        console.warn('Could not fetch user data:', userError.message);
      }
    }

    // Handle both old and new schema formats
    const patientName = appointment.patientName || 'Unknown Patient';
    const patientEmail = appointment.patientEmail || 'unknown@email.com';
    const patientPhone = appointment.patientPhone || 'Unknown Phone';

    // Transform the data to match frontend expectations (same as GET endpoint)
    const transformedAppointment = {
      id: appointment._id,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      appointmentType: appointment.appointmentType,
      reason: appointment.symptoms || appointment.reason || 'No reason provided',
      status: appointment.status,
      doctorName: appointment.doctor || 'TBD',
      doctor: appointment.doctor,
      user: {
        id: appointment.userId || appointment.patient || 'N/A',
        firstName: patientName.split(' ')[0] || patientName,
        lastName: patientName.split(' ').slice(1).join(' ') || '',
        email: patientEmail,
        phone: patientPhone,
        userId: appointment.userId || appointment.patient,
        dateOfBirth: userData?.dateOfBirth || null,
        gender: userData?.gender || null
      },
      createdAt: appointment.createdAt
    };

    // Send email notification to user about the update
    try {
      const user = await User.findOne({ userId: appointment.userId });
      if (user) {
        // Create a mock doctor object since we don't have doctor data in this route
        const mockDoctor = {
          firstName: appointment.appointmentType?.split(' ')[1] || 'Doctor',
          lastName: appointment.appointmentType?.split(' ')[0] || 'Unknown'
        };
        
        // Send appointment update notification
        await sendAppointmentConfirmation(appointment, user, mockDoctor);
      }
    } catch (emailError) {
      console.warn(`Failed to send appointment update notification: ${emailError.message}`);
    }

    res.json(transformedAppointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ message: 'Failed to update appointment' });
  }
});

// Delete appointment (only admin and super_admin can delete)
router.delete('/:id', protect, authorizeAdminLevel, async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ message: 'Failed to delete appointment' });
  }
});

// Book appointment
router.post('/book', async (req, res) => {
  try {
    const {
      userId,
      appointmentDate,
      appointmentTime,
      doctor,
      appointmentType,
      symptoms,
      additionalNotes,
      patientName,
      patientEmail,
      patientPhone,
      userData, // New field for temporary user data
      isTempUser // Flag to indicate if this is a temporary user
    } = req.body;


    // Validate required fields
    if (!userId || !appointmentDate || !appointmentTime || !doctor || !appointmentType || !symptoms) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    let finalUserId = userId;
    let createdUser = null;

    // If this is a temporary user, create the actual user account first
    if (isTempUser && userData) {
      try {
        // Check if user already exists by email
        const existingUser = await User.findOne({ email: userData.email });
        
        if (existingUser) {
          // Use existing user
          finalUserId = existingUser.userId;
          createdUser = existingUser;
        } else {
          // Create new user account
          const newUser = new User({
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            phone: userData.phone,
            dateOfBirth: userData.dateOfBirth,
            gender: userData.gender,
            role: 'patient',
            emailVerified: true, // Auto-verify for simplified app
            password: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) // Generate random password
          });
          
          await newUser.save();
          finalUserId = newUser.userId; // Use the generated 8-digit userId
          createdUser = newUser;
        }
      } catch (userError) {
        console.error('Error creating user account:', userError);
        return res.status(500).json({
          success: false,
          message: 'Failed to create user account',
          error: userError.message
        });
      }
    }

    // Create appointment
    const appointment = new Appointment({
      userId: finalUserId, // Use the final userId (either existing or newly created)
      appointmentDate,
      appointmentTime,
      doctor,
      appointmentType,
      symptoms,
      additionalNotes,
      patientName,
      patientEmail,
      patientPhone,
      status: 'pending'
    });

    await appointment.save();


    // Send confirmation email if user was created
    if (createdUser) {
      try {
        const mockDoctor = {
          firstName: doctor.split(' ')[1] || 'Doctor',
          lastName: doctor.split(' ')[0] || 'Unknown'
        };
        await sendAppointmentConfirmation(appointment, createdUser, mockDoctor);
      } catch (emailError) {
        console.warn(`Failed to send confirmation email: ${emailError.message}`);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment: {
        _id: appointment._id,
        userId: appointment.userId,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        doctor: appointment.doctor,
        appointmentType: appointment.appointmentType,
        status: appointment.status
      },
      user: createdUser ? {
        id: createdUser._id,
        userId: createdUser.userId,
        email: createdUser.email,
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
        role: createdUser.role,
        phone: createdUser.phone,
        dateOfBirth: createdUser.dateOfBirth,
        gender: createdUser.gender
      } : undefined
    });

  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to book appointment',
      error: error.message
    });
  }
});

// Get appointment by ID and userId
router.get('/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { userId } = req.query;


    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      userId: userId
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      appointment: {
        _id: appointment._id,
        userId: appointment.userId,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        doctor: appointment.doctor,
        appointmentType: appointment.appointmentType,
        symptoms: appointment.symptoms,
        additionalNotes: appointment.additionalNotes,
        patientName: appointment.patientName,
        patientEmail: appointment.patientEmail,
        patientPhone: appointment.patientPhone,
        status: appointment.status,
        createdAt: appointment.createdAt
      }
    });

  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointment',
      error: error.message
    });
  }
});

// Get all appointments for a user by userId and phone
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { phone } = req.query;

    // Input validation
    if (!userId || !phone) {
      return res.status(400).json({
        success: false,
        message: 'User ID and phone number are required'
      });
    }

    // Validate userId format (8 digits)
    if (!/^\d{8}$/.test(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid User ID format. Must be exactly 8 digits.'
      });
    }

    // Validate phone number format (Indian numbers)
    const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format. Please enter a valid Indian phone number.'
      });
    }


    // First, let's see what appointments exist for this userId
    const allUserAppointments = await Appointment.find({ userId: userId });
    
    if (allUserAppointments.length > 0) {
      allUserAppointments.forEach((_apt, _index) => {
      });
    }

    // Try to match with different phone formats
    let appointments = await Appointment.find({
      userId: userId,
      patientPhone: phone
    }).sort({ createdAt: -1 }); // Sort by creation date, latest first

    // If no exact match, try with +91 prefix
    if (appointments.length === 0 && !phone.startsWith('+91')) {
      appointments = await Appointment.find({
        userId: userId,
        patientPhone: `+91${phone}`
      }).sort({ createdAt: -1 }); // Sort by creation date, latest first
    }

    // If still no match, try without +91 prefix
    if (appointments.length === 0 && phone.startsWith('+91')) {
      appointments = await Appointment.find({
        userId: userId,
        patientPhone: phone.replace('+91', '')
      }).sort({ createdAt: -1 }); // Sort by creation date, latest first
    }


    // Set security headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
    });

    res.json({
      success: true,
      appointments: appointments.map(appointment => ({
        _id: appointment._id,
        userId: appointment.userId,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        doctor: appointment.doctor,
        appointmentType: appointment.appointmentType,
        symptoms: appointment.symptoms,
        additionalNotes: appointment.additionalNotes,
        patientName: appointment.patientName,
        patientEmail: appointment.patientEmail,
        patientPhone: appointment.patientPhone,
        status: appointment.status,
        createdAt: appointment.createdAt
      }))
    });

  } catch (error) {
    console.error('Error fetching user appointments:', error);
    
    // Set security headers even for errors
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block'
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

// Get all appointments (for debugging)
router.get('/debug/all', async (req, res) => {
  try {
    const appointments = await Appointment.find({}).sort({ createdAt: -1 });
    
    
    res.json({
      success: true,
      count: appointments.length,
      appointments: appointments.map(appointment => ({
        _id: appointment._id,
        userId: appointment.userId,
        patientName: appointment.patientName,
        patientPhone: appointment.patientPhone,
        appointmentDate: appointment.appointmentDate,
        status: appointment.status,
        createdAt: appointment.createdAt
      }))
    });

  } catch (error) {
    console.error('Error fetching all appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: error.message
    });
  }
});

module.exports = router;