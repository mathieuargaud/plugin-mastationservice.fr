# Extension Chrome MaStationService

Extension Chrome (Manifest V3) qui affiche les 6 stations les moins chères d'un carburant autour de l'utilisateur ou d'une ville, à partir de l'API publique `/api/v1` de [www.mastationservice.fr](https://www.mastationservice.fr). Hors de France, ou sans position, elle affiche les prix de Paris.

## Développement

JavaScript ES modules sans build. Node 24.

```bash
npm install
npm test          # Vitest + jsdom, API simulée par tests/fixtures
npm run types     # tsc --noEmit (checkJs)
npm run paquet    # dist/mastationservice-<version>.zip pour le Chrome Web Store
```

Essai dans Chrome : `chrome://extensions`, mode développeur, « Charger l'extension non empaquetée » sur ce dossier.

## Structure

- `manifest.json` : permissions `geolocation`, `storage`, hôte `https://www.mastationservice.fr/*`.
- `popup/` : page de la popup ; `popup.js` ne fait que le câblage du DOM.
- `src/` : API, classement, géolocalisation, préférences, règle de repli sur Paris (`recherche.js`), formatage.
- `icons/` : icônes de l'extension.
- `store/` : textes de la fiche du Store, justification des permissions, politique de confidentialité.

Charte graphique : celle du site www.mastationservice.fr. Les jetons `--mss-*` de `popup/popup.css` doivent rester identiques à ceux du site (`tests/charte.test.js`).

## Publication sur le Chrome Web Store

1. Recette dans Chrome avec l'API de production.
2. Publier `store/confidentialite.md` à une URL publique et la renseigner dans la fiche.
3. Captures d'écran 1280 × 800.
4. Soumettre `dist/mastationservice-<version>.zip` avec les textes de `store/`.

## Licence

Code sous licence MIT (voir [LICENSE](LICENSE)). Le nom MaStationService, le logo et les icônes n'en font pas partie (voir [NOTICE](NOTICE)).
