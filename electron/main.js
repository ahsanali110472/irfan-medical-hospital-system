console.log('MAIN PROCESS STARTED:', __filename);

const { app, BrowserWindow, ipcMain, session, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  console.log('Another instance is already running. Exiting...');
  app.quit();
}

// Global error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't show EPIPE errors to user as they're harmless
  if (error.code !== 'EPIPE') {
    dialog.showErrorBox('Application Error', `Uncaught Exception: ${error.message}`);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't show EPIPE errors to user
  if (reason && reason.code !== 'EPIPE') {
    dialog.showErrorBox('Application Error', `Unhandled Rejection: ${reason}`);
  }
});

let buildReceiptHtml = require('./buildReceiptHtml');
let buildAppointmentHtml = require('./buildAppointmentHtml');

let mainWindow = null;
let splashWindow = null;
let backendProcess = null;
let isAppReady = false;

function appendStartupLog(message) {
  try {
    const logDir = path.join(app.getPath('userData'), 'logs');
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(path.join(logDir, 'backend-startup.log'), `[${new Date().toISOString()}] ${message}\n`);
  } catch (error) {
    console.error('Failed to write startup log:', error);
  }
}

/**
 * --------------------------------------------------------------------
 * IPC: print-receipt
 * --------------------------------------------------------------------
 */
ipcMain.handle("print-receipt", async (event, bill) => {
  try {
    if (!bill) throw new Error("No bill data received");

    const html = buildReceiptHtml(bill);
    if (!html) throw new Error("Failed to build receipt HTML");

    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: { offscreen: true }
    });

    printWindow.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html));

    printWindow.webContents.on("did-finish-load", () => {
      printWindow.webContents.print({ silent: false }, (success, failureReason) => {
        if (!success) {
          console.error("Print failed:", failureReason);
        }
        printWindow.close();
      });
    });

    return { success: true, message: "Bill sent to printer" };
  } catch (err) {
    console.error("Print error:", err);
    return { success: false, message: err.message };
  }
});

ipcMain.handle("print-appointment", async (event, appointment) => {
  try {
    if (!appointment) throw new Error("No appointment data received");

    const html = buildAppointmentHtml(appointment);
    if (!html) throw new Error("Failed to build appointment slip");

    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: { offscreen: true }
    });

    printWindow.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html));

    printWindow.webContents.on("did-finish-load", () => {
      printWindow.webContents.print({ silent: false }, (success, failureReason) => {
        if (!success) {
          console.error("Appointment print failed:", failureReason);
        }
        printWindow.close();
      });
    });

    return { success: true, message: "Appointment slip sent to printer" };
  } catch (err) {
    console.error("Appointment print error:", err);
    return { success: false, message: err.message };
  }
});

/**
 * Splash Screen
 */
function createSplash() {
  if (splashWindow && !splashWindow.isDestroyed()) {
    return; // Prevent multiple splash windows
  }
  
  splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    movable: true,
    show: false,
  });
  
  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  
  splashWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.show();
    }
  });
  
  splashWindow.on('closed', () => {
    splashWindow = null;
  });
}

/**
 * Main App Window
 */
function createMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    console.log('Main window already exists, skipping creation');
    return; // Prevent multiple main windows
  }
  
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    const frontendPath = path.join(__dirname, '../frontend/dist/index.html');
    console.log('Loading frontend from:', frontendPath);
    mainWindow.loadFile(frontendPath);
  }

  let hasLoaded = false;
  
  mainWindow.webContents.once('did-finish-load', () => {
    if (hasLoaded) return;
    hasLoaded = true;
    console.log('Main window loaded successfully');
    closeSplash();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
    }
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    if (hasLoaded) return;
    hasLoaded = true;
    console.error('Failed to load main window:', errorCode, errorDescription);
    closeSplash();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => { 
    mainWindow = null;
    app.quit();
  });
}

function closeSplash() {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
    splashWindow = null;
  }
}

function cleanupAndExit() {
  if (backendProcess && !backendProcess.killed) {
    console.log('Terminating backend process');
    backendProcess.kill('SIGTERM');
    backendProcess = null;
  }
}

/**
 * Start Backend Server
 */
function startBackendServer() {
  return new Promise((resolve, reject) => {
    try {
      const isDev = process.env.VITE_DEV_SERVER_URL;
      const backendPath = isDev 
        ? path.join(__dirname, '../backend')
        : path.join(process.resourcesPath, 'app.asar.unpacked/backend');
      const launcherPath = isDev
        ? path.join(__dirname, 'backend-launcher.cjs')
        : path.join(process.resourcesPath, 'app.asar.unpacked/electron/backend-launcher.cjs');
      
      const serverPath = path.join(backendPath, 'src/server.js');
      const logFile = path.join(app.getPath('userData'), 'logs', 'backend-startup.log');
      try {
        fs.mkdirSync(path.dirname(logFile), { recursive: true });
        fs.writeFileSync(logFile, '');
      } catch (error) {
        console.error('Failed to reset backend startup log:', error);
      }
      
      console.log('🚀 Starting backend server...');
      console.log('📁 Is Dev:', !!isDev);
      console.log('📂 Backend path:', backendPath);
      console.log('📄 Server path:', serverPath);
      console.log('🗂️ Resources path:', process.resourcesPath);
      console.log('🔧 Node executable:', process.execPath);
      
      // Check if backend files exist
      if (!fs.existsSync(backendPath)) {
        console.error('Backend path does not exist:', backendPath);
        dialog.showErrorBox('Backend Error', `Backend files not found at: ${backendPath}`);
        resolve();
        return;
      }
      
      if (!fs.existsSync(serverPath)) {
        console.error('Server file does not exist:', serverPath);
        dialog.showErrorBox('Backend Error', `Server file not found at: ${serverPath}`);
        resolve();
        return;
      }

      if (!fs.existsSync(launcherPath)) {
        console.error('Backend launcher does not exist:', launcherPath);
        dialog.showErrorBox('Backend Error', `Backend launcher not found at: ${launcherPath}`);
        resolve();
        return;
      }
      
      // Set environment variables for backend
      const env = {
        ...process.env,
        NODE_ENV: 'production',
        PORT: '5000',
        JWT_SECRET: 'your-super-secure-jwt-secret-key-for-production-change-this',
        JWT_EXPIRES_IN: '7d',
        ALLOWED_ORIGIN: 'file://',
        APP_NAME: 'Irfan Medical Center HMS',
        NODE_PATH: path.join(backendPath, 'node_modules'),
        BACKEND_SERVER_PATH: serverPath,
        BACKEND_LOG_FILE: logFile
      };
      
      console.log('Environment variables:', Object.keys(env));
      
      const command = isDev ? 'npm' : process.execPath;
      const args = isDev ? ['run', 'start'] : [launcherPath];
      const spawnEnv = isDev ? env : { ...env, ELECTRON_RUN_AS_NODE: '1' };

      console.log('Backend command:', command);
      console.log('Backend args:', args);
      appendStartupLog('Starting backend server');
      appendStartupLog(`Backend path: ${backendPath}`);
      appendStartupLog(`Server path: ${serverPath}`);
      appendStartupLog(`Launcher path: ${launcherPath}`);
      appendStartupLog(`Backend command: ${command}`);
      appendStartupLog(`Backend args: ${args.join(' ')}`);
      appendStartupLog(`Log file: ${logFile}`);

      backendProcess = spawn(command, args, {
        cwd: backendPath,
        env: spawnEnv,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: !!isDev
      });
      
      let serverStarted = false;
      
      backendProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`Backend STDOUT: ${output}`);
        appendStartupLog(`STDOUT: ${output.trim()}`);
        if ((output.includes('Server running on port') || output.includes('Server accessible at')) && !serverStarted) {
          serverStarted = true;
          console.log('✅ Backend server started successfully');
          resolve();
        }
      });

      backendProcess.stderr.on('data', (data) => {
        const output = data.toString();
        console.error(`Backend STDERR: ${output}`);
        appendStartupLog(`STDERR: ${output.trim()}`);
      });

      backendProcess.on('error', (error) => {
        console.error('Backend process failed to start:', error);
        appendStartupLog(`Backend process failed to start: ${error.stack || error.message}`);
        if (!serverStarted) {
          dialog.showErrorBox('Backend Startup Error', `${error.message}\n\nLog file:\n${logFile}`);
          resolve();
        }
      });

      backendProcess.on('exit', (code, signal) => {
        console.log(`Backend process exited with code ${code}, signal ${signal}`);
        appendStartupLog(`Backend process exited with code ${code}, signal ${signal}`);
        if (!serverStarted && code !== 0) {
          dialog.showErrorBox(
            'Backend Startup Error',
            `Backend server exited before startup. Code: ${code || 'none'}, Signal: ${signal || 'none'}\n\nLog file:\n${logFile}`
          );
          resolve();
        }
      });
      
      // Timeout after 20 seconds
      setTimeout(() => {
        if (!serverStarted) {
          console.log('Backend startup timeout - continuing anyway');
        }
        resolve();
      }, 20000);
      
    } catch (error) {
      console.error('Backend startup error:', error);
      dialog.showErrorBox('Backend Startup Error', error.message);
      resolve();
    }
  });
}

// Handle second instance
app.on('second-instance', (event, commandLine, workingDirectory) => {
  console.log('Second instance detected, focusing existing window');
  // Someone tried to run a second instance, focus our window instead
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

/**
 * App lifecycle
 */
app.on('ready', async () => {
  if (isAppReady) {
    console.log('App already ready, ignoring duplicate ready event');
    return;
  }
  
  isAppReady = true;
  console.log('App ready event triggered');
  
  try {
    createSplash();
    console.log('Splash window created');
    
    await startBackendServer();
    console.log('Backend server startup completed');
    
    createMainWindow();
    console.log('Main window created');
  } catch (error) {
    console.error('App ready error:', error);
    closeSplash();
    dialog.showErrorBox('Startup Error', `Failed to start application: ${error.message}`);
  }
});

// ✅ Always clear localStorage, sessionStorage, and cookies when app quits
app.on('before-quit', async () => {
  try {
    const ses = session.defaultSession;
    await ses.clearStorageData({
      storages: ['cookies', 'localstorage', 'sessionstorage', 'indexdb', 'websql']
    });
    console.log("✅ Cleared storage: cookies, localStorage, sessionStorage, indexedDB, webSQL");
  } catch (err) {
    console.error("❌ Failed to clear storage:", err);
  }
});

app.on('window-all-closed', () => {
  console.log('All windows closed');
  cleanupAndExit();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  console.log('App activated');
  if (mainWindow === null && isAppReady) {
    createMainWindow();
  }
});

app.on('will-quit', (event) => {
  console.log('App will quit');
  cleanupAndExit();
});
