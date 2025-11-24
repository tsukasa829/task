import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = join(__dirname, '..');
const publicDir = join(rootDir, 'public');
const distDir = join(rootDir, 'dist');

// WASMファイルとdataファイルをコピー
const files = ['pglite.wasm', 'pglite.data'];

files.forEach(file => {
  const src = join(publicDir, file);
  const dest = join(distDir, file);
  
  if (existsSync(src)) {
    console.log(`Copying ${file} to dist/`);
    copyFileSync(src, dest);
  } else {
    console.warn(`Warning: ${file} not found in public/`);
  }
});

console.log('WASM files copied successfully!');
