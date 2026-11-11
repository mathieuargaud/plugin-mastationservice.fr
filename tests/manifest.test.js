import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const m = JSON.parse(readFileSync('manifest.json', 'utf8'));

describe('manifest', () => {
  it('MV3, permissions minimales', () => {
    expect(m.manifest_version).toBe(3);
    expect([...m.permissions].sort()).toEqual(['geolocation', 'storage']);
    expect(m.host_permissions).toEqual(['https://www.mastationservice.fr/*']);
    expect(m.background).toBeUndefined();
    expect(m.key).toBeUndefined();
  });

  it('popup et icônes', () => {
    expect(m.action.default_popup).toBe('popup/popup.html');
    for (const t of ['16', '32', '48', '128']) expect(m.icons[t]).toBe(`icons/icon-${t}.png`);
  });
});
