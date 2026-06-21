import { existsSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = fileURLToPath(new URL('.', import.meta.url));
const extendsDir = resolve(dir, '..', 'node_modules', '@sim-phi', 'extends');

if (!existsSync(resolve(extendsDir, 'dist', 'index.js'))) {
  console.log('Building @sim-phi/extends...');
  execSync('npm install && npx vite build', { cwd: extendsDir, stdio: 'inherit' });
  console.log('@sim-phi/extends built.');
}
