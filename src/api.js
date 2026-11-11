// @ts-check
// Accès à l'API /api/v1 de www.mastationservice.fr (jamais /api/latest).

/** @typedef {import('./types.js').Point} Point */
/** @typedef {import('./types.js').StationVue} StationVue */
/** @typedef {import('./types.js').Commune} Commune */

export const BASE_API = 'https://www.mastationservice.fr/api/v1';
export const RAYON_KM = 20;
export const DELAI_API_MS = 8000;

/** API injoignable ou en erreur : réseau, délai dépassé (`statut` null) ou réponse HTTP en erreur. */
export class ErreurService extends Error {
  /** @param {number | null} statut @param {string} [detail] */
  constructor(statut, detail) {
    super(detail ?? (statut ? `HTTP ${statut}` : 'API injoignable'));
    this.name = 'ErreurService';
    this.statut = statut;
  }
}

/**
 * GET JSON avec un délai de DELAI_API_MS. Une annulation par `signal` est relancée telle quelle
 * (AbortError) ; toute autre erreur devient une ErreurService.
 * @param {string} url
 * @param {AbortSignal} [signal]
 * @returns {Promise<any>}
 */
async function lireJson(url, signal) {
  const controleur = new AbortController();
  const minuterie = setTimeout(() => controleur.abort(), DELAI_API_MS);
  const relayer = () => controleur.abort(signal?.reason);
  if (signal?.aborted) relayer();
  signal?.addEventListener('abort', relayer);
  try {
    const reponse = await fetch(url, { signal: controleur.signal, headers: { Accept: 'application/json' } });
    if (!reponse.ok) {
      const probleme = await reponse.json().catch(() => null);
      if (reponse.status === 400) console.error('API mastationservice :', probleme?.detail ?? probleme);
      throw new ErreurService(reponse.status, probleme?.detail);
    }
    return await reponse.json();
  } catch (e) {
    if (signal?.aborted || e instanceof ErreurService) throw e;
    throw new ErreurService(null, e instanceof Error ? e.message : String(e));
  } finally {
    clearTimeout(minuterie);
    signal?.removeEventListener('abort', relayer);
  }
}

/**
 * Stations dans un rayon de RAYON_KM autour de `point` qui proposent `carburant`.
 * @param {Point} point
 * @param {string} carburant
 * @param {AbortSignal} [signal]
 * @returns {Promise<StationVue[]>}
 */
export async function stationsAutour(point, carburant, signal) {
  const params = new URLSearchParams({ lat: String(point.lat), lon: String(point.lon), rayon: String(RAYON_KM), carburant });
  const corps = await lireJson(`${BASE_API}/stations/autour?${params}`, signal);
  return corps.stations ?? [];
}

/**
 * Communes françaises dont le nom commence par `q` (2 caractères au moins).
 * @param {string} q
 * @param {AbortSignal} [signal]
 * @returns {Promise<Commune[]>}
 */
export async function autocompleter(q, signal) {
  const corps = await lireJson(`${BASE_API}/communes/autocompletion?${new URLSearchParams({ q })}`, signal);
  return corps.communes ?? [];
}
