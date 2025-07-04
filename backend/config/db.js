const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.NODE_ENV === 'production' 
      ? process.env.MONGODB_URI_PROD 
      : process.env.MONGODB_URI;

    if (!mongoUri) {
      // console.log('⚠️ MongoDB URI not configured, skipping database connection'); - removed for production
      return;
    }

    const conn = await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    // console.log(`✅ MongoDB Connected: ${conn.connection.host}`); - removed for production

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      // console.log('⚠️ MongoDB disconnected'); - removed for production
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      // console.log('MongoDB connection closed through app termination'); - removed for production
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    // console.log('⚠️ Server will continue without database connection for testing'); - removed for production
    // Don't exit the process, allow the server to run without DB
  }
};

module.exports = connectDB;
