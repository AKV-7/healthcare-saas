const express = require('express');
const { body, query } = require('express-validator');
const PaymentService = require('../utils/payment');
const NotificationService = require('../utils/notification');
const { protect, authorize } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const { logger } = require('../utils/logger');

const router = express.Router();

// Validation middleware
const validatePaymentIntent = [
  body('appointmentId')
    .isMongoId()
    .withMessage('Valid appointment ID is required'),
  body('customerEmail')
    .isEmail()
    .withMessage('Valid customer email is required'),
  body('customerName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Customer name must be between 2 and 100 characters')
];

const validatePaymentConfirmation = [
  body('paymentIntentId')
    .notEmpty()
    .withMessage('Payment intent ID is required')
];

// @desc    Create payment intent for appointment
// @route   POST /api/payments/create-intent
// @access  Private
router.post('/create-intent', protect, validatePaymentIntent, async (req, res) => {
  try {
    const { appointmentId, customerEmail, customerName } = req.body;

    // Get appointment details
    const appointment = await Appointment.findById(appointmentId)
      .populate('patient doctor', 'firstName lastName email phone');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if user has permission to pay for this appointment
    if (req.user.role === 'patient' && appointment.patient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to pay for this appointment'
      });
    }

    // Calculate appointment cost if not set
    if (!appointment.amount) {
      appointment.amount = PaymentService.calculateAppointmentCost(
        appointment.appointmentType,
        appointment.duration
      );
      await appointment.save();
    }

    // Create payment intent
    const result = await PaymentService.createPaymentIntent(
      appointment,
      customerEmail,
      customerName
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        data: {
          clientSecret: result.clientSecret,
          paymentIntentId: result.paymentIntentId,
          amount: result.amount,
          appointment: {
            id: appointment._id,
            type: appointment.appointmentType,
            date: appointment.appointmentDate,
            time: appointment.appointmentTime,
            doctor: `${appointment.doctor.firstName} ${appointment.doctor.lastName}`
          }
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    logger.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment intent'
    });
  }
});

// @desc    Confirm payment
// @route   POST /api/payments/confirm
// @access  Private
router.post('/confirm', protect, validatePaymentConfirmation, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    // Confirm payment
    const result = await PaymentService.confirmPayment(paymentIntentId);

    if (result.success) {
      // Update appointment payment status
      const appointmentId = result.paymentIntent.metadata.appointmentId;
      const appointment = await Appointment.findById(appointmentId)
        .populate('patient doctor', 'firstName lastName email phone');

      if (appointment) {
        appointment.paymentStatus = 'paid';
        await appointment.save();

        // Send confirmation notifications
        await NotificationService.sendAppointmentConfirmation(
          appointment,
          appointment.patient,
          appointment.doctor
        );

        logger.info('Payment confirmed and appointment updated', {
          appointmentId: appointmentId,
          paymentIntentId: paymentIntentId
        });
      }

      res.status(200).json({
        success: true,
        message: 'Payment confirmed successfully',
        data: {
          status: result.status,
          appointmentId: appointmentId
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error || 'Payment confirmation failed'
      });
    }
  } catch (error) {
    logger.error('Error confirming payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error confirming payment'
    });
  }
});

// @desc    Create refund
// @route   POST /api/payments/refund
// @access  Private/Admin
router.post('/refund', protect, authorize('admin'), [
  body('paymentIntentId')
    .notEmpty()
    .withMessage('Payment intent ID is required'),
  body('amount')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Amount must be a positive integer'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters')
], async (req, res) => {
  try {
    const { paymentIntentId, amount, reason } = req.body;

    const result = await PaymentService.createRefund(paymentIntentId, amount, reason);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Refund created successfully',
        data: {
          refundId: result.refundId,
          amount: result.amount,
          status: result.status
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    logger.error('Error creating refund:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating refund'
    });
  }
});

// @desc    Get payment history for customer
// @route   GET /api/payments/history
// @access  Private
router.get('/history', protect, [
  query('customerId')
    .notEmpty()
    .withMessage('Customer ID is required'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], async (req, res) => {
  try {
    const { customerId, limit = 10 } = req.query;

    const result = await PaymentService.getPaymentHistory(customerId, parseInt(limit));

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.payments
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    logger.error('Error getting payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting payment history'
    });
  }
});

// @desc    Calculate appointment cost
// @route   POST /api/payments/calculate-cost
// @access  Private
router.post('/calculate-cost', protect, [
  body('appointmentType')
    .isIn(['consultation', 'follow-up', 'emergency', 'routine-checkup', 'specialist'])
    .withMessage('Valid appointment type is required'),
  body('duration')
    .optional()
    .isInt({ min: 15, max: 180 })
    .withMessage('Duration must be between 15 and 180 minutes'),
  body('insuranceCoverage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Insurance coverage must be between 0 and 100')
], async (req, res) => {
  try {
    const { appointmentType, duration = 30, insuranceCoverage = 0 } = req.body;

    const originalCost = PaymentService.calculateAppointmentCost(appointmentType, duration);
    const costBreakdown = PaymentService.applyInsuranceDiscount(originalCost, insuranceCoverage);

    res.status(200).json({
      success: true,
      data: {
        appointmentType,
        duration,
        originalCost,
        insuranceCoverage,
        discountAmount: costBreakdown.discountAmount,
        finalCost: costBreakdown.finalCost,
        costBreakdown
      }
    });
  } catch (error) {
    logger.error('Error calculating appointment cost:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating appointment cost'
    });
  }
});

// @desc    Stripe webhook handler
// @route   POST /api/payments/webhook
// @access  Public
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({
        success: false,
        message: 'No signature provided'
      });
    }

    // Verify webhook signature
    const result = PaymentService.verifyWebhookSignature(req.body, signature);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    const event = result.event;

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await PaymentService.handlePaymentSuccess(event);
        break;
      
      case 'payment_intent.payment_failed':
        logger.info('Payment failed webhook received', {
          paymentIntentId: event.data.object.id
        });
        break;
      
      case 'charge.refunded':
        logger.info('Refund webhook received', {
          chargeId: event.data.object.id,
          refundId: event.data.object.refunds.data[0]?.id
        });
        break;
      
      default:
        logger.info(`Unhandled webhook event: ${event.type}`);
    }

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    logger.error('Webhook error:', error);
    res.status(400).json({
      success: false,
      message: 'Webhook error'
    });
  }
});

// @desc    Get payment methods for customer
// @route   GET /api/payments/payment-methods
// @access  Private
router.get('/payment-methods', protect, [
  query('customerId')
    .notEmpty()
    .withMessage('Customer ID is required')
], async (req, res) => {
  try {
    const { customerId } = req.query;

    // This would typically fetch payment methods from Stripe
    // For now, return a placeholder response
    res.status(200).json({
      success: true,
      data: {
        customerId,
        paymentMethods: []
      }
    });
  } catch (error) {
    logger.error('Error getting payment methods:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting payment methods'
    });
  }
});

module.exports = router; 