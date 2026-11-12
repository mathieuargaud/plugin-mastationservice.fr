import { readFileSync } from 'node:fs';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { stockageSimule } from './chrome-simule.js';

vi.mock('../src/api.js', async (original) => ({ ...(await original()), stationsAutour: vi.fn(), autocompleter: vi.fn() }));
vi.mock('../src/position.js', async (original) => ({ ...(await original()), obtenirPosition: vi.fn() }));

const { stationsAutour, autocompleter, ErreurService } = await import('../src/api.js');
const { obtenirPosition, PARIS } = await import('../src/position.js');
const { BANDEAUX } = await import('../src/recherche.js');
const { initialiser } = await import('../popup/popup.js');

const html = readFileSync('popup/popup.html', 'utf8');
const stations = JSON.parse(readFileSync('tests/fixtures/autour.json', 'utf8')).stations;
const communes = JSON.parse(readFileSync('tests/fixtures/communes.json', 'utf8')).communes;
const LYON = { lat: 45.76, lon: 4.83 };

const $ = (sel) => document.querySelector(sel);
const items = () => document.querySelectorAll('#liste li');
const options = () => document.querySelectorAll('#suggestions [role="option"]');
const annulee = () => Object.assign(new Error('annulée'), { name: 'AbortError' });

/** Saisie dans le champ ville, comme au clavier. */
function saisir(texte) {
  $('#ville').value = texte;
  $('#ville').dispatchEvent(new Event('input', { bubbles: true }));
}

/** Touche pressée dans le champ ville. */
function touche(key) {
  $('#ville').dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

beforeEach(() => {
  document.body.innerHTML = html.match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
  globalThis.chrome = stockageSimule();
  stationsAutour.mockReset().mockResolvedValue(stations);
  autocompleter.mockReset().mockResolvedValue([]);
  obtenirPosition.mockReset().mockResolvedValue(LYON);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('popup', () => {
  it('affiche 6 stations', async () => {
    await initialiser(document);
    await vi.waitFor(() => expect(items()).toHaveLength(6));
    const lien = items()[0].querySelector('a');
    expect(lien.href).toBe('https://www.mastationservice.fr/station/93100006');
    expect(lien.target).toBe('_blank');
    expect(lien.rel).toBe('noopener');
    expect(items()[0].textContent).toContain('1,719 €');
    expect(items()[0].textContent).toContain('7,9 km');
    expect(stationsAutour.mock.calls[0].slice(0, 2)).toEqual([LYON, 'gazole']);
    expect($('#bandeau').hidden).toBe(true);
  });

  it('bandeau indisponible', async () => {
    obtenirPosition.mockResolvedValue(null);
    await initialiser(document);
    await vi.waitFor(() => expect($('#bandeau').textContent).toBe(BANDEAUX.indisponible));
    expect($('#bandeau').hidden).toBe(false);
  });

  it('bandeau hors France', async () => {
    stationsAutour.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    await initialiser(document);
    await vi.waitFor(() => expect($('#bandeau').textContent).toBe(BANDEAUX.horsFrance));
    expect(items()).toHaveLength(6);
  });

  it('ville introuvable', async () => {
    await initialiser(document);
    await vi.waitFor(() => expect(items()).toHaveLength(6));
    saisir('Zzzz');
    $('#recherche').requestSubmit();
    await vi.waitFor(() => expect($('#bandeau').textContent).toBe(BANDEAUX.horsFrance));
    expect(stationsAutour.mock.lastCall[0]).toEqual(PARIS);
  });

  it('ville trouvée', async () => {
    autocompleter.mockResolvedValue(communes);
    await initialiser(document);
    await vi.waitFor(() => expect(items()).toHaveLength(6));
    saisir('Lyon');
    $('#recherche').requestSubmit();
    await vi.waitFor(() => expect(stationsAutour).toHaveBeenCalledTimes(2));
    expect(stationsAutour.mock.lastCall[0]).toEqual({ lat: 45.76, lon: 4.83 });
  });

  it('liste des villes affichée après la saisie', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    autocompleter.mockResolvedValue(communes);
    await initialiser(document);
    saisir('Ly');
    await vi.advanceTimersByTimeAsync(250);
    await vi.waitFor(() => expect(options()).toHaveLength(2));
    expect($('#suggestions').hidden).toBe(false);
    expect($('#ville').getAttribute('aria-expanded')).toBe('true');
    expect([...options()].map((o) => o.textContent)).toEqual(['Lyon (69)', 'Lyons-la-Forêt (27)']);
  });

  it('clic sur une ville de la liste', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    autocompleter.mockResolvedValue(communes);
    obtenirPosition.mockResolvedValue(PARIS);
    await initialiser(document);
    saisir('Ly');
    await vi.advanceTimersByTimeAsync(250);
    await vi.waitFor(() => expect(options()).toHaveLength(2));
    options()[1].dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(stationsAutour.mock.lastCall[0]).toEqual({ lat: 49.398, lon: 1.476 }));
    expect($('#ville').value).toBe('Lyons-la-Forêt (27)');
    expect($('#suggestions').hidden).toBe(true);
    expect($('#ville').getAttribute('aria-expanded')).toBe('false');
  });

  it('choix au clavier dans la liste', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    autocompleter.mockResolvedValue(communes);
    obtenirPosition.mockResolvedValue(PARIS);
    await initialiser(document);
    saisir('Ly');
    await vi.advanceTimersByTimeAsync(250);
    await vi.waitFor(() => expect(options()).toHaveLength(2));
    touche('ArrowDown');
    touche('ArrowDown');
    expect($('#ville').getAttribute('aria-activedescendant')).toBe(options()[1].id);
    expect(options()[1].getAttribute('aria-selected')).toBe('true');
    touche('Enter');
    await vi.waitFor(() => expect(stationsAutour.mock.lastCall[0]).toEqual({ lat: 49.398, lon: 1.476 }));
    expect($('#ville').value).toBe('Lyons-la-Forêt (27)');
    expect(autocompleter).toHaveBeenCalledTimes(1);
  });

  it('Échap ferme la liste', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    autocompleter.mockResolvedValue(communes);
    await initialiser(document);
    saisir('Ly');
    await vi.advanceTimersByTimeAsync(250);
    await vi.waitFor(() => expect(options()).toHaveLength(2));
    touche('Escape');
    expect($('#suggestions').hidden).toBe(true);
  });

  it('Entrée après une suggestion choisie', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    autocompleter.mockResolvedValue(communes);
    await initialiser(document);
    await vi.waitFor(() => expect(items()).toHaveLength(6));
    saisir('Ly');
    await vi.advanceTimersByTimeAsync(250);
    await vi.waitFor(() => expect(options()).toHaveLength(2));
    options()[0].dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    $('#recherche').requestSubmit();
    await vi.waitFor(() => expect(items()).toHaveLength(6));
    expect(stationsAutour.mock.lastCall[0]).toEqual({ lat: 45.76, lon: 4.83 });
    expect(autocompleter).toHaveBeenCalledTimes(1);
    expect($('#bandeau').hidden).toBe(true);
  });

  it('position tardive ignorée après une ville', async () => {
    let resoudrePosition;
    obtenirPosition.mockImplementation(() => new Promise((r) => (resoudrePosition = r)));
    autocompleter.mockResolvedValue(communes);
    await initialiser(document);
    saisir('Lyon');
    $('#recherche').requestSubmit();
    await vi.waitFor(() => expect(items()).toHaveLength(6));
    resoudrePosition({ lat: 43.6, lon: 1.44 });
    await new Promise((r) => setTimeout(r, 0));
    expect(stationsAutour).toHaveBeenCalledTimes(1);
    expect(stationsAutour.mock.lastCall[0]).toEqual({ lat: 45.76, lon: 4.83 });
  });

  it('carburant changé pendant la géolocalisation', async () => {
    let resoudrePosition;
    obtenirPosition.mockImplementation(() => new Promise((r) => (resoudrePosition = r)));
    await initialiser(document);
    $('#carburant').value = 'e10';
    $('#carburant').dispatchEvent(new Event('change'));
    await new Promise((r) => setTimeout(r, 0));
    expect(stationsAutour).not.toHaveBeenCalled();
    resoudrePosition(LYON);
    await vi.waitFor(() => expect(stationsAutour).toHaveBeenCalledTimes(1));
    expect(stationsAutour.mock.calls[0].slice(0, 2)).toEqual([LYON, 'e10']);
  });

  it('aucune station', async () => {
    stationsAutour.mockResolvedValue([]);
    await initialiser(document);
    await vi.waitFor(() => expect($('#etat').textContent).toBe('Aucune station trouvée.'));
    expect(items()).toHaveLength(0);
  });

  it('service indisponible puis réessayer', async () => {
    stationsAutour.mockRejectedValueOnce(new ErreurService(503));
    await initialiser(document);
    await vi.waitFor(() => expect($('#etat').textContent).toBe('Service indisponible'));
    expect($('#reessayer').hidden).toBe(false);
    $('#reessayer').click();
    await vi.waitFor(() => expect(items()).toHaveLength(6));
    expect($('#reessayer').hidden).toBe(true);
    expect($('#etat').textContent).toBe('');
  });

  it('carburant restauré', async () => {
    globalThis.chrome = stockageSimule({ carburant: 'sp98' });
    await initialiser(document);
    await vi.waitFor(() => expect(stationsAutour).toHaveBeenCalled());
    expect($('#carburant').value).toBe('sp98');
    expect(stationsAutour.mock.calls[0][1]).toBe('sp98');
  });

  it('carburant mémorisé au changement', async () => {
    await initialiser(document);
    await vi.waitFor(() => expect(items()).toHaveLength(6));
    $('#carburant').value = 'e10';
    $('#carburant').dispatchEvent(new Event('change'));
    await vi.waitFor(() => expect(stationsAutour.mock.lastCall.slice(0, 2)).toEqual([LYON, 'e10']));
    expect(await chrome.storage.sync.get('carburant')).toEqual({ carburant: 'e10' });
  });

  it('dernier carburant gagne', async () => {
    let resoudreLente;
    stationsAutour.mockImplementationOnce(() => new Promise((r) => (resoudreLente = r)));
    await initialiser(document);
    await vi.waitFor(() => expect(stationsAutour).toHaveBeenCalledTimes(1));
    const premierSignal = stationsAutour.mock.calls[0][2];
    const e10 = stations.slice(0, 2).map((s) => ({ ...s, carburants: { e10: s.carburants.gazole } }));
    stationsAutour.mockResolvedValue(e10);
    $('#carburant').value = 'e10';
    $('#carburant').dispatchEvent(new Event('change'));
    await vi.waitFor(() => expect(items()).toHaveLength(2));
    resoudreLente(stations);
    await new Promise((r) => setTimeout(r, 0));
    expect(items()).toHaveLength(2);
    expect(premierSignal.aborted).toBe(true);
  });

  it('frappe rapide sans erreur', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await initialiser(document);
    await vi.waitFor(() => expect(items()).toHaveLength(6));
    saisir('Ly');
    await vi.advanceTimersByTimeAsync(100);
    saisir('Lyo');
    await vi.advanceTimersByTimeAsync(100);
    saisir('Lyon');
    await vi.advanceTimersByTimeAsync(250);
    expect(autocompleter).toHaveBeenCalledTimes(1);
    expect(autocompleter.mock.calls[0][0]).toBe('Lyon');

    autocompleter.mockRejectedValueOnce(annulee());
    saisir('Lyons');
    await vi.advanceTimersByTimeAsync(250);
    expect($('#etat').textContent).toBe('');
  });

  it('pas d’autocomplétion sous 2 caractères', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await initialiser(document);
    saisir('L');
    await vi.advanceTimersByTimeAsync(300);
    expect(autocompleter).not.toHaveBeenCalled();
  });

  it('ma position relance la géolocalisation', async () => {
    await initialiser(document);
    await vi.waitFor(() => expect(items()).toHaveLength(6));
    obtenirPosition.mockResolvedValue({ lat: 43.6, lon: 1.44 });
    $('#ma-position').click();
    await vi.waitFor(() => expect(stationsAutour.mock.lastCall[0]).toEqual({ lat: 43.6, lon: 1.44 }));
  });
});
