// Twilio is commented out as it's not currently being used
// const twilio = require('twilio');
const nodemailer = require('nodemailer');
const { logger } = require('./logger');

// Initialize Twilio client (optional - only if credentials are provided)
// Not currently used in the application
// const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
//   ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
//   : null;

// Initialize email transporter (only if credentials are provided)
let emailTransporter = null;

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Verify email configuration
  emailTransporter.verify((error, _success) => {
    if (error) {
      logger.error('Email configuration error:', error);
    } else {
      logger.info('Email server is ready to send messages');
    }
  });
} else if (process.env.BREVO_API_KEY && process.env.BREVO_SENDER) {
  // Brevo API is configured
  logger.info('Email configured via Brevo API - ready to send messages');
} else {
  logger.warn('Email not configured - notifications will be logged only');
}

class NotificationService {
  /**
   * Send SMS notification (optional - only if Twilio is configured)
   * @param {string} to - Phone number to send to
   * @param {string} message - Message content
   */
  static async sendSMS(to, message) {
    // Remove or comment out all SMS-related logic
    // Comment out sendSMS method and any calls to it in notification methods
    logger.info(`SMS not configured, logging message instead: ${message}`);
    return { success: true, message: 'SMS logged (Twilio not configured)' };
  }

  /**
   * Send email notification
   * @param {string} to - Email address to send to
   * @param {string} subject - Email subject
   * @param {string} html - Email HTML content
   * @param {string} type - Type of notification
   */
  static async sendEmail(to, subject, html, type = 'general') {
    if (!emailTransporter) {
      logger.info(`Email not configured, logging instead: ${subject} to ${to}`);
      return { success: true, message: 'Email logged (SMTP not configured)' };
    }

    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: to,
        subject: subject,
        html: html
      };

      const result = await emailTransporter.sendMail(mailOptions);

      logger.info(`Email sent successfully to ${to}`, {
        type,
        messageId: result.messageId
      });

      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      logger.error('Email sending failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send appointment confirmation notification
   * @param {Object} appointment - Appointment object
   * @param {Object} patient - Patient object
   * @param {Object} doctor - Doctor object
   */
  static async sendAppointmentConfirmation(appointment, patient, doctor) {
    const appointmentDate = new Date(appointment.appointmentDate).toLocaleDateString();
    const appointmentTime = appointment.appointmentTime;

    // SMS notification (optional)
    const smsMessage = `Your appointment with Dr. ${doctor.lastName} has been confirmed for ${appointmentDate} at ${appointmentTime}. Please arrive 15 minutes early. Reply STOP to unsubscribe.`;
    
    if (patient.phone) {
      await this.sendSMS(patient.phone, smsMessage, 'appointment_confirmation');
    }

    // Email notification (primary)
    const emailSubject = 'Appointment Confirmation - Healthcare System';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #24AE7C;">Appointment Confirmed</h2>
        <p>Dear ${patient.firstName} ${patient.lastName},</p>
        <p>Your appointment has been successfully confirmed with the following details:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Doctor:</strong> Dr. ${doctor.firstName} ${doctor.lastName}</p>
          <p><strong>Date:</strong> ${appointmentDate}</p>
          <p><strong>Time:</strong> ${appointmentTime}</p>
          <p><strong>Duration:</strong> ${appointment.duration} minutes</p>
          <p><strong>Type:</strong> ${appointment.appointmentType}</p>
          <p><strong>Reason:</strong> ${appointment.reason}</p>
        </div>
        <p><strong>Important:</strong> Please arrive 15 minutes before your scheduled appointment time.</p>
        <p>If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
        <p>Best regards,<br>Healthcare Team</p>
      </div>
    `;

    await this.sendEmail(patient.email, emailSubject, emailHtml, 'appointment_confirmation');
  }

  /**
   * Send appointment reminder notification
   * @param {Object} appointment - Appointment object
   * @param {Object} patient - Patient object
   * @param {Object} doctor - Doctor object
   */
  static async sendAppointmentReminder(appointment, patient, doctor) {
    const appointmentDate = new Date(appointment.appointmentDate).toLocaleDateString();
    const appointmentTime = appointment.appointmentTime;

    // SMS reminder (optional)
    const smsMessage = `Reminder: You have an appointment with Dr. ${doctor.lastName} tomorrow at ${appointmentTime}. Please confirm by replying YES or cancel by calling us.`;
    
    if (patient.phone) {
      await this.sendSMS(patient.phone, smsMessage, 'appointment_reminder');
    }

    // Email reminder (primary)
    const emailSubject = 'Appointment Reminder - Tomorrow';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #24AE7C;">Appointment Reminder</h2>
        <p>Dear ${patient.firstName} ${patient.lastName},</p>
        <p>This is a friendly reminder about your upcoming appointment:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Doctor:</strong> Dr. ${doctor.firstName} ${doctor.lastName}</p>
          <p><strong>Date:</strong> ${appointmentDate}</p>
          <p><strong>Time:</strong> ${appointmentTime}</p>
          <p><strong>Duration:</strong> ${appointment.duration} minutes</p>
        </div>
        <p>Please arrive 15 minutes before your scheduled time.</p>
        <p>If you need to reschedule or cancel, please contact us immediately.</p>
        <p>Best regards,<br>Healthcare Team</p>
      </div>
    `;

    await this.sendEmail(patient.email, emailSubject, emailHtml, 'appointment_reminder');
  }

  /**
   * Send appointment cancellation notification
   * @param {Object} appointment - Appointment object
   * @param {Object} patient - Patient object
   * @param {Object} doctor - Doctor object
   * @param {string} reason - Cancellation reason
   */
  static async sendAppointmentCancellation(appointment, patient, doctor, reason) {
    const appointmentDate = new Date(appointment.appointmentDate).toLocaleDateString();
    const appointmentTime = appointment.appointmentTime;

    // SMS cancellation (optional)
    const smsMessage = `Your appointment with Dr. ${doctor.lastName} on ${appointmentDate} at ${appointmentTime} has been cancelled. Reason: ${reason}. Please call us to reschedule.`;
    
    if (patient.phone) {
      await this.sendSMS(patient.phone, smsMessage, 'appointment_cancellation');
    }

    // Email cancellation (primary)
    const emailSubject = 'Appointment Cancelled';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #F37877;">Appointment Cancelled</h2>
        <p>Dear ${patient.firstName} ${patient.lastName},</p>
        <p>Your appointment has been cancelled with the following details:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Doctor:</strong> Dr. ${doctor.firstName} ${doctor.lastName}</p>
          <p><strong>Date:</strong> ${appointmentDate}</p>
          <p><strong>Time:</strong> ${appointmentTime}</p>
          <p><strong>Reason for cancellation:</strong> ${reason}</p>
        </div>
        <p>Please contact us to reschedule your appointment at your convenience.</p>
        <p>We apologize for any inconvenience this may cause.</p>
        <p>Best regards,<br>Healthcare Team</p>
      </div>
    `;

    await this.sendEmail(patient.email, emailSubject, emailHtml, 'appointment_cancellation');
  }

  /**
   * Send welcome email to new patients
   * @param {Object} patient - Patient object
   */
  static async sendWelcomeEmail(patient) {
    const emailSubject = 'Welcome to Our Healthcare System';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #24AE7C;">Welcome to Our Healthcare Family!</h2>
        <p>Dear ${patient.firstName} ${patient.lastName},</p>
        <p>Thank you for choosing our healthcare system. We're excited to have you as part of our patient family!</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>What you can do with our system:</h3>
          <ul>
            <li>Book appointments with our qualified doctors</li>
            <li>View your medical history and appointments</li>
            <li>Receive appointment reminders via email</li>
            <li>Access your prescriptions and medical records</li>
            <li>Communicate with your healthcare providers</li>
          </ul>
        </div>
        <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
        <p>Best regards,<br>Healthcare Team</p>
      </div>
    `;

    await this.sendEmail(patient.email, emailSubject, emailHtml, 'welcome');
  }

  /**
   * Send password reset email
   * @param {string} email - User email
   * @param {string} resetToken - Password reset token
   * @param {string} resetUrl - Password reset URL
   */
  static async sendPasswordResetEmail(email, resetToken, resetUrl) {
    const emailSubject = 'Password Reset Request';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #24AE7C;">Password Reset Request</h2>
        <p>You requested a password reset for your healthcare account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #24AE7C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p><strong>This link will expire in 10 minutes.</strong></p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>Best regards,<br>Healthcare Team</p>
      </div>
    `;

    await this.sendEmail(email, emailSubject, emailHtml, 'password_reset');
  }

  /**
   * Send appointment status change notification
   * @param {Object} appointment - Appointment object
   * @param {Object} patient - Patient object
   * @param {Object} doctor - Doctor object
   * @param {string} oldStatus - Previous status
   * @param {string} newStatus - New status
   */
  static async sendAppointmentStatusChange(appointment, patient, doctor, oldStatus, newStatus) {
    const appointmentDate = new Date(appointment.appointmentDate).toLocaleDateString();
    const appointmentTime = appointment.appointmentTime;

    // SMS notification (optional)
    const smsMessage = `Your appointment with Dr. ${doctor.lastName} on ${appointmentDate} at ${appointmentTime} has been updated from ${oldStatus} to ${newStatus}. Please check your email for details.`;
    
    if (patient.phone) {
      await this.sendSMS(patient.phone, smsMessage, 'appointment_status_change');
    }

    // Email notification (primary)
    const emailSubject = `Appointment Status Updated - ${newStatus.toUpperCase()}`;
    
    // Create status-specific message
    let statusMessage = '';
    let actionRequired = '';
    
    switch (newStatus) {
      case 'confirmed':
        statusMessage = 'Your appointment has been confirmed by the doctor.';
        actionRequired = 'Please arrive 15 minutes before your scheduled appointment time.';
        break;
      case 'completed':
        statusMessage = 'Your appointment has been marked as completed.';
        actionRequired = 'Thank you for visiting us. We hope you had a great experience.';
        break;
      case 'cancelled':
        statusMessage = 'Your appointment has been cancelled.';
        actionRequired = 'Please contact us to reschedule your appointment if needed.';
        break;
      case 'no-show':
        statusMessage = 'Your appointment has been marked as no-show.';
        actionRequired = 'Please contact us to reschedule your appointment.';
        break;
      default:
        statusMessage = `Your appointment status has been updated to ${newStatus}.`;
        actionRequired = 'Please check with us for any specific instructions.';
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #24AE7C;">Appointment Status Updated</h2>
        <p>Dear ${patient.firstName} ${patient.lastName},</p>
        <p>${statusMessage}</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Doctor:</strong> Dr. ${doctor.firstName} ${doctor.lastName}</p>
          <p><strong>Date:</strong> ${appointmentDate}</p>
          <p><strong>Time:</strong> ${appointmentTime}</p>
          <p><strong>Previous Status:</strong> <span style="color: #666;">${oldStatus}</span></p>
          <p><strong>New Status:</strong> <span style="color: #24AE7C; font-weight: bold;">${newStatus}</span></p>
          <p><strong>Type:</strong> ${appointment.appointmentType}</p>
          <p><strong>Reason:</strong> ${appointment.reason || appointment.symptoms || 'Not specified'}</p>
        </div>
        <p><strong>Action Required:</strong> ${actionRequired}</p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br>Healthcare Team</p>
      </div>
    `;

    await this.sendEmail(patient.email, emailSubject, emailHtml, 'appointment_status_change');
  }
}

module.exports = NotificationService; 