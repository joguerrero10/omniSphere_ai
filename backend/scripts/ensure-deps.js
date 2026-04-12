const { existsSync } = require('node:fs');
const { join } = require('node:path');

const nestBin = join(__dirname, '..', 'node_modules', '.bin', process.platform === 'win32' ? 'nest.cmd' : 'nest');

if (!existsSync(nestBin)) {
  console.error('❌ Dependencias de backend no instaladas.');
  console.error('Ejecuta: npm install --prefix backend');
  process.exit(1);
}
