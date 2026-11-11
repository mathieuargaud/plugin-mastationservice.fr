// @ts-check
// Carburant choisi, mémorisé dans chrome.storage.sync.

export const CARBURANTS = ['gazole', 'sp95', 'sp98', 'e10', 'e85', 'gplc'];
export const CARBURANT_DEFAUT = 'gazole';

/** @returns {Promise<string>} code carburant mémorisé, `gazole` si absent ou inconnu */
export async function lireCarburant() {
  const { carburant } = await chrome.storage.sync.get('carburant');
  return typeof carburant === 'string' && CARBURANTS.includes(carburant) ? carburant : CARBURANT_DEFAUT;
}

/** @param {string} code */
export async function ecrireCarburant(code) {
  await chrome.storage.sync.set({ carburant: code });
}
