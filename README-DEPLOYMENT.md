# HMS Electron App Deployment Guide

## Prerequisites for Building

1. **Node.js** (v16 or higher) - Required only for building, not for end users
2. **MongoDB Atlas Account** - For cloud database
3. **Windows Build Environment** - For creating .exe files

## Configuration Steps

### 1. MongoDB Cloud Setup
1. Create a MongoDB Atlas account at https://www.mongodb.com/atlas
2. Create a new cluster
3. Get your connection string (format: `mongodb+srv://username:password@cluster.mongodb.net/database`)
4. Update the connection string in `electron/config.js`:
   ```javascript
   MONGO_URI: 'your-actual-mongodb-atlas-connection-string'
   ```

### 2. Security Configuration
Update the JWT secret in `electron/config.js`:
```javascript
JWT_SECRET: 'your-super-secure-jwt-secret-key-for-production'
```

## Building the Executable

### Option 1: Automated Build (Recommended)
```bash
npm run build:electron
```

### Option 2: Manual Build Steps
```bash
# 1. Build frontend
cd frontend && npm run build && cd ..

# 2. Install backend production dependencies
cd backend && npm ci --only=production && cd ..

# 3. Build Electron executable
npm run dist
```

## Output Files

After successful build, you'll find:
- **Windows**: `dist/Irfan Medical Center HMS Setup 1.0.0.exe` (Installer)
- **Portable**: `dist/win-unpacked/` (Portable version)

## Distribution

### For End Users:
1. **No Node.js Required** - The .exe includes everything needed
2. **No Manual Setup** - Just run the installer
3. **Cloud Database** - Connects directly to MongoDB Atlas
4. **Automatic Updates** - Built-in update mechanism

### Installation:
1. Run `Irfan Medical Center HMS Setup 1.0.0.exe`
2. Follow the installation wizard
3. Launch from desktop shortcut or start menu

## Features in Production Build

✅ **Bundled Node.js Runtime** - No need to install Node.js on client PCs
✅ **Cloud MongoDB Connection** - Uses MongoDB Atlas
✅ **Built-in Frontend** - Serves from local dist folder
✅ **Automatic Backend Startup** - Starts local server automatically
✅ **Print Support** - Thermal printer integration
✅ **Auto-updater** - Built-in update mechanism
✅ **Desktop Integration** - Start menu and desktop shortcuts

## Troubleshooting

### Common Issues:
1. **MongoDB Connection**: Ensure your Atlas cluster allows connections from anywhere (0.0.0.0/0)
2. **Firewall**: Windows may prompt to allow the app through firewall
3. **Antivirus**: Some antivirus software may flag the .exe initially

### Logs Location:
- **Windows**: `%APPDATA%/Irfan Medical Center HMS/logs/`
- **Console**: Press F12 in the app to open developer tools

## Security Notes

- JWT secrets are embedded in the executable
- MongoDB credentials are included in the build
- Consider using environment-specific builds for different deployments
- The app runs a local backend server on port 5000

## File Structure in Built App

```
Irfan Medical Center HMS/
├── electron/           # Electron main process
├── frontend/dist/      # Built React frontend
├── backend/           # Node.js backend (without node_modules)
├── resources/         # Node.js runtime and dependencies
└── app.exe           # Main executable
```
