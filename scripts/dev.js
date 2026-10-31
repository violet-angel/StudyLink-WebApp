import { spawn } from 'child_process';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function testPort(port, host) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    let settled = false;

    const cleanup = () => {
      try {
        server.close();
      } catch {
        // ignore cleanup failures
      }
    };

    server.once('error', (err) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (err && err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        reject(err);
      }
    });

    server.once('listening', () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(true);
    });

    server.listen(port, host);
  });
}

async function getAvailablePort(startPort) {
  const hosts = ['127.0.0.1', '::'];

  for (let port = startPort; port < startPort + 1000; port += 1) {
    let available = true;
    for (const host of hosts) {
      try {
        const ok = await testPort(port, host);
        if (!ok) {
          available = false;
          break;
        }
      } catch (err) {
        if (err && err.code === 'EADDRINUSE') {
          available = false;
          break;
        }
        available = false;
        break;
      }
    }
    if (available) {
      return port;
    }
  }

  throw new Error(`No available port found starting at ${startPort}`);
}

function start(command, args, name, extraEnv = {}) {
  const child = spawn(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, FORCE_COLOR: '1', ...extraEnv },
  });

  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`${name} exited with code ${code}`);
    }
  });

  return child;
}

function openBrowser(url) {
  const preferredBrowser = String(process.env.DEV_BROWSER || 'chrome').toLowerCase();
  const browserCommand = process.platform === 'win32'
    ? 'cmd'
    : process.platform === 'darwin'
      ? 'open'
      : 'xdg-open';

  const browserArgs = process.platform === 'win32'
    ? ['/c', 'start', '', preferredBrowser === 'chrome' ? 'chrome' : preferredBrowser, url]
    : process.platform === 'darwin'
      ? ['-a', preferredBrowser === 'chrome' ? 'Google Chrome' : preferredBrowser, url]
      : [url];

  spawn(browserCommand, browserArgs, {
    cwd: rootDir,
    stdio: 'ignore',
    detached: true,
    shell: process.platform === 'win32',
  }).unref();
}

async function main() {
  const preferredPort = Number(process.env.PORT || 4000);
  const backendPort = await getAvailablePort(preferredPort);
  const proxyTarget = `http://localhost:${backendPort}`;
  const frontendPort = await getAvailablePort(Number(process.env.FRONTEND_PORT || 5180));
  const frontendUrl = `http://localhost:${frontendPort}`;

  console.log(`Starting backend on ${proxyTarget}`);

  const frontend = start(npmCommand, ['run', 'dev:frontend', '--', '--host', 'localhost', '--port', String(frontendPort), '--strictPort'], 'frontend', {
    VITE_API_PROXY_TARGET: proxyTarget,
  });
  const backend = start(npmCommand, ['run', 'dev:backend'], 'backend', {
    PORT: String(backendPort),
  });

  setTimeout(() => openBrowser(frontendUrl), 1500);

  function shutdown() {
    frontend.kill('SIGTERM');
    backend.kill('SIGTERM');
    process.exit(0);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('Failed to start development servers:', error);
  process.exit(1);
});
