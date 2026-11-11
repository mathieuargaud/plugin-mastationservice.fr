import { describe, it, expect } from 'vitest';
import { moinsCheres, NOMBRE_STATIONS } from '../src/classement.js';

/** Station minimale avec un prix gazole (ou sans carburant si `prix` est null). */
function station(id, prix, distance_km = 1) {
  const carburants = prix === null ? {} : { gazole: { prix, maj: '2026-11-11T08:00:00Z', fraicheur: 'verte' } };
  return { id, distance_km, lat: 0, lon: 0, enseigne: id, type_lieu: 'fuel', icone: 'Station', adresse: '', ville: '', services: [], maj: '2026-11-11T08:00:00Z', carburants };
}

describe('moinsCheres', () => {
  it('trie par prix croissant et garde 6', () => {
    const prix = [1.9, 1.7, 1.85, 1.75, 1.95, 1.8, 1.72, 1.99];
    const liste = prix.map((p, i) => station(`s${i}`, p));
    expect(NOMBRE_STATIONS).toBe(6);
    expect(moinsCheres(liste, 'gazole').map((s) => s.id)).toEqual(['s1', 's6', 's3', 's5', 's2', 's0']);
  });

  it('égalité départagée par la distance', () => {
    const r = moinsCheres([station('loin', 1.799, 4.0), station('pres', 1.799, 1.5)], 'gazole');
    expect(r.map((s) => s.id)).toEqual(['pres', 'loin']);
  });

  it('ignore station sans ce carburant', () => {
    const r = moinsCheres([station('sans', null), station('avec', 1.8)], 'gazole');
    expect(r.map((s) => s.id)).toEqual(['avec']);
  });

  it('liste vide', () => {
    expect(moinsCheres([], 'gazole')).toEqual([]);
  });
});
