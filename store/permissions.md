# Justification des permissions (formulaire « Pratiques de confidentialité » du Store)

## Objectif unique

Afficher les stations-service les moins chères autour de l'utilisateur, pour le carburant choisi.

## `geolocation`

Trouver les stations proches de l'utilisateur. La position n'est demandée qu'à l'ouverture de la popup ou au clic sur « Ma position ». Elle est envoyée uniquement à l'API de www.mastationservice.fr pour obtenir les stations voisines, et n'est pas conservée par l'extension.

## `storage`

Mémoriser le carburant choisi (gazole, SP95…) entre deux ouvertures de la popup, dans `chrome.storage.sync`. Aucune autre donnée n'est stockée.

## Autorisation d'hôte `https://www.mastationservice.fr/*`

Lire les prix des stations et la liste des communes depuis l'API publique de www.mastationservice.fr (`/api/v1/stations/autour`, `/api/v1/communes/autocompletion`). Aucun autre site n'est contacté.

## Code distant

Aucun. Tout le code exécuté est dans le paquet.

## Données utilisateur

- Données de localisation : utilisées pour la fonction principale, non vendues, non transférées à des tiers, non utilisées pour la publicité ni l'évaluation de solvabilité.
- Aucune autre catégorie de données collectée.
