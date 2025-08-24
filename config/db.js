const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('MongoDB Atlas connected successfully');
    
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    
  }
};

module.exports = connectDB;