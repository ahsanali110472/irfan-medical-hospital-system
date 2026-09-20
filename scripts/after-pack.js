const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

exports.default = async function(context) {
  const { appOutDir, packager } = context;
  
  console.log('Running after-pack script...');
  
  // Install backend dependencies in the unpacked backend folder
  const backendPath = path.join(appOutDir, 'resources', 'app.asar.unpacked', 'backend');
  
  if (fs.existsSync(backendPath)) {
    console.log('Installing backend dependencies...');
    console.log('Backend path:', backendPath);
    
    try {
      execSync('npm install --production --no-optional', {
        cwd: backendPath,
        stdio: 'inherit'
      });
      console.log('Backend dependencies installed successfully');
      
      const sourceEnvPath = path.join(__dirname, '..', 'backend', '.env');
      let envContent = '';

      if (fs.existsSync(sourceEnvPath)) {
        envContent = fs.readFileSync(sourceEnvPath, 'utf8');
      }

      if (!envContent.includes('MONGO_URI=')) {
        throw new Error('backend/.env must contain MONGO_URI before building the installer');
      }

      envContent = envContent
        .replace(/^NODE_ENV=.*$/m, 'NODE_ENV=production')
        .replace(/^PORT=.*$/m, 'PORT=5000')
        .replace(/^ALLOWED_ORIGIN=.*$/m, 'ALLOWED_ORIGIN=file://');

      if (!/^NODE_ENV=/m.test(envContent)) envContent += '\nNODE_ENV=production';
      if (!/^PORT=/m.test(envContent)) envContent += '\nPORT=5000';
      if (!/^ALLOWED_ORIGIN=/m.test(envContent)) envContent += '\nALLOWED_ORIGIN=file://';
      
      fs.writeFileSync(path.join(backendPath, '.env.production'), envContent);
      console.log('Environment file created successfully');
      
    } catch (error) {
      console.error('Failed to install backend dependencies:', error);
      throw error;
    }
  } else {
    console.error('Backend path not found:', backendPath);
  }
};
