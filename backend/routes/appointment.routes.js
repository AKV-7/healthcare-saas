const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { sendAppointmentConfirmation } = require('../utils/notification');
const { protect, authorizeHospitalManager, authorizeAdminLevel } = require('../middleware/auth');
const { adminLimiter, appointmentSearchLimiter } = require('../middleware/rateLimit');
const fs = require('fs');
const path = require('path');

// Import appointment controller functions
const {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  cancelAppointment
} = require('../controllers/appointment.controller');

// Controller-based routes for full functionality - with admin rate limiter
router.get('/admin', protect, authorizeHospitalManager, adminLimiter, getAppointments);
router.get('/admin/:id', protect, authorizeHospitalManager, adminLimiter, getAppointment);
router.post('/admin', protect, authorizeHospitalManager, adminLimiter, createAppointment);
router.put('/admin/:id', protect, authorizeHospitalManager, adminLimiter, updateAppointment);
router.delete('/admin/:id', protect, authorizeAdminLevel, adminLimiter, deleteAppointment);
router.put('/admin/:id/cancel', protect, authorizeHospitalManager, adminLimiter, cancelAppointment);

// Delete all appointments - requires admin passkey verification
router.delete('/delete-all', protect, authorizeAdminLevel, adminLimiter, async (req, res) => {
  try {
    const { adminPasskey } = req.body;
    
    if (!adminPasskey) {
      return res.status(400).json({
        success: false,
        message: 'Admin passkey is required'
      });
    }
    
    // Read the admin passkey from config file
    const adminPasskeyPath = path.join(__dirname, '../config/admin-passkey.json');
    
    if (!fs.existsSync(adminPasskeyPath)) {
      return res.status(500).json({
        success: false,
        message: 'Admin passkey configuration not found'
      });
    }
    
    const adminPasskeyConfig = JSON.parse(fs.readFileSync(adminPasskeyPath, 'utf8'));
    const storedPasskey = adminPasskeyConfig.passkey;
    
    if (adminPasskey !== storedPasskey) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin passkey'
      });
    }
    
    // Delete all appointments
    const result = await Appointment.deleteMany({});
    
    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} appointments`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting all appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete all appointments',
      error: error.message
    });
  }
});

// Get appointment statistics for admin dashboard - with admin rate limiter
router.get('/stats', protect, authorizeHospitalManager, adminLimiter, async (req, res) => {
  try {
    // Get appointment counts by status
    const totalAppointments = await Appointment.countDocuments();
    const pendingAppointments = await Appointment.countDocuments({ status: 'pending' });
    const confirmedAppointments = await Appointment.countDocuments({ status: 'confirmed' });
    const completedAppointments = await Appointment.countDocuments({ status: 'completed' });
    const cancelledAppointments = await Appointment.countDocuments({ status: 'cancelled' });
    
    // Get appointments from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentAppointments = await Appointment.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Get today's appointments
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const todayAppointments = await Appointment.countDocuments({
      appointmentDate: { $gte: startOfDay, $lt: endOfDay }
    });

    res.json({
      success: true,
      data: {
        total: totalAppointments,
        pending: pendingAppointments,
        confirmed: confirmedAppointments,
        completed: completedAppointments,
        cancelled: cancelledAppointments,
        recent: recentAppointments,
        today: todayAppointments,
        byStatus: {
          pending: pendingAppointments,
          confirmed: confirmedAppointments,
          completed: completedAppointments,
          cancelled: cancelledAppointments
        }
      }
    });
  } catch (error) {
    console.error('Error fetching appointment stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch appointment statistics' 
    });
  }
});

// Frontend-compatible routes (also using controller for email functionality)
router.put('/:id', protect, authorizeHospitalManager, updateAppointment);

// Get appointments by patient name and phone (no authentication required)
// IMPORTANT: This route must come BEFORE the catch-all '/' route
router.get('/by-name-phone', async (req, res) => {
  try {
    const { name, phone } = req.query;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone number are required'
      });
    }

    // Validate phone format
    if (!/^\+91[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Indian mobile number with +91'
      });
    }

    // Find user by name and phone to get their userId
    const user = await User.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      phone: phone.trim(),
      role: 'patient'
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No patient found with the provided name and phone number'
      });
    }

    // Find appointments for this user
    const appointments = await Appointment.find({ 
      userId: user.userId 
    }).sort({ createdAt: -1 });

    if (appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No appointments found for this patient'
      });
    }

    // Transform appointments to match frontend expectations
    const transformedAppointments = appointments.map(appointment => ({
      _id: appointment._id,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      appointmentType: appointment.appointmentType,
      doctor: appointment.doctor,
      symptoms: appointment.symptoms || appointment.reason || 'No symptoms provided',
      status: appointment.status,
      patientName: appointment.patientName || user.name,
      patientEmail: appointment.patientEmail || user.email,
      patientPhone: appointment.patientPhone || user.phone,
      attachments: appointment.attachments || [], // Include medical attachments
      userId: appointment.userId,
      createdAt: appointment.createdAt
    }));

    res.json({
      success: true,
      data: transformedAppointments,
      message: 'Appointments retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching appointments by name and phone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: error.message
    });
  }
});

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
        attachments: appointment.attachments || [], // Include medical attachments
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
      attachments: appointment.attachments || [], // Include medical attachments
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
      attachments: appointment.attachments || [], // Include medical attachments
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

// Debug endpoint to check if appointments exist
router.get('/debug/count', async (req, res) => {
  try {
    const appointmentCount = await Appointment.countDocuments();
    const sampleAppointments = await Appointment.find().limit(3);
    
    res.json({
      success: true,
      data: {
        totalAppointments: appointmentCount,
        sampleAppointments: sampleAppointments.map(apt => ({
          id: apt._id,
          status: apt.status,
          appointmentDate: apt.appointmentDate,
          patientName: apt.patientName,
          createdAt: apt.createdAt
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking appointments',
      error: error.message
    });
  }
});

// Seed sample data for testing (only if no appointments exist)
router.post('/debug/seed', async (req, res) => {
  try {
    const existingCount = await Appointment.countDocuments();
    
    if (existingCount > 0) {
      return res.json({
        success: true,
        message: `${existingCount} appointments already exist. No seeding needed.`
      });
    }

    // Create sample appointments
    const sampleAppointments = [
      {
        patientName: 'John Doe',
        patientEmail: 'john@example.com',
        patientPhone: '+1234567890',
        appointmentDate: new Date(),
        appointmentTime: '10:00 AM',
        appointmentType: 'General Consultation',
        symptoms: 'Regular checkup',
        status: 'pending'
      },
      {
        patientName: 'Jane Smith',
        patientEmail: 'jane@example.com',
        patientPhone: '+1234567891',
        appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        appointmentTime: '2:00 PM',
        appointmentType: 'Follow-up',
        symptoms: 'Follow-up consultation',
        status: 'confirmed'
      },
      {
        patientName: 'Bob Johnson',
        patientEmail: 'bob@example.com',
        patientPhone: '+1234567892',
        appointmentDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        appointmentTime: '9:00 AM',
        appointmentType: 'Urgent Care',
        symptoms: 'Urgent health concern',
        status: 'completed'
      }
    ];

    const created = await Appointment.insertMany(sampleAppointments);
    
    res.json({
      success: true,
      message: `Created ${created.length} sample appointments`,
      data: created
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error seeding data',
      error: error.message
    });
  }
});

module.exports = router;