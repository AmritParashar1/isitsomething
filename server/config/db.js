const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`⚠️  MongoDB connection error: ${error.message}`);
    console.error('Server will keep running — check your Atlas network access (IP whitelist) and connection string.');
    // Do not exit — allows debugging
  }
};

module.exports = connectDB;
