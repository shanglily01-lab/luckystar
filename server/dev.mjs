import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const children = [
  spawn(process.execPath, [join(root, 'server', 'index.mjs')], { cwd: root, stdio: 'inherit' }),
  spawn('npx vite --host 127.0.0.1 --port 5173', { cwd: root, stdio: 'inherit', shell: true }),
];

function stop() {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
}

process.on('SIGINT', () => {
  stop();
  process.exit(0);
});
process.on('SIGTERM', () => {
  stop();
  process.exit(0);
});

for (const child of children) {
  child.on('exit', (code) => {
    if (code && code !== 0) {
      stop();
      process.exit(code);
    }
  });
}
