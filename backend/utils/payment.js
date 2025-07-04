const { logger } = require('./logger');
const stripe = require('stripe');

class PaymentService {
  /**
   * Create a payment intent for an appointment
   * @param {Object} appointment - Appointment object
   * @param {string} customerEmail - Customer email
   * @param {string} customerName - Customer name
   * @returns {Object} Payment intent object
   */
  static async createPaymentIntent(appointment, customerEmail, customerName) {
    try {
      const amount = appointment.amount || 10000; // Default $100.00 in cents
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        metadata: {
          appointmentId: appointment._id.toString(),
          patientId: appointment.patient.toString(),
          doctorId: appointment.doctor.toString(),
          appointmentType: appointment.appointmentType,
          appointmentDate: appointment.appointmentDate.toISOString()
        },
        receipt_email: customerEmail,
        description: `Appointment with Dr. ${appointment.doctorName || 'Doctor'} - ${appointment.appointmentType}`,
        customer_email: customerEmail,
        customer_name: customerName
      });

      logger.info('Payment intent created successfully', {
        appointmentId: appointment._id,
        paymentIntentId: paymentIntent.id,
        amount: amount
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amount
      };
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Confirm a payment
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @returns {Object} Payment confirmation result
   */
  static async confirmPayment(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        logger.info('Payment confirmed successfully', {
          paymentIntentId: paymentIntentId,
          amount: paymentIntent.amount,
          appointmentId: paymentIntent.metadata.appointmentId
        });

        return {
          success: true,
          paymentIntent: paymentIntent,
          status: paymentIntent.status
        };
      } else {
        return {
          success: false,
          status: paymentIntent.status,
          error: 'Payment not completed'
        };
      }
    } catch (error) {
      logger.error('Error confirming payment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a customer in Stripe
   * @param {Object} user - User object
   * @returns {Object} Customer creation result
   */
  static async createCustomer(user) {
    try {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        phone: user.phone,
        metadata: {
          userId: user._id.toString(),
          role: user.role
        }
      });

      logger.info('Stripe customer created successfully', {
        userId: user._id,
        customerId: customer.id
      });

      return {
        success: true,
        customerId: customer.id,
        customer: customer
      };
    } catch (error) {
      logger.error('Error creating Stripe customer:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a refund for a payment
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @param {number} amount - Amount to refund in cents (optional, defaults to full amount)
   * @param {string} reason - Reason for refund
   * @returns {Object} Refund result
   */
  static async createRefund(paymentIntentId, amount = null, reason = 'requested_by_customer') {
    try {
      const refundData = {
        payment_intent: paymentIntentId,
        reason: reason
      };

      if (amount) {
        refundData.amount = amount;
      }

      const refund = await stripe.refunds.create(refundData);

      logger.info('Refund created successfully', {
        paymentIntentId: paymentIntentId,
        refundId: refund.id,
        amount: refund.amount,
        reason: reason
      });

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount,
        status: refund.status
      };
    } catch (error) {
      logger.error('Error creating refund:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get payment history for a customer
   * @param {string} customerId - Stripe customer ID
   * @param {number} limit - Number of payments to retrieve
   * @returns {Object} Payment history
   */
  static async getPaymentHistory(customerId, limit = 10) {
    try {
      const paymentIntents = await stripe.paymentIntents.list({
        customer: customerId,
        limit: limit
      });

      return {
        success: true,
        payments: paymentIntents.data
      };
    } catch (error) {
      logger.error('Error retrieving payment history:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate appointment cost based on type and duration
   * @param {string} appointmentType - Type of appointment
   * @param {number} duration - Duration in minutes
   * @returns {number} Cost in cents
   */
  static calculateAppointmentCost(appointmentType, duration = 30) {
    const baseCosts = {
      'initial-consultation': 8000,    // $80.00 - First time comprehensive consultation
      'follow-up': 4000,               // $40.00 - Follow-up treatment
      'chronic-condition': 9000,       // $90.00 - Chronic condition management
      'pediatric-consultation': 7000,  // $70.00 - Children's health consultation
      'women-health': 8500,            // $85.00 - Women's health consultation
      'mental-health': 10000,          // $100.00 - Mental health consultation
      'skin-treatment': 7500,          // $75.00 - Skin condition treatment
      'joint-pain': 8000,              // $80.00 - Joint pain & arthritis
      'emergency': 15000,              // $150.00 - Urgent consultation
      'consultation': 6000,            // $60.00 - General consultation
      'routine-checkup': 7000          // $70.00 - Routine health checkup
    };

    const baseCost = baseCosts[appointmentType] || 6000; // Default to $60.00
    const durationMultiplier = duration / 30; // Base duration is 30 minutes

    return Math.round(baseCost * durationMultiplier);
  }

  /**
   * Apply insurance discount to appointment cost
   * @param {number} originalCost - Original cost in cents
   * @param {number} coveragePercentage - Insurance coverage percentage (0-100)
   * @returns {Object} Cost breakdown
   */
  static applyInsuranceDiscount(originalCost, coveragePercentage = 0) {
    const coverage = Math.min(Math.max(coveragePercentage, 0), 100);
    const discountAmount = Math.round(originalCost * (coverage / 100));
    const finalCost = originalCost - discountAmount;

    return {
      originalCost,
      coveragePercentage: coverage,
      discountAmount,
      finalCost
    };
  }

  /**
   * Verify webhook signature
   * @param {string} payload - Raw request body
   * @param {string} signature - Stripe signature header
   * @returns {Object} Webhook event or error
   */
  static verifyWebhookSignature(payload, signature) {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      return {
        success: true,
        event: event
      };
    } catch (error) {
      logger.error('Webhook signature verification failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Handle successful payment webhook
   * @param {Object} event - Stripe webhook event
   * @returns {Object} Processing result
   */
  static async handlePaymentSuccess(event) {
    try {
      const paymentIntent = event.data.object;
      const appointmentId = paymentIntent.metadata.appointmentId;

      logger.info('Payment succeeded webhook received', {
        paymentIntentId: paymentIntent.id,
        appointmentId: appointmentId,
        amount: paymentIntent.amount
      });

      // Here you would typically update the appointment status
      // and send confirmation notifications
      // This would be handled by your appointment controller

      return {
        success: true,
        appointmentId: appointmentId,
        paymentIntentId: paymentIntent.id
      };
    } catch (error) {
      logger.error('Error handling payment success webhook:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = PaymentService; 