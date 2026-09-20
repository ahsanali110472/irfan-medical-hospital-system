const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const logPath = process.env.BACKEND_LOG_FILE;

function writeLog(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  if (logPath) {
    try {
      fs.mkdirSync(path.dirname(logPath), { recursive: true });
      fs.appendFileSync(logPath, line);
    } catch (error) {
      // Continue with stdout logging if file logging is unavailable.
    }
  }
  console.log(message);
}

process.on('uncaughtException', (error) => {
  writeLog(`Uncaught exception: ${error.stack || error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  const message = reason?.stack || reason?.message || String(reason);
  writeLog(`Unhandled rejection: ${message}`);
  process.exit(1);
});

const serverPath = process.env.BACKEND_SERVER_PATH || path.join(__dirname, '..', 'backend', 'src', 'server.js');

writeLog('Backend launcher started');
writeLog(`Executable: ${process.execPath}`);
writeLog(`Server path: ${serverPath}`);
writeLog(`Working directory: ${process.cwd()}`);
writeLog(`NODE_PATH: ${process.env.NODE_PATH || ''}`);

if (!fs.existsSync(serverPath)) {
  writeLog(`Server file not found: ${serverPath}`);
  process.exit(1);
}

import(pathToFileURL(serverPath).href).catch((error) => {
  writeLog(`Failed to import backend server: ${error.stack || error.message}`);
  process.exit(1);
});
