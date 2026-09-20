const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Complete Electron App...\n');

// Step 1: Clean previous builds
console.log('🧹 Cleaning previous builds...');
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
}

// Step 2: Install backend dependencies first
console.log('📦 Installing backend dependencies...');
try {
  execSync('npm install --production', { 
    cwd: 'backend', 
    stdio: 'inherit' 
  });
  console.log('✅ Backend dependencies installed\n');
} catch (error) {
  console.error('❌ Backend dependency installation failed:', error.message);
  process.exit(1);
}

// Step 3: Build Frontend
console.log('📦 Building Frontend...');
try {
  execSync('npm run build', { 
    cwd: 'frontend', 
    stdio: 'inherit' 
  });
  console.log('✅ Frontend build completed\n');
} catch (error) {
  console.error('❌ Frontend build failed:', error.message);
  process.exit(1);
}

// Step 4: Build Electron App
console.log('🔨 Building Electron executable...');
try {
  execSync('npx electron-builder --win', { stdio: 'inherit' });
  console.log('✅ Electron build completed\n');
} catch (error) {
  console.error('❌ Electron build failed:', error.message);
  process.exit(1);
}

console.log('🎉 Build completed successfully!');
console.log('📁 Check the "dist" folder for your executable files.');
console.log('🚀 Your .exe file should now work without issues!');
