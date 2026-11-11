// @ts-check
// Popup : câblage du DOM. La règle de recherche et de repli sur Paris est dans src/recherche.js.

import { autocompleter, ErreurService } from '../src/api.js';
import { formaterAge, formaterDistance, formaterPrix } from '../src/format.js';
import { obtenirPosition, PARIS } from '../src/position.js';
import { ecrireCarburant, lireCarburant } from '../src/preferences.js';
import { BANDEAUX, rechercher } from '../src/recherche.js';

/** @typedef {import('../src/types.js').Point} Point */
/** @typedef {import('../src/types.js').Commune} Commune */
/** @typedef {import('../src/types.js').StationVue} StationVue */

const LIEN_STATION = 'https://www.mastationservice.fr/station/';
const ANTI_REBOND_MS = 250;
const MESSAGES = {
  recherche: 'Recherche en cours…',
  aucune: 'Aucune station trouvée.',
  indisponible: 'Service indisponible',
};

/** @param {unknown} e */
const estAnnulation = (e) => e instanceof Error && e.name === 'AbortError';

/** Libellé d'une commune dans les suggestions, département compris (homonymes). @param {Commune} c */
const libelle = (c) => (c.departement ? `${c.nom} (${c.departement})` : c.nom);

/**
 * Branche la popup sur le document et lance la première recherche (sans l'attendre).
 * @param {Document} racine
 */
export async function initialiser(racine) {
  const element = (/** @type {string} */ id) => /** @type {any} */ (racine.getElementById(id));
  /** @type {HTMLFormElement} */ const formulaire = element('recherche');
  /** @type {HTMLInputElement} */ const ville = element('ville');
  /** @type {HTMLDataListElement} */ const suggestions = element('suggestions');
  /** @type {HTMLButtonElement} */ const maPosition = element('ma-position');
  /** @type {HTMLSelectElement} */ const carburant = element('carburant');
  /** @type {HTMLElement} */ const bandeau = element('bandeau');
  /** @type {HTMLElement} */ const etat = element('etat');
  /** @type {HTMLButtonElement} */ const reessayer = element('reessayer');
  /** @type {HTMLOListElement} */ const liste = element('liste');

  /** Dernière recherche de stations, relancée au changement de carburant. */
  let derniere = { point: /** @type {Point | null} */ (null), bandeau: /** @type {string | null} */ (null) };
  /** Action relancée par « Réessayer ». */
  let relancer = () => {};
  let recherche = new AbortController();
  let saisie = new AbortController();
  /** Contrôleur de la géolocalisation en cours ; égal à `recherche` tant qu'elle n'a pas répondu. */
  let attentePosition = /** @type {AbortController | null} */ (null);
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let minuterie;
  /** Suggestions affichées et le texte qui les a produites. */
  let proposees = { texte: '', communes: /** @type {Commune[]} */ ([]) };

  /** @param {string} texte @param {boolean} [erreur] */
  function afficherEtat(texte, erreur = false) {
    etat.textContent = texte;
    etat.classList.toggle('erreur', erreur);
    reessayer.hidden = !erreur;
  }

  /** @param {string | null} texte */
  function afficherBandeau(texte) {
    bandeau.textContent = texte ?? '';
    bandeau.hidden = !texte;
  }

  /** @param {string} classe @param {string} texte */
  function span(classe, texte) {
    const s = racine.createElement('span');
    s.className = classe;
    s.textContent = texte;
    return s;
  }

  /** @param {StationVue[]} stations */
  function afficherStations(stations) {
    liste.replaceChildren(
      ...stations.map((s, i) => {
        const prix = s.carburants[carburant.value];
        const lien = racine.createElement('a');
        lien.className = 'station';
        lien.href = LIEN_STATION + encodeURIComponent(s.id);
        lien.target = '_blank';
        lien.rel = 'noopener';
        lien.append(
          span('enseigne', s.enseigne),
          span(i === 0 ? 'prix moins-cher' : 'prix', formaterPrix(prix.prix)),
          span('details', `${s.ville} · ${formaterDistance(s.distance_km)}`),
          span(`age fraicheur-${prix.fraicheur}`, formaterAge(prix.maj)),
        );
        const li = racine.createElement('li');
        li.append(lien);
        return li;
      }),
    );
  }

  /**
   * Recherche des stations ; une nouvelle recherche annule la précédente.
   * @param {Point | null} point
   * @param {string | null} [bandeauImpose] bandeau affiché à la place de celui de `rechercher`
   */
  async function lancer(point, bandeauImpose = null) {
    derniere = { point, bandeau: bandeauImpose };
    relancer = () => lancer(point, bandeauImpose);
    recherche.abort();
    const controleur = (recherche = new AbortController());
    afficherEtat(MESSAGES.recherche);
    liste.replaceChildren();
    try {
      const r = await rechercher(point, carburant.value, controleur.signal);
      if (controleur.signal.aborted) return;
      afficherBandeau(bandeauImpose ?? r.bandeau);
      afficherStations(r.stations);
      afficherEtat(r.stations.length ? '' : MESSAGES.aucune);
    } catch (e) {
      if (controleur.signal.aborted || estAnnulation(e)) return;
      if (!(e instanceof ErreurService)) console.error(e);
      afficherEtat(MESSAGES.indisponible, true);
    }
  }

  /** Géolocalisation en cours ; abandonnée si l'utilisateur lance une autre recherche entre-temps. */
  async function depuisPosition() {
    recherche.abort();
    const attente = (recherche = attentePosition = new AbortController());
    afficherEtat(MESSAGES.recherche);
    const point = await obtenirPosition();
    if (recherche !== attente) return;
    await lancer(point);
  }

  /** @param {string} texte @returns {Promise<Commune[]>} */
  async function chargerCommunes(texte) {
    saisie.abort();
    const controleur = (saisie = new AbortController());
    const communes = await autocompleter(texte, controleur.signal);
    proposees = { texte, communes };
    suggestions.replaceChildren(
      ...communes.map((c) => {
        const option = racine.createElement('option');
        option.value = libelle(c);
        return option;
      }),
    );
    return communes;
  }

  /** Ville validée : la suggestion correspondante, sinon la première, sinon Paris. @param {string} texte */
  async function valider(texte) {
    relancer = () => valider(texte);
    // Suggestion déjà choisie (« Lyon (69) ») : l'API ne connaît pas ce libellé.
    const proposee = proposees.communes.find((c) => libelle(c) === texte);
    if (proposee) {
      await lancer(proposee.location);
      return;
    }
    let communes;
    try {
      communes = proposees.texte === texte ? proposees.communes : await chargerCommunes(texte);
    } catch (e) {
      if (estAnnulation(e)) return;
      if (!(e instanceof ErreurService)) console.error(e);
      afficherEtat(MESSAGES.indisponible, true);
      return;
    }
    const minuscule = texte.toLowerCase();
    const choisie = communes.find((c) => libelle(c) === texte || c.nom.toLowerCase() === minuscule) ?? communes[0];
    if (choisie) await lancer(choisie.location);
    else await lancer(PARIS, BANDEAUX.horsFrance);
  }

  ville.addEventListener('input', () => {
    clearTimeout(minuterie);
    const texte = ville.value.trim();
    // Suggestion choisie dans la liste : recherche immédiate.
    const choisie = proposees.communes.find((c) => libelle(c) === texte);
    if (choisie) {
      saisie.abort();
      lancer(choisie.location);
      return;
    }
    if (texte.length < 2) {
      saisie.abort();
      suggestions.replaceChildren();
      return;
    }
    minuterie = setTimeout(() => {
      chargerCommunes(texte).catch((e) => {
        if (!estAnnulation(e)) console.error(e);
      });
    }, ANTI_REBOND_MS);
  });

  formulaire.addEventListener('submit', (evenement) => {
    evenement.preventDefault();
    clearTimeout(minuterie);
    const texte = ville.value.trim();
    if (texte) valider(texte);
  });

  maPosition.addEventListener('click', () => {
    ville.value = '';
    depuisPosition();
  });

  carburant.addEventListener('change', () => {
    ecrireCarburant(carburant.value);
    // Géolocalisation en cours : sa recherche partira avec le nouveau carburant.
    if (recherche === attentePosition) return;
    lancer(derniere.point, derniere.bandeau);
  });

  reessayer.addEventListener('click', () => relancer());

  carburant.value = await lireCarburant();
  depuisPosition();
}
