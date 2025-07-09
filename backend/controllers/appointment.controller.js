const Appointment = require('../models/Appointment');
const User = require('../models/User');
const NotificationService = require('../utils/notification');
const { logger } = require('../utils/logger');
const realtimeService = require('../utils/realtime');
const { sendMail } = require('../utils/email');
const emailTemplates = require('../utils/emailTemplates');

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res) => {
  try {
    let query = {};
    const { status, date, doctorId, patientId, page = 1, limit = 10 } = req.query;

    // Role-based filtering
    if (req.user.role === 'patient') {
      query.userId = req.user.id;
    } else if (req.user.role === 'doctor') {
      query.doctor = req.user.id;
    }
    // Admin can see all appointments

    // Apply filters
    if (status) {
      query.status = status;
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.appointmentDate = {
        $gte: startDate,
        $lt: endDate
      };
    }

    if (doctorId && doctorId !== '' && req.user.role === 'admin') {
      query.doctor = doctorId;
    }

    if (patientId && patientId !== '' && (req.user.role === 'admin' || req.user.role === 'doctor')) {
      query.userId = patientId;
    }

    const skip = (page - 1) * limit;

    const appointments = await Appointment.find(query)
      .sort({ createdAt: -1 }) // Sort by creation date, latest first
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(query);

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
        reason: appointment.symptoms || 'No reason provided',
        status: appointment.status,
        doctorName: appointment.doctor || 'TBD',
        attachments: appointment.attachments || [], // Include medical attachments
        user: {
          id: appointment.userId || 'N/A',
          firstName: patientName.split(' ')[0] || patientName,
          lastName: patientName.split(' ').slice(1).join(' ') || '',
          email: patientEmail,
          phone: patientPhone
        },
        createdAt: appointment.createdAt
      };
    });

    res.status(200).json({
      success: true,
      count: transformedAppointments.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      data: transformedAppointments
    });
  } catch (error) {
    logger.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments'
    });
  }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
const getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check access permissions
    const isOwner = appointment.userId === req.user.id || 
                   appointment.doctor === req.user.id;
    
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this appointment'
      });
    }

    // Transform the data to match frontend expectations
    const patientName = appointment.patientName || 'Unknown Patient';
    const patientEmail = appointment.patientEmail || 'unknown@email.com';
    const patientPhone = appointment.patientPhone || 'Unknown Phone';
    
    const transformedAppointment = {
      id: appointment._id,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      appointmentType: appointment.appointmentType,
      reason: appointment.symptoms || 'No reason provided',
      status: appointment.status,
      doctorName: appointment.doctor || 'TBD',
      attachments: appointment.attachments || [], // Include medical attachments
      user: {
        id: appointment.userId || 'N/A',
        firstName: patientName.split(' ')[0] || patientName,
        lastName: patientName.split(' ').slice(1).join(' ') || '',
        email: patientEmail,
        phone: patientPhone
      },
      createdAt: appointment.createdAt
    };

    res.status(200).json({
      success: true,
      data: transformedAppointment
    });
  } catch (error) {
    logger.error('Get appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointment'
    });
  }
};

// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Private
const createAppointment = async (req, res) => {
  try {
    const {
      doctorId,
      appointmentDate,
      appointmentTime,
      duration,
      appointmentType,
      reason,
      symptoms,
      notes
    } = req.body;

    // Validate required fields
    if (!doctorId || !appointmentDate || !appointmentTime || !appointmentType || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if doctor exists and is a doctor
    if (!doctorId || typeof doctorId !== 'string' || doctorId.length !== 24) {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor ID provided'
      });
    }

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor selected'
      });
    }

    // Check for appointment conflicts
    const appointmentDateObj = new Date(appointmentDate);
    // Calculate end time (commented out as not currently used)
    // const endTime = new Date(appointmentDateObj.getTime() + (duration || 30) * 60000);

    const conflictingAppointment = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: appointmentDateObj,
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        {
          appointmentTime: appointmentTime
        },
        {
          $and: [
            { appointmentTime: { $lt: appointmentTime } },
            {
              appointmentTime: {
                $gte: new Date(new Date(appointmentTime).getTime() - (duration || 30) * 60000).toTimeString().slice(0, 5)
              }
            }
          ]
        }
      ]
    });

    if (conflictingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'Doctor has a conflicting appointment at this time'
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      patient: req.user.id,
      doctor: doctorId,
      appointmentDate: appointmentDateObj,
      appointmentTime,
      duration,
      appointmentType,
      reason,
      symptoms,
      notes
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'firstName lastName email phone');

    logger.info(`New appointment created: ${appointment._id} by patient: ${req.user.email}`);

    // Send real-time notification
    realtimeService.sendAppointmentNotification(populatedAppointment, 'created');

    // Send booking confirmation email to patient
    try {
      const emailContent = emailTemplates.bookingConfirmed({
        user: populatedAppointment.patient,
        appointment: {
          date: appointmentDateObj.toLocaleDateString(),
          time: appointmentTime,
          type: appointmentType,
          doctorName: `${doctor.firstName} ${doctor.lastName}`,
          location: doctor.clinicAddress || 'Clinic'
        }
      });
      await sendMail({
        to: populatedAppointment.patient.email,
        subject: emailContent.subject,
        html: emailContent.html
      });
    } catch (err) {
      logger.error('Failed to send booking confirmation email:', err.message);
    }

    // Send notification to doctor
    if (doctor.email) {
      await NotificationService.sendEmail(
        doctor.email,
        'New Appointment Request',
        `
        <h3>New Appointment Request</h3>
        <p>You have a new appointment request from ${populatedAppointment.patient.name}.</p>
        <p><strong>Date:</strong> ${appointmentDateObj.toLocaleDateString()}</p>
        <p><strong>Time:</strong> ${appointmentTime}</p>
        <p><strong>Type:</strong> ${appointmentType}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        `,
        'new_appointment'
      );
    }

    res.status(201).json({
      success: true,
      data: populatedAppointment
    });
  } catch (error) {
    logger.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating appointment'
    });
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check access permissions - only admins can update appointments for now
    if (req.user.role !== 'admin' && req.user.role !== 'hospital_manager' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this appointment'
      });
    }

    const {
      appointmentDate,
      appointmentTime,
      duration,
      appointmentType,
      reason,
      symptoms,
      notes,
      doctorNotes,
      status,
      prescription
    } = req.body;

    // Update fields
    if (appointmentDate) appointment.appointmentDate = appointmentDate;
    if (appointmentTime) appointment.appointmentTime = appointmentTime;
    if (duration) appointment.duration = duration;
    if (appointmentType) appointment.appointmentType = appointmentType;
    if (reason) appointment.reason = reason;
    if (symptoms) appointment.symptoms = symptoms;
    if (notes) appointment.notes = notes;
    if (doctorNotes) appointment.doctorNotes = doctorNotes;
    if (prescription) appointment.prescription = prescription;

    // Handle status changes and send appropriate emails
    if (status && status !== appointment.status) {
      const oldStatus = appointment.status;
      appointment.status = status;

      // Prepare user object from appointment data
      const user = {
        name: appointment.patientName,
        email: appointment.patientEmail,
        phone: appointment.patientPhone
      };

      // Prepare appointment data for email templates
      const appointmentData = {
        date: appointment.appointmentDate.toLocaleDateString(),
        time: appointment.appointmentTime,
        type: appointment.appointmentType,
        doctorName: appointment.doctor,
        location: 'Khushi Homoeopathic Clinic'
      };

      // Send status update email for all status changes
      try {
        const emailContent = emailTemplates.appointmentStatusUpdate({
          user,
          appointment: appointmentData,
          status: status,
          oldStatus: oldStatus
        });
        
        await sendMail({
          to: appointment.patientEmail,
          subject: emailContent.subject,
          text: `Your appointment status has been updated to: ${status}`,
          html: emailContent.html
        });
        
        logger.info(`Status update email sent to: ${appointment.patientEmail} (${oldStatus} -> ${status})`);
      } catch (err) {
        logger.error('Failed to send status update email:', err.message);
        // Don't throw error to prevent the status update from failing
      }

      // Handle date/time changes for rescheduling emails
      if (
        (appointmentDate && appointmentDate !== appointment.appointmentDate.toISOString()) ||
        (appointmentTime && appointmentTime !== appointment.appointmentTime)
      ) {
        // Send booking rescheduled email to patient
        try {
          const oldAppointmentData = {
            date: appointment.appointmentDate.toLocaleDateString(),
            time: appointment.appointmentTime
          };
          
          const emailContent = emailTemplates.bookingRescheduled({
            user,
            appointment: appointmentData,
            oldAppointment: oldAppointmentData
          });
          await sendMail({
            to: appointment.patientEmail,
            subject: emailContent.subject,
            html: emailContent.html
          });
          logger.info(`Booking rescheduled email sent to: ${appointment.patientEmail}`);
        } catch (err) {
          logger.error('Failed to send booking rescheduled email:', err.message);
        }
      }
    }

    await appointment.save();

    logger.info(`Appointment updated: ${appointment._id} by user: ${req.user.email}`);

    // Send real-time notification
    realtimeService.sendAppointmentNotification(appointment, 'updated');

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    logger.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating appointment'
    });
  }
};

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private
const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'firstName lastName email phone')
      .populate('doctor', 'firstName lastName email phone');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check access permissions
    const isOwner = appointment.patient._id.toString() === req.user.id || 
                   appointment.doctor._id.toString() === req.user.id;
    
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this appointment'
      });
    }

    // Send cancellation notification if appointment was confirmed
    if (appointment.status === 'confirmed' || appointment.status === 'pending') {
      await NotificationService.sendAppointmentCancellation(
        appointment,
        appointment.patient,
        appointment.doctor,
        'Appointment deleted by user'
      );
    }

    await Appointment.findByIdAndDelete(req.params.id);

    logger.info(`Appointment deleted: ${req.params.id} by user: ${req.user.email}`);

    // Send real-time notification
    realtimeService.sendAppointmentNotification(appointment, 'deleted');

    res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    logger.error('Delete appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting appointment'
    });
  }
};

// @desc    Cancel appointment
// @route   PUT /api/appointments/:id/cancel
// @access  Private
const cancelAppointment = async (req, res) => {
  try {
    const { reason } = req.body;

    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'firstName lastName email phone')
      .populate('doctor', 'firstName lastName email phone');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check access permissions
    const isOwner = appointment.patient._id.toString() === req.user.id || 
                   appointment.doctor._id.toString() === req.user.id;
    
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this appointment'
      });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Appointment is already cancelled'
      });
    }

    if (appointment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed appointment'
      });
    }

    // Cancel appointment
    appointment.status = 'cancelled';
    appointment.cancelledBy = {
      user: req.user.id,
      reason: reason || 'No reason provided',
      cancelledAt: new Date()
    };

    await appointment.save();

    logger.info(`Appointment cancelled: ${appointment._id} by user: ${req.user.email}`);

    // Send cancellation notification
    await NotificationService.sendAppointmentCancellation(
      appointment,
      appointment.patient,
      appointment.doctor,
      reason || 'No reason provided'
    );

    // Send booking cancelled email to patient
    try {
      const emailContent = emailTemplates.bookingCancelled({
        user: appointment.patient,
        appointment: {
          date: appointment.appointmentDate.toLocaleDateString(),
          time: appointment.appointmentTime,
          type: appointment.appointmentType,
          doctorName: `${appointment.doctor.firstName} ${appointment.doctor.lastName}`
        }
      });
      await sendMail({
        to: appointment.patient.email,
        subject: emailContent.subject,
        html: emailContent.html
      });
    } catch (err) {
      logger.error('Failed to send booking cancelled email:', err.message);
    }

    // Send real-time notification
    realtimeService.sendAppointmentNotification(appointment, 'cancelled');

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    logger.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling appointment'
    });
  }
};

// @desc    Get appointment statistics
// @route   GET /api/appointments/stats
// @access  Private/Admin/Doctor
const getAppointmentStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = {};
    
    // Role-based filtering
    if (req.user.role === 'doctor') {
      query.doctor = req.user.id;
    } else if (req.user.role === 'patient') {
      query.patient = req.user.id;
    }

    // Date range filtering
    if (startDate && endDate) {
      query.appointmentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const [
      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments,
      todayAppointments,
      thisWeekAppointments
    ] = await Promise.all([
      Appointment.countDocuments(query),
      Appointment.countDocuments({ ...query, status: 'pending' }),
      Appointment.countDocuments({ ...query, status: 'confirmed' }),
      Appointment.countDocuments({ ...query, status: 'completed' }),
      Appointment.countDocuments({ ...query, status: 'cancelled' }),
      Appointment.countDocuments({
        ...query,
        appointmentDate: {
          $gte: new Date().setHours(0, 0, 0, 0),
          $lt: new Date().setHours(23, 59, 59, 999)
        }
      }),
      Appointment.countDocuments({
        ...query,
        appointmentDate: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          $lte: new Date()
        }
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalAppointments,
        pending: pendingAppointments,
        confirmed: confirmedAppointments,
        completed: completedAppointments,
        cancelled: cancelledAppointments,
        today: todayAppointments,
        thisWeek: thisWeekAppointments
      }
    });
  } catch (error) {
    logger.error('Get appointment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointment statistics'
    });
  }
};

module.exports = {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  cancelAppointment,
  getAppointmentStats
}; 