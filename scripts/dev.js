import { spawn } from 'child_process';
import path from 'path';

console.log('🚀 Starting Motov Backend Server (Port 5000) & Frontend Client (Port 3000)...');

const serverProcess = spawn('npm', ['run', 'dev'], { cwd: path.resolve('server'), stdio: 'inherit', shell: true });
const clientProcess = spawn('npm', ['run', 'dev'], { cwd: path.resolve('client'), stdio: 'inherit', shell: true });

const cleanup = () => {
  if (serverProcess) serverProcess.kill();
  if (clientProcess) clientProcess.kill();
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
