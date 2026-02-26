import mongoose from 'mongoose';

let isConnected = false;

export const connectMongoDB = async () => {
  if (isConnected) {
    console.log('MongoDB already connected');
    return;
  }

  try {
    const options = {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    };

    await mongoose.connect(process.env.MONGODB_URI, options);
    
    isConnected = true;
    console.log('✅ MongoDB Atlas connected successfully');
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });

  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

export const getMongoDBStatus = () => ({
  isConnected: mongoose.connection.readyState === 1,
  host: mongoose.connection.host,
  name: mongoose.connection.name
});