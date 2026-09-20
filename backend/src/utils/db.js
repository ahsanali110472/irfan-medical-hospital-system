import dotenv from 'dotenv';

dotenv.config();
import mongoose from 'mongoose';

export const connectDb = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI not set');
  
  console.log('🔄 Connecting to MongoDB...');
  console.log('📍 Database URI:', uri.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
  
  await mongoose.connect(uri, {
    autoIndex: true,
  });
  
  console.log('✅ MongoDB connected successfully!');
  console.log('📊 Database:', mongoose.connection.name);
  console.log('🌐 Host:', mongoose.connection.host);
  console.log('🔌 Port:', mongoose.connection.port);
};




