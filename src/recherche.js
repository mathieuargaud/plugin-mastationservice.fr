// @ts-check
// Recherche des stations les moins chères, avec repli sur Paris (spec §5).

import { stationsAutour } from './api.js';
import { moinsCheres, NOMBRE_STATIONS } from './classement.js';
import { PARIS } from './position.js';

/** @typedef {import('./types.js').Point} Point */
/** @typedef {import('./types.js').StationVue} StationVue */

export const BANDEAUX = {
  indisponible: 'Position indisponible : prix affichés pour Paris. Saisissez une ville.',
  horsFrance: 'Position hors de France : prix affichés pour Paris.',
};

/** @param {Point} a @param {Point} b */
const memePoint = (a, b) => a.lat === b.lat && a.lon === b.lon;

/**
 * Sans position : Paris. Aucune station autour du point, tous carburants confondus (hors de France) : Paris.
 * Des stations, mais aucune pour ce carburant (E85, GPLc en zone rurale) : liste vide, sans repli.
 * Les erreurs de l'API (ErreurService, AbortError) sont propagées.
 * @param {Point | null} point
 * @param {string} carburant
 * @param {AbortSignal} [signal]
 * @returns {Promise<{stations: StationVue[], bandeau: string | null, point: Point}>}
 */
export async function rechercher(point, carburant, signal) {
  let bandeau = null;
  if (!point) {
    point = PARIS;
    bandeau = BANDEAUX.indisponible;
  }
  let stations = await stationsAutour(point, carburant, signal);
  if (stations.length === 0 && !memePoint(point, PARIS)) {
    // Carburant vide : l'API ne filtre pas.
    if ((await stationsAutour(point, '', signal)).length > 0) return { stations: [], bandeau, point };
    point = PARIS;
    bandeau = BANDEAUX.horsFrance;
    stations = await stationsAutour(point, carburant, signal);
  }
  return { stations: moinsCheres(stations, carburant, NOMBRE_STATIONS), bandeau, point };
}
