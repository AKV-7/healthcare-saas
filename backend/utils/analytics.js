const Appointment = require('../models/Appointment');
const User = require('../models/User');
const moment = require('moment');
const { logger } = require('./logger');

class AnalyticsService {
  /**
   * Get overall system statistics
   * @returns {Object} System statistics
   */
  static async getSystemStats() {
    try {
      const [
        totalPatients,
        totalDoctors,
        totalAppointments,
        totalAdmins,
        todayAppointments,
        thisWeekAppointments,
        thisMonthAppointments,
        pendingAppointments,
        completedAppointments,
        cancelledAppointments
      ] = await Promise.all([
        User.countDocuments({ role: 'patient', isActive: true }),
        User.countDocuments({ role: 'doctor', isActive: true }),
        Appointment.countDocuments(),
        User.countDocuments({ role: 'admin', isActive: true }),
        Appointment.countDocuments({
          appointmentDate: {
            $gte: moment().startOf('day').toDate(),
            $lte: moment().endOf('day').toDate()
          }
        }),
        Appointment.countDocuments({
          appointmentDate: {
            $gte: moment().startOf('week').toDate(),
            $lte: moment().endOf('week').toDate()
          }
        }),
        Appointment.countDocuments({
          appointmentDate: {
            $gte: moment().startOf('month').toDate(),
            $lte: moment().endOf('month').toDate()
          }
        }),
        Appointment.countDocuments({ status: 'pending' }),
        Appointment.countDocuments({ status: 'completed' }),
        Appointment.countDocuments({ status: 'cancelled' })
      ]);

      return {
        success: true,
        data: {
          users: {
            totalPatients,
            totalDoctors,
            totalAdmins,
            totalUsers: totalPatients + totalDoctors + totalAdmins
          },
          appointments: {
            total: totalAppointments,
            today: todayAppointments,
            thisWeek: thisWeekAppointments,
            thisMonth: thisMonthAppointments,
            pending: pendingAppointments,
            completed: completedAppointments,
            cancelled: cancelledAppointments
          }
        }
      };
    } catch (error) {
      logger.error('Error getting system stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get appointment statistics by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Object} Appointment statistics
   */
  static async getAppointmentStats(startDate, endDate) {
    try {
      const appointments = await Appointment.find({
        appointmentDate: {
          $gte: startDate,
          $lte: endDate
        }
      }).populate('patient doctor', 'firstName lastName');

      const stats = {
        total: appointments.length,
        byStatus: {
          pending: 0,
          confirmed: 0,
          completed: 0,
          cancelled: 0,
          'no-show': 0
        },
        byType: {
          consultation: 0,
          'follow-up': 0,
          emergency: 0,
          'routine-checkup': 0,
          specialist: 0
        },
        byDay: {},
        revenue: {
          total: 0,
          byStatus: {
            pending: 0,
            paid: 0,
            partial: 0,
            waived: 0
          }
        }
      };

      appointments.forEach(appointment => {
        // Count by status
        stats.byStatus[appointment.status]++;
        
        // Count by type
        stats.byType[appointment.appointmentType]++;
        
        // Count by day
        const day = moment(appointment.appointmentDate).format('YYYY-MM-DD');
        stats.byDay[day] = (stats.byDay[day] || 0) + 1;
        
        // Calculate revenue
        if (appointment.amount) {
          stats.revenue.total += appointment.amount;
          stats.revenue.byStatus[appointment.paymentStatus] += appointment.amount;
        }
      });

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      logger.error('Error getting appointment stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get doctor performance statistics
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Object} Doctor performance statistics
   */
  static async getDoctorPerformance(startDate, endDate) {
    try {
      const appointments = await Appointment.find({
        appointmentDate: {
          $gte: startDate,
          $lte: endDate
        }
      }).populate('doctor', 'firstName lastName');

      const doctorStats = {};

      appointments.forEach(appointment => {
        const doctorId = appointment.doctor._id.toString();
        const doctorName = `${appointment.doctor.firstName} ${appointment.doctor.lastName}`;

        if (!doctorStats[doctorId]) {
          doctorStats[doctorId] = {
            doctorId,
            doctorName,
            totalAppointments: 0,
            completedAppointments: 0,
            cancelledAppointments: 0,
            noShowAppointments: 0,
            revenue: 0,
            averageRating: 0,
            ratings: []
          };
        }

        doctorStats[doctorId].totalAppointments++;
        
        if (appointment.status === 'completed') {
          doctorStats[doctorId].completedAppointments++;
        } else if (appointment.status === 'cancelled') {
          doctorStats[doctorId].cancelledAppointments++;
        } else if (appointment.status === 'no-show') {
          doctorStats[doctorId].noShowAppointments++;
        }

        if (appointment.amount) {
          doctorStats[doctorId].revenue += appointment.amount;
        }
      });

      // Calculate completion rates and averages
      Object.values(doctorStats).forEach(doctor => {
        doctor.completionRate = doctor.totalAppointments > 0 
          ? (doctor.completedAppointments / doctor.totalAppointments * 100).toFixed(2)
          : 0;
        
        doctor.averageRevenue = doctor.totalAppointments > 0
          ? (doctor.revenue / doctor.totalAppointments).toFixed(2)
          : 0;
      });

      return {
        success: true,
        data: Object.values(doctorStats)
      };
    } catch (error) {
      logger.error('Error getting doctor performance:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get patient statistics
   * @returns {Object} Patient statistics
   */
  static async getPatientStats() {
    try {
      const patients = await User.find({ role: 'patient' });
      const appointments = await Appointment.find().populate('patient', 'firstName lastName');

      const patientStats = {
        totalPatients: patients.length,
        activePatients: patients.filter(p => p.isActive).length,
        newPatientsThisMonth: patients.filter(p => 
          moment(p.createdAt).isSame(moment(), 'month')
        ).length,
        byGender: {
          male: 0,
          female: 0,
          other: 0,
          'prefer-not-to-say': 0
        },
        byAgeGroup: {
          '18-25': 0,
          '26-35': 0,
          '36-45': 0,
          '46-55': 0,
          '56-65': 0,
          '65+': 0
        },
        topPatients: []
      };

      // Count by gender
      patients.forEach(patient => {
        if (patient.gender) {
          patientStats.byGender[patient.gender]++;
        }
      });

      // Count by age group
      patients.forEach(patient => {
        if (patient.dateOfBirth) {
          const age = moment().diff(moment(patient.dateOfBirth), 'years');
          if (age >= 18 && age <= 25) patientStats.byAgeGroup['18-25']++;
          else if (age >= 26 && age <= 35) patientStats.byAgeGroup['26-35']++;
          else if (age >= 36 && age <= 45) patientStats.byAgeGroup['36-45']++;
          else if (age >= 46 && age <= 55) patientStats.byAgeGroup['46-55']++;
          else if (age >= 56 && age <= 65) patientStats.byAgeGroup['56-65']++;
          else if (age > 65) patientStats.byAgeGroup['65+']++;
        }
      });

      // Get top patients by appointment count
      const patientAppointmentCounts = {};
      appointments.forEach(appointment => {
        const patientId = appointment.patient._id.toString();
        patientAppointmentCounts[patientId] = (patientAppointmentCounts[patientId] || 0) + 1;
      });

      const topPatients = Object.entries(patientAppointmentCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([patientId, count]) => {
          const patient = patients.find(p => p._id.toString() === patientId);
          return {
            patientId,
            name: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
            appointmentCount: count
          };
        });

      patientStats.topPatients = topPatients;

      return {
        success: true,
        data: patientStats
      };
    } catch (error) {
      logger.error('Error getting patient stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get revenue statistics
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Object} Revenue statistics
   */
  static async getRevenueStats(startDate, endDate) {
    try {
      const appointments = await Appointment.find({
        appointmentDate: {
          $gte: startDate,
          $lte: endDate
        }
      });

      const revenueStats = {
        totalRevenue: 0,
        totalAppointments: appointments.length,
        byMonth: {},
        byPaymentStatus: {
          pending: 0,
          paid: 0,
          partial: 0,
          waived: 0
        },
        byAppointmentType: {
          consultation: 0,
          'follow-up': 0,
          emergency: 0,
          'routine-checkup': 0,
          specialist: 0
        },
        averageRevenue: 0
      };

      appointments.forEach(appointment => {
        if (appointment.amount) {
          revenueStats.totalRevenue += appointment.amount;
          revenueStats.byPaymentStatus[appointment.paymentStatus] += appointment.amount;
          revenueStats.byAppointmentType[appointment.appointmentType] += appointment.amount;

          const month = moment(appointment.appointmentDate).format('YYYY-MM');
          revenueStats.byMonth[month] = (revenueStats.byMonth[month] || 0) + appointment.amount;
        }
      });

      revenueStats.averageRevenue = revenueStats.totalAppointments > 0
        ? (revenueStats.totalRevenue / revenueStats.totalAppointments).toFixed(2)
        : 0;

      return {
        success: true,
        data: revenueStats
      };
    } catch (error) {
      logger.error('Error getting revenue stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get dashboard overview data
   * @returns {Object} Dashboard overview
   */
  static async getDashboardOverview() {
    try {
      const [
        systemStats,
        todayStats,
        weekStats,
        monthStats,
        patientStats
      ] = await Promise.all([
        this.getSystemStats(),
        this.getAppointmentStats(moment().startOf('day').toDate(), moment().endOf('day').toDate()),
        this.getAppointmentStats(moment().startOf('week').toDate(), moment().endOf('week').toDate()),
        this.getAppointmentStats(moment().startOf('month').toDate(), moment().endOf('month').toDate()),
        this.getPatientStats()
      ]);

      return {
        success: true,
        data: {
          system: systemStats.data,
          today: todayStats.data,
          week: weekStats.data,
          month: monthStats.data,
          patients: patientStats.data
        }
      };
    } catch (error) {
      logger.error('Error getting dashboard overview:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get trends data for charts
   * @param {number} days - Number of days to analyze
   * @returns {Object} Trends data
   */
  static async getTrendsData(days = 30) {
    try {
      const startDate = moment().subtract(days, 'days').startOf('day').toDate();
      const endDate = moment().endOf('day').toDate();

      const appointments = await Appointment.find({
        appointmentDate: {
          $gte: startDate,
          $lte: endDate
        }
      });

      const trends = {
        appointments: {},
        revenue: {},
        newPatients: {}
      };

      // Generate date range
      const dateRange = [];
      let currentDate = moment(startDate);
      while (currentDate.isSameOrBefore(endDate)) {
        dateRange.push(currentDate.format('YYYY-MM-DD'));
        currentDate.add(1, 'day');
      }

      // Initialize trends with zeros
      dateRange.forEach(date => {
        trends.appointments[date] = 0;
        trends.revenue[date] = 0;
        trends.newPatients[date] = 0;
      });

      // Count appointments and revenue by date
      appointments.forEach(appointment => {
        const date = moment(appointment.appointmentDate).format('YYYY-MM-DD');
        trends.appointments[date]++;
        if (appointment.amount) {
          trends.revenue[date] += appointment.amount;
        }
      });

      // Count new patients by date
      const patients = await User.find({
        role: 'patient',
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      });

      patients.forEach(patient => {
        const date = moment(patient.createdAt).format('YYYY-MM-DD');
        trends.newPatients[date]++;
      });

      return {
        success: true,
        data: trends
      };
    } catch (error) {
      logger.error('Error getting trends data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = AnalyticsService; 