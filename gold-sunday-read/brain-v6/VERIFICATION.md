# Vérifications de la livraison du kit — 29 septembre 2026 UTC

## Références

- Source Brain : commit `a633809fed6af805da2634edbf01586935004145`, arbre
  `d3f91f16e88f48f6d1aef368fa43cec54f97d6ea` vérifié sur GitHub.
- Les 74/74 identités Git blob des sources empaquetées correspondent à cet
  arbre. Six copies historiques de livraison sont ajoutées séparément.
- Archive SHA256 : `f026a543ebee2c630f339520bdbcf124aec7fb342d0c357be1efa80b193e000f`.
- Extracteur exécuté deux fois : 80/80 fichiers vérifiés, exécution idempotente.
- Aucun node_modules ni répertoire .git empaqueté. Le workflow Brain dans
  l'archive reste une référence ; il n'est pas installé comme Action Platform.

## Commandes exécutées sur les fichiers extraits

`npm ci --prefix gold-sunday-read/brain-v6/reference/brain --ignore-scripts` :
réussi, six dépendances installées. Une première tentative `--offline` a
échoué faute d'un paquet en cache ; l'installation normale a ensuite réussi.

`npm test --prefix gold-sunday-read/brain-v6/reference/brain` : code de sortie 0.
Notamment 215 contrôles de documents, 39 cas de rejet, 45 contrôles d'audit,
17 tests de famille/évolution/cycle et 62 tests éditoriaux réussis ; les autres
étapes de la même commande sont également passées.

Validation des trois fichiers state + handoff + completion avec la commande
complète du README : **11 contrôles, zéro échec**. Le validateur utilisé est
bien celui extrait du kit, sans adaptation de schéma ni modification des données.

## Limites

Ces résultats vérifient la fidélité et l'utilisabilité du kit, pas l'intégration
backend/frontend de Platform. Aucun typecheck Platform ni test bout en bout
n'a été exécuté dans cette livraison documentaire. Les deux défauts de 9f955cd
décrits dans RESUME_CODEX.md ont été reproduits via ses fonctions pures isolées.
Ils restent à corriger dans le code applicatif.

Le GET live next-recap a retourné SCHEDULED à 03:01:41.881Z, sans identifiant
de commit déployé ; détails dans RESUME_CODEX.md. Aucun refresh Drive, changement
de secret ou activation de dispatcher n'a été effectué pour livrer ce kit.
