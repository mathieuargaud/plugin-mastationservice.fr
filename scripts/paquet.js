// Paquet du Chrome Web Store : dist/mastationservice-<version>.zip, sans tests ni outils.

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';

const { version } = JSON.parse(readFileSync('manifest.json', 'utf8'));
const zip = `dist/mastationservice-${version}.zip`;

mkdirSync('dist', { recursive: true });
rmSync(zip, { force: true });
execFileSync('zip', ['-r', '-X', '-q', zip, 'manifest.json', 'popup', 'src', 'icons'], { stdio: 'inherit' });
console.log(zip);
