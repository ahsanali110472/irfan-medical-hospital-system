const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Electron App for Production...\n');

// Step 1: Build Frontend
console.log('📦 Building Frontend...');
try {
  execSync('cd frontend && npm run build', { stdio: 'inherit' });
  console.log('✅ Frontend build completed\n');
} catch (error) {
  console.error('❌ Frontend build failed:', error.message);
  process.exit(1);
}

// Step 2: Install Backend Dependencies (production only)
console.log('📦 Installing Backend Dependencies...');
try {
  execSync('cd backend && npm ci --omit=dev', { stdio: 'inherit' });
  console.log('✅ Backend dependencies installed\n');
} catch (error) {
  console.error('❌ Backend dependency installation failed:', error.message);
  process.exit(1);
}

// Step 3: Create production environment file
console.log('⚙️ Creating production environment...');
const prodEnv = `# Production Environment - Auto Generated
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/irfan_medical_center?retryWrites=true&w=majority
JWT_SECRET=your-super-secure-jwt-secret-key-for-production-change-this
JWT_EXPIRES_IN=7d
ALLOWED_ORIGIN=file://
APP_NAME=Irfan Medical Center HMS
`;

fs.writeFileSync(path.join(__dirname, 'backend', '.env.production'), prodEnv);
console.log('✅ Production environment file created\n');

// Step 4: Build Electron App
console.log('🔨 Building Electron executable...');
try {
  execSync('npm run dist', { stdio: 'inherit' });
  console.log('✅ Electron build completed\n');
} catch (error) {
  console.error('❌ Electron build failed:', error.message);
  process.exit(1);
}

console.log('🎉 Build completed successfully!');
console.log('📁 Check the "dist" folder for your executable files.');
