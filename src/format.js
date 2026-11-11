// @ts-check
// Formatage des prix, distances et âges des prix pour la popup.

/** @param {number} n @param {number} decimales */
const decimal = (n, decimales) => n.toFixed(decimales).replace('.', ',');

/**
 * Prix en euros à 3 décimales : `1,789 €`.
 * @param {number} prix
 */
export function formaterPrix(prix) {
  return `${decimal(prix, 3)} €`;
}

/**
 * Distance en km à une décimale, `0,1 km` au minimum.
 * @param {number} km
 */
export function formaterDistance(km) {
  return `${decimal(Math.max(km, 0.1), 1)} km`;
}

/**
 * Âge du prix, arrondi à l'inférieur : minutes, heures, puis jours.
 * @param {string} maj date ISO 8601
 * @param {Date} [maintenant]
 */
export function formaterAge(maj, maintenant = new Date()) {
  const minutes = Math.floor((maintenant.getTime() - new Date(maj).getTime()) / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.floor(minutes / 60);
  if (heures < 24) return `il y a ${heures} h`;
  return `il y a ${Math.floor(heures / 24)} j`;
}
