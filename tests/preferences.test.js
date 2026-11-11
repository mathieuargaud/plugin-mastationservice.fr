import { describe, it, expect, beforeEach } from 'vitest';
import { lireCarburant, ecrireCarburant, CARBURANTS, CARBURANT_DEFAUT } from '../src/preferences.js';
import { stockageSimule } from './chrome-simule.js';

beforeEach(() => {
  globalThis.chrome = stockageSimule();
});

describe('preferences', () => {
  it('codes et défaut', () => {
    expect(CARBURANTS).toEqual(['gazole', 'sp95', 'sp98', 'e10', 'e85', 'gplc']);
    expect(CARBURANT_DEFAUT).toBe('gazole');
  });

  it('défaut gazole', async () => {
    expect(await lireCarburant()).toBe('gazole');
  });

  it('relit la valeur écrite', async () => {
    await ecrireCarburant('sp98');
    expect(await lireCarburant()).toBe('sp98');
  });

  it('valeur inconnue ignorée', async () => {
    globalThis.chrome = stockageSimule({ carburant: 'gpl' });
    expect(await lireCarburant()).toBe('gazole');
  });
});
