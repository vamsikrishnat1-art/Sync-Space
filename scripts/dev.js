const { spawn } = require('child_process');

console.log('🚀 Starting SyncSpace Full Collaborative Suite...');

// Start WebSocket server
const wsServer = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['tsx', 'server/ws-server.ts'], {
  stdio: 'inherit',
  shell: true,
});

// Start Next.js dev server
const nextApp = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['next', 'dev'], {
  stdio: 'inherit',
  shell: true,
});

const cleanExit = () => {
  wsServer.kill();
  nextApp.kill();
  process.exit();
};

process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);
