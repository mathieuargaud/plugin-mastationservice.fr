# Extension Chrome MaStationService

Extension Chrome (Manifest V3) qui affiche les 6 stations les moins chères d'un carburant autour de l'utilisateur ou d'une ville, à partir de l'API `/api/v1` de www.mastationservice.fr. Hors de France, ou sans position, elle affiche les prix de Paris.

Redmine : #303. Spec : `docs/superpowers/specs/2026-11-11-plugin-chrome-design.md`.

## Développement

JavaScript ES modules sans build. Node 24.

```bash
npm install
npm test          # Vitest + jsdom, API simulée par tests/fixtures
npm run types     # tsc --noEmit (checkJs)
npm run paquet    # dist/mastationservice-<version>.zip pour le Store
```

Essai dans Chrome : `chrome://extensions`, mode développeur, « Charger l'extension non empaquetée » sur ce dossier. Tant que `/api/v1` n'est pas en production (refonte #288), la popup affiche « Service indisponible ».

## Structure

- `manifest.json` : permissions `geolocation`, `storage`, hôte `https://www.mastationservice.fr/*`.
- `popup/` : page de la popup ; `popup.js` ne fait que le câblage du DOM.
- `src/` : API, classement, géolocalisation, préférences, règle de repli sur Paris (`recherche.js`), formatage.
- `icons/` : rendues depuis `docs/charte/pack-final/brand/logo-mark.svg` du dépôt du site.
- `store/` : textes de la fiche, justification des permissions, politique de confidentialité.

Charte graphique : celle du site (Redmine #291). Les jetons `--mss-*` de `popup/popup.css` doivent rester identiques à `front/src/styles/jetons.css` du site (`tests/charte.test.js`).

## Publication (à faire par Mathieu)

1. Mise en production de `/api/v1`, puis recette dans Chrome.
2. Compte développeur du Chrome Web Store.
3. Publier `store/confidentialite.md` à une URL publique et la renseigner dans la fiche.
4. Captures d'écran 1280 × 800.
5. Soumettre `dist/mastationservice-<version>.zip` avec les textes de `store/`.
