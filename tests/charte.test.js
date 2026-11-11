import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

// Valeurs de front/src/styles/jetons.css du site (Redmine #291).
const JETONS_SITE = {
  '--mss-bleu': '#005185',
  '--mss-bleu-clair': '#0a6aa8',
  '--mss-vert': '#bdd72d',
  '--mss-sur-vert': '#1f2a00',
  '--mss-fond': '#f1f5f9',
  '--mss-texte': '#0f172a',
  '--mss-texte-doux': '#475569',
  '--mss-carte': '#ffffff',
  '--mss-bordure': '#e2e8f0',
  '--mss-alerte': '#a4262c',
};

const css = readFileSync('popup/popup.css', 'utf8');
const racine = css.match(/:root\s*{([^}]*)}/)?.[1] ?? '';
const jetons = Object.fromEntries([...racine.matchAll(/(--mss-[\w-]+)\s*:\s*([^;]+);/g)].map(([, n, v]) => [n, v.trim()]));

/** Luminance relative WCAG 2.1 d'une couleur `#rrggbb`. */
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a, b) {
  const [claire, sombre] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (claire + 0.05) / (sombre + 0.05);
}

describe('charte graphique', () => {
  it('jetons identiques au site', () => {
    for (const [nom, valeur] of Object.entries(JETONS_SITE)) expect(jetons[nom], nom).toBe(valeur);
  });

  it.each([
    ['#0f172a', '#f1f5f9'],
    ['#ffffff', '#005185'],
    ['#ffffff', '#0a6aa8'],
    ['#1f2a00', '#bdd72d'],
    ['#a4262c', '#ffffff'],
    ['#475569', '#ffffff'],
    ['#4a3b00', '#fff4ce'],
  ])('contraste %s sur %s ≥ 4,5', (texte, fond) => {
    expect(contraste(texte, fond)).toBeGreaterThanOrEqual(4.5);
  });

  it('bandeau de repli aux couleurs prévues', () => {
    expect(css).toMatch(/#fff4ce/i);
    expect(css).toMatch(/#4a3b00/i);
  });
});
