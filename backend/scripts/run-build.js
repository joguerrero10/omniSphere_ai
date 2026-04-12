const { existsSync } = require('node:fs');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');

const nestBin = join(__dirname, '..', 'node_modules', '.bin', process.platform === 'win32' ? 'nest.cmd' : 'nest');

if (!existsSync(nestBin)) {
  console.warn('⚠️ Build omitido: faltan dependencias de desarrollo (Nest CLI).');
  console.warn('Instala dependencias completas con: npm install --prefix backend --include=dev');
  process.exit(0);
}

const result = spawnSync(nestBin, ['build'], { stdio: 'inherit' });
process.exit(result.status ?? 1);
