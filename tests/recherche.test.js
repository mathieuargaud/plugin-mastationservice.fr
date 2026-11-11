import { readFileSync } from 'node:fs';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api.js', async (original) => ({ ...(await original()), stationsAutour: vi.fn() }));

const { stationsAutour, ErreurService } = await import('../src/api.js');
const { rechercher, BANDEAUX } = await import('../src/recherche.js');
const { PARIS } = await import('../src/position.js');

const stations = JSON.parse(readFileSync('tests/fixtures/autour.json', 'utf8')).stations;
const LYON = { lat: 45.76, lon: 4.83 };
const GENEVE = { lat: 46.2044, lon: 6.1432 };

beforeEach(() => {
  stationsAutour.mockReset();
});

describe('rechercher', () => {
  it('textes des bandeaux', () => {
    expect(BANDEAUX.indisponible).toBe('Position indisponible : prix affichés pour Paris. Saisissez une ville.');
    expect(BANDEAUX.horsFrance).toBe('Position hors de France : prix affichés pour Paris.');
  });

  it('position connue', async () => {
    stationsAutour.mockResolvedValue(stations);
    const r = await rechercher(LYON, 'gazole');
    expect(stationsAutour).toHaveBeenCalledTimes(1);
    expect(stationsAutour.mock.calls[0].slice(0, 2)).toEqual([LYON, 'gazole']);
    expect(r.bandeau).toBeNull();
    expect(r.point).toEqual(LYON);
    expect(r.stations.map((s) => s.id)).toEqual(['93100006', '75020004', '75011002', '92100008', '75012001', '75010003']);
  });

  it('position null', async () => {
    stationsAutour.mockResolvedValue(stations);
    const r = await rechercher(null, 'gazole');
    expect(stationsAutour.mock.calls[0][0]).toEqual(PARIS);
    expect(r.bandeau).toBe(BANDEAUX.indisponible);
    expect(r.point).toEqual(PARIS);
  });

  it('hors de France', async () => {
    stationsAutour.mockResolvedValueOnce([]).mockResolvedValueOnce(stations);
    const r = await rechercher(GENEVE, 'gazole');
    expect(stationsAutour).toHaveBeenCalledTimes(2);
    expect(stationsAutour.mock.calls[1][0]).toEqual(PARIS);
    expect(r.bandeau).toBe(BANDEAUX.horsFrance);
    expect(r.point).toEqual(PARIS);
    expect(r.stations).toHaveLength(6);
  });

  it('Paris vide aussi', async () => {
    stationsAutour.mockResolvedValue([]);
    const r = await rechercher(GENEVE, 'gazole');
    expect(r.stations).toEqual([]);
    expect(r.bandeau).toBe(BANDEAUX.horsFrance);
  });

  it('Paris vide sans second appel', async () => {
    stationsAutour.mockResolvedValue([]);
    const r = await rechercher(PARIS, 'gazole');
    expect(stationsAutour).toHaveBeenCalledTimes(1);
    expect(r.bandeau).toBeNull();
  });

  it('erreur propagée', async () => {
    stationsAutour.mockRejectedValue(new ErreurService(503));
    await expect(rechercher(LYON, 'gazole')).rejects.toBeInstanceOf(ErreurService);
    expect(stationsAutour).toHaveBeenCalledTimes(1);
  });

  it('signal transmis', async () => {
    stationsAutour.mockResolvedValue(stations);
    const signal = new AbortController().signal;
    await rechercher(LYON, 'gazole', signal);
    expect(stationsAutour.mock.calls[0][2]).toBe(signal);
  });
});
