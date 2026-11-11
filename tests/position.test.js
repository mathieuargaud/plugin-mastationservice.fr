import { describe, it, expect, vi, afterEach } from 'vitest';
import { obtenirPosition, PARIS, DELAI_POSITION_MS } from '../src/position.js';

/** Remplace navigator.geolocation ; `comportement(succes, erreur, options)`. */
function geoloc(comportement) {
  const getCurrentPosition = vi.fn(comportement);
  Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition }, configurable: true });
  return getCurrentPosition;
}

afterEach(() => {
  Object.defineProperty(navigator, 'geolocation', { value: undefined, configurable: true });
});

describe('position', () => {
  it('Paris et délai', () => {
    expect(PARIS).toEqual({ lat: 48.8566, lon: 2.3522 });
    expect(DELAI_POSITION_MS).toBe(10000);
  });

  it('succès', async () => {
    geoloc((ok) => ok({ coords: { latitude: 45.76, longitude: 4.83 } }));
    expect(await obtenirPosition()).toEqual({ lat: 45.76, lon: 4.83 });
  });

  it('refus', async () => {
    geoloc((_ok, erreur) => erreur({ code: 1, message: 'User denied Geolocation' }));
    expect(await obtenirPosition()).toBeNull();
  });

  it('délai', async () => {
    const appel = geoloc((_ok, erreur) => erreur({ code: 3, message: 'Timeout expired' }));
    expect(await obtenirPosition()).toBeNull();
    expect(appel.mock.calls[0][2]).toMatchObject({ timeout: 10000 });
  });

  it('API absente', async () => {
    expect(await obtenirPosition()).toBeNull();
  });
});
