// @ts-check
// Classement des stations les moins chères pour un carburant.

/** @typedef {import('./types.js').StationVue} StationVue */

export const NOMBRE_STATIONS = 6;

/**
 * Stations qui proposent `carburant`, par prix croissant (égalité : la plus proche d'abord).
 * @param {StationVue[]} stations
 * @param {string} carburant
 * @param {number} [n]
 * @returns {StationVue[]}
 */
export function moinsCheres(stations, carburant, n = NOMBRE_STATIONS) {
  return stations
    .filter((s) => s.carburants?.[carburant])
    .sort((a, b) => a.carburants[carburant].prix - b.carburants[carburant].prix || a.distance_km - b.distance_km)
    .slice(0, n);
}
