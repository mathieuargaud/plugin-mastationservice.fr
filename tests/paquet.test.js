import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const version = JSON.parse(readFileSync('manifest.json', 'utf8')).version;

describe('paquet', () => {
  it('zip du Store sans fichiers de développement', () => {
    execFileSync('node', ['scripts/paquet.js']);
    const entrees = execFileSync('unzip', ['-Z1', `dist/mastationservice-${version}.zip`], { encoding: 'utf8' }).split('\n').filter(Boolean);
    for (const f of ['manifest.json', 'popup/popup.html', 'popup/main.js', 'popup/logo-mark.svg', 'src/api.js', 'icons/icon-128.png']) expect(entrees).toContain(f);
    for (const prefixe of ['tests/', 'node_modules/', 'docs/', 'store/', 'scripts/', '.superpowers/']) {
      expect(entrees.filter((e) => e.startsWith(prefixe)), prefixe).toEqual([]);
    }
  }, 20000);
});
