// Objet `chrome` minimal pour les tests : chrome.storage.sync en mémoire.

export function stockageSimule(initial = {}) {
  const donnees = { ...initial };
  return {
    storage: {
      sync: {
        get: async (cle) => (cle in donnees ? { [cle]: donnees[cle] } : {}),
        set: async (valeurs) => {
          Object.assign(donnees, valeurs);
        },
      },
    },
  };
}
