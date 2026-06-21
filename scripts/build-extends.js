import { existsSync, cpSync, rmSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dir = fileURLToPath(new URL('.', import.meta.url));
const extendsDir = resolve(dir, '..', 'node_modules', '@sim-phi', 'extends');
const sourceDir = resolve(extendsDir, 'src');

if (existsSync(resolve(extendsDir, 'dist', 'index.js'))) {
  process.exit(0);
}

console.log('Building @sim-phi/extends...');

// npm pack respects "files": ["dist"] in extends' package.json,
// so src/ and vite.config.ts are stripped on CI.
// Clone the full repo to a temp dir when source is missing.
if (!existsSync(sourceDir)) {
  const cloneDir = resolve(dir, '..', '.extends-tmp');
  rmSync(cloneDir, { recursive: true, force: true });
  execSync('git clone --depth 1 https://github.com/sim-phi/extends.git ' + JSON.stringify(cloneDir), { stdio: 'inherit', cwd: dir });
  execSync('npm install && npm run build', { cwd: cloneDir, stdio: 'inherit' });
  cpSync(resolve(cloneDir, 'dist'), resolve(extendsDir, 'dist'), { recursive: true });
  rmSync(cloneDir, { recursive: true, force: true });
} else {
  execSync('npm install && npm run build', { cwd: extendsDir, stdio: 'inherit' });
}

console.log('@sim-phi/extends built.');
