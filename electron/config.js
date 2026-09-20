// Production configuration for Electron app
module.exports = {
  // MongoDB is loaded from backend/.env or backend/.env.production
  MONGO_URI: process.env.MONGO_URI,
  
  // Server Configuration
  PORT: 5000,
  NODE_ENV: 'production',
  
  // JWT Configuration
  JWT_SECRET: 'your-super-secure-jwt-secret-key-for-production-change-this',
  JWT_EXPIRES_IN: '7d',
  
  // CORS Configuration
  ALLOWED_ORIGIN: 'file://',
  
  // Application Settings
  APP_NAME: 'Irfan Medical Center HMS'
};
