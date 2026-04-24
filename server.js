const { spawn } = require('child_process');
const path = require('path');

// This script starts the backend server from the correct directory
// to satisfy Render's default 'node server.js' start command.

const backendDir = path.join(__dirname, 'b2c-backend');

console.log(`Starting backend server from: ${backendDir}`);

const startProcess = spawn('node', ['server.js'], {
  cwd: backendDir,
  stdio: 'inherit',
  env: process.env
});

startProcess.on('close', (code) => {
  console.log(`Backend process exited with code ${code}`);
  process.exit(code);
});

startProcess.on('error', (err) => {
  console.error('Failed to start backend process:', err);
  process.exit(1);
});
