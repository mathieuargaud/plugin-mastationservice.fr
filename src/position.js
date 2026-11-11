// @ts-check
// Géolocalisation du navigateur ; Paris sert de position de repli.

/** @typedef {import('./types.js').Point} Point */

/** @type {Point} */
export const PARIS = { lat: 48.8566, lon: 2.3522 };
export const DELAI_POSITION_MS = 10000;

/**
 * Position de l'utilisateur, ou `null` si refusée, indisponible ou trop lente. Ne rejette jamais.
 * @returns {Promise<Point | null>}
 */
export function obtenirPosition() {
  return new Promise((resoudre) => {
    if (!navigator.geolocation) return resoudre(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resoudre({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => resoudre(null),
      { timeout: DELAI_POSITION_MS, maximumAge: 300000 },
    );
  });
}
