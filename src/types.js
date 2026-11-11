// @ts-check
// Types des réponses de l'API /api/v1 (spec §3).

/**
 * @typedef {{lat: number, lon: number}} Point
 *
 * @typedef {'verte' | 'orange' | 'rouge'} Fraicheur
 *
 * @typedef {{prix: number, maj: string, fraicheur: Fraicheur}} PrixVue
 *
 * @typedef {{
 *   id: string,
 *   distance_km: number,
 *   lat: number,
 *   lon: number,
 *   enseigne: string,
 *   type_lieu: string,
 *   icone: string,
 *   adresse: string,
 *   ville: string,
 *   services: string[],
 *   maj: string,
 *   carburants: Record<string, PrixVue>,
 *   ruptures?: Record<string, string>,
 * }} StationVue
 *
 * @typedef {{
 *   nom: string,
 *   slug: string,
 *   code_postal: string | null,
 *   departement: string | null,
 *   location: Point,
 *   population: number | null,
 * }} Commune
 */

export {};
