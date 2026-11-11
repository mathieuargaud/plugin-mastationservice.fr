import { readFileSync } from 'node:fs';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { stationsAutour, autocompleter, ErreurService, BASE_API, RAYON_KM, DELAI_API_MS } from '../src/api.js';

const fixture = (nom) => JSON.parse(readFileSync(`tests/fixtures/${nom}.json`, 'utf8'));
const reponse = (corps, status = 200) =>
  new Response(JSON.stringify(corps), { status, headers: { 'Content-Type': status < 400 ? 'application/json' : 'application/problem+json' } });

beforeEach(() => {
  globalThis.fetch = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('constantes', () => {
  it('base v1, rayon 20, délai 8 s', () => {
    expect(BASE_API).toBe('https://www.mastationservice.fr/api/v1');
    expect(RAYON_KM).toBe(20);
    expect(DELAI_API_MS).toBe(8000);
  });
});

describe('stationsAutour', () => {
  it('appelle autour', async () => {
    fetch.mockResolvedValue(reponse(fixture('autour')));
    const stations = await stationsAutour({ lat: 48.8566, lon: 2.3522 }, 'gazole');
    expect(fetch.mock.calls[0][0]).toBe('https://www.mastationservice.fr/api/v1/stations/autour?lat=48.8566&lon=2.3522&rayon=20&carburant=gazole');
    expect(stations).toHaveLength(8);
  });

  it('503 problem+json', async () => {
    fetch.mockResolvedValue(reponse(fixture('probleme-503'), 503));
    await expect(stationsAutour({ lat: 1, lon: 1 }, 'gazole')).rejects.toMatchObject({ name: 'ErreurService', statut: 503 });
  });

  it('429', async () => {
    fetch.mockResolvedValue(reponse({ status: 429, title: 'Trop de requêtes' }, 429));
    const e = await stationsAutour({ lat: 1, lon: 1 }, 'gazole').catch((x) => x);
    expect(e).toBeInstanceOf(ErreurService);
    expect(e.statut).toBe(429);
  });

  it('400 : détail dans la console', async () => {
    const console_ = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetch.mockResolvedValue(reponse({ status: 400, detail: 'Carburant inconnu : gpl' }, 400));
    await expect(stationsAutour({ lat: 1, lon: 1 }, 'gpl')).rejects.toMatchObject({ statut: 400 });
    expect(console_.mock.calls.flat().join(' ')).toContain('Carburant inconnu : gpl');
  });

  it('réseau coupé', async () => {
    fetch.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(stationsAutour({ lat: 1, lon: 1 }, 'gazole')).rejects.toMatchObject({ name: 'ErreurService', statut: null });
  });

  it('délai dépassé', async () => {
    vi.useFakeTimers();
    fetch.mockImplementation((_url, { signal }) => new Promise((_, rejeter) => signal.addEventListener('abort', () => rejeter(signal.reason))));
    const promesse = stationsAutour({ lat: 1, lon: 1 }, 'gazole').catch((x) => x);
    await vi.advanceTimersByTimeAsync(8000);
    const e = await promesse;
    expect(e).toBeInstanceOf(ErreurService);
    expect(e.statut).toBeNull();
  });

  it('annulation propagée telle quelle', async () => {
    fetch.mockImplementation((_url, { signal }) => Promise.reject(signal.reason));
    const controleur = new AbortController();
    controleur.abort();
    const e = await stationsAutour({ lat: 1, lon: 1 }, 'gazole', controleur.signal).catch((x) => x);
    expect(e.name).toBe('AbortError');
    expect(e).not.toBeInstanceOf(ErreurService);
  });
});

describe('autocompleter', () => {
  it('encode q', async () => {
    fetch.mockResolvedValue(reponse(fixture('communes')));
    const communes = await autocompleter("L'Haÿ-les-Roses");
    expect(fetch.mock.calls[0][0]).toMatch(/\/communes\/autocompletion\?q=L(%27|')Ha%C3%BF-les-Roses$/);
    expect(communes[0].nom).toBe('Lyon');
  });
});
