const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { logger } = require('./logger');

class RealtimeService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // Map to store connected users
  }

  /**
   * Initialize Socket.IO server
   * @param {Object} server - HTTP server instance
   */
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? [process.env.FRONTEND_URL_PROD]
          : [process.env.FRONTEND_URL || 'http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        socket.userEmail = decoded.email;
        
        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication error: Invalid token'));
      }
    });

    // Connection handler
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    logger.info('Socket.IO server initialized');
  }

  /**
   * Handle new socket connection
   * @param {Object} socket - Socket instance
   */
  handleConnection(socket) {
    const userId = socket.userId;
    const userRole = socket.userRole;
    const userEmail = socket.userEmail;

    // Store connected user
    this.connectedUsers.set(userId, {
      socketId: socket.id,
      role: userRole,
      email: userEmail,
      connectedAt: new Date()
    });

    logger.info(`User connected: ${userEmail} (${userRole})`, {
      userId: userId,
      socketId: socket.id
    });

    // Join role-specific room
    socket.join(`role:${userRole}`);
    
    // Join user-specific room
    socket.join(`user:${userId}`);

    // Send welcome message
    socket.emit('welcome', {
      message: 'Connected to healthcare system',
      userId: userId,
      role: userRole,
      timestamp: new Date()
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });

    // Handle appointment updates
    socket.on('appointment:update', (data) => {
      this.handleAppointmentUpdate(socket, data);
    });

    // Handle chat messages
    socket.on('chat:message', (data) => {
      this.handleChatMessage(socket, data);
    });

    // Handle typing indicators
    socket.on('chat:typing', (data) => {
      this.handleTypingIndicator(socket, data);
    });

    // Handle room joining
    socket.on('room:join', (roomName) => {
      socket.join(roomName);
      logger.info(`User ${userEmail} joined room: ${roomName}`);
    });

    // Handle room leaving
    socket.on('room:leave', (roomName) => {
      socket.leave(roomName);
      logger.info(`User ${userEmail} left room: ${roomName}`);
    });
  }

  /**
   * Handle socket disconnection
   * @param {Object} socket - Socket instance
   */
  handleDisconnection(socket) {
    const userId = socket.userId;
    const userEmail = socket.userEmail;

    // Remove from connected users
    this.connectedUsers.delete(userId);

    logger.info(`User disconnected: ${userEmail}`, {
      userId: userId,
      socketId: socket.id
    });
  }

  /**
   * Handle appointment updates
   * @param {Object} socket - Socket instance
   * @param {Object} data - Update data
   */
  handleAppointmentUpdate(socket, data) {
    const { appointmentId, action, appointment } = data;
    
    logger.info(`Appointment update: ${action}`, {
      appointmentId: appointmentId,
      userId: socket.userId,
      action: action
    });

    // Broadcast to relevant users
    this.io.to(`appointment:${appointmentId}`).emit('appointment:updated', {
      appointmentId: appointmentId,
      action: action,
      appointment: appointment,
      updatedBy: socket.userId,
      timestamp: new Date()
    });
  }

  /**
   * Handle chat messages
   * @param {Object} socket - Socket instance
   * @param {Object} data - Message data
   */
  handleChatMessage(socket, data) {
    const { roomId, message, recipientId } = data;
    
    const messageData = {
      id: Date.now().toString(),
      senderId: socket.userId,
      senderEmail: socket.userEmail,
      senderRole: socket.userRole,
      message: message,
      timestamp: new Date(),
      roomId: roomId
    };

    logger.info(`Chat message sent`, {
      roomId: roomId,
      senderId: socket.userId,
      recipientId: recipientId
    });

    // Send to specific room or recipient
    if (roomId) {
      this.io.to(`chat:${roomId}`).emit('chat:message', messageData);
    } else if (recipientId) {
      this.io.to(`user:${recipientId}`).emit('chat:message', messageData);
      socket.emit('chat:message', messageData); // Send back to sender
    }
  }

  /**
   * Handle typing indicators
   * @param {Object} socket - Socket instance
   * @param {Object} data - Typing data
   */
  handleTypingIndicator(socket, data) {
    const { roomId, isTyping, recipientId } = data;
    
    const typingData = {
      userId: socket.userId,
      userEmail: socket.userEmail,
      isTyping: isTyping,
      timestamp: new Date()
    };

    if (roomId) {
      socket.to(`chat:${roomId}`).emit('chat:typing', typingData);
    } else if (recipientId) {
      this.io.to(`user:${recipientId}`).emit('chat:typing', typingData);
    }
  }

  /**
   * Send notification to specific user
   * @param {string} userId - User ID
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   */
  sendNotificationToUser(userId, type, data) {
    const notification = {
      type: type,
      data: data,
      timestamp: new Date()
    };

    this.io.to(`user:${userId}`).emit('notification', notification);
    
    logger.info(`Notification sent to user: ${userId}`, {
      type: type,
      userId: userId
    });
  }

  /**
   * Send notification to all users with specific role
   * @param {string} role - User role
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   */
  sendNotificationToRole(role, type, data) {
    const notification = {
      type: type,
      data: data,
      timestamp: new Date()
    };

    this.io.to(`role:${role}`).emit('notification', notification);
    
    logger.info(`Notification sent to role: ${role}`, {
      type: type,
      role: role
    });
  }

  /**
   * Send appointment notification
   * @param {Object} appointment - Appointment object
   * @param {string} action - Action performed
   */
  sendAppointmentNotification(appointment, action) {
    const notification = {
      type: 'appointment',
      action: action,
      appointment: appointment,
      timestamp: new Date()
    };

    // Send to patient using userId
    if (appointment.userId) {
      this.sendNotificationToUser(appointment.userId.toString(), 'appointment', notification);
    }
    
    // Note: In our current model, doctor is just a string name, not a user ID
    // If you want to send notifications to doctors, you'd need to implement
    // a doctor user lookup system
    
    // Send to admins
    this.sendNotificationToRole('admin', 'appointment', notification);
  }

  /**
   * Send emergency notification
   * @param {Object} emergencyData - Emergency data
   */
  sendEmergencyNotification(emergencyData) {
    const notification = {
      type: 'emergency',
      data: emergencyData,
      timestamp: new Date()
    };

    // Send to all doctors and admins
    this.sendNotificationToRole('doctor', 'emergency', notification);
    this.sendNotificationToRole('admin', 'emergency', notification);
  }

  /**
   * Get connected users count
   * @returns {Object} Connected users statistics
   */
  getConnectedUsersStats() {
    const stats = {
      total: this.connectedUsers.size,
      byRole: {
        admin: 0,
        doctor: 0,
        patient: 0
      }
    };

    for (const [/* userId not needed */, userData] of this.connectedUsers) {
      stats.byRole[userData.role]++;
    }

    return stats;
  }

  /**
   * Get connected users list
   * @returns {Array} List of connected users
   */
  getConnectedUsers() {
    const users = [];
    
    for (const [userId, userData] of this.connectedUsers) {
      users.push({
        userId: userId,
        email: userData.email,
        role: userData.role,
        connectedAt: userData.connectedAt
      });
    }

    return users;
  }

  /**
   * Check if user is connected
   * @param {string} userId - User ID
   * @returns {boolean} Connection status
   */
  isUserConnected(userId) {
    return this.connectedUsers.has(userId);
  }

  /**
   * Force disconnect user
   * @param {string} userId - User ID
   */
  disconnectUser(userId) {
    const userData = this.connectedUsers.get(userId);
    if (userData) {
      this.io.sockets.sockets.get(userData.socketId)?.disconnect();
      this.connectedUsers.delete(userId);
      
      logger.info(`User forcefully disconnected: ${userId}`);
    }
  }
}

// Create singleton instance
const realtimeService = new RealtimeService();

module.exports = realtimeService; 