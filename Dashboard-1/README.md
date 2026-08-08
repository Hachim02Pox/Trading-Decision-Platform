# Dashboard 1 : Feature Explorer

Dashboard purement descriptif des 1 295 setups (instrument GC) et de leurs 16 features numériques. Aucune prédiction, aucune recommandation, aucune règle d'action.

## Utilisation

Ouvrir `index.html` directement dans un navigateur (double-clic, ou `file://`). Aucun serveur, aucune connexion Internet, aucune installation requise. L'interface s'affiche déjà remplie.

## Fichiers

- `index.html` — point d'entrée.
- `style.css` — thème sombre, mise en page sidebar + zone principale.
- `data.js` — les 1 295 setups intégrés en dur (généré depuis `setups_export.csv`, voir ci-dessous).
- `stats.js` — moyenne, médiane, percentiles (interpolation linéaire), écart-type d'échantillon, détection d'outliers (IQR × 1,5).
- `charts.js` — histogrammes et boxplots horizontaux dessinés en SVG natif.
- `app.js` — état de l'application, sidebar, KPI, onglets (Distribution / WIN vs LOSS / LONG vs SHORT), vue "Croisement des intervalles".
- `intervals.js` — addendum : recherche du meilleur intervalle WIN/LOSS par feature (score de Wilson) et croisement des 16 intervalles (voir ci-dessous).
- `setups_export.csv` — fichier source conservé pour traçabilité ; **jamais lu par le navigateur**.

## Génération de `data.js`

`data.js` a été généré une fois à partir de `setups_export.csv`, en convertissant chaque ligne en objet JavaScript (valeurs numériques converties en `Number`, pas de chaînes). Audit réalisé au moment de la génération :

- 1 295 lignes × 19 colonnes, conformes à la structure attendue.
- Aucun doublon de `SetupId` (1 295 valeurs uniques sur 1 295 lignes).
- `Direction` ∈ {LONG, SHORT}, `Outcome` ∈ {WIN, LOSS} exclusivement.
- Aucune valeur de feature manquante, non numérique ou infinie.
- Contrôle ponctuel : les premières lignes de `data.js` ont été comparées manuellement au CSV source et sont fidèles (aucun arrondi, troncature ou décalage de colonne).
- `data.js` contient exactement 1 295 objets, un par ligne du CSV.

Si `setups_export.csv` change, `data.js` doit être régénéré selon la même procédure (conversion ponctuelle, pas de lecture du CSV à l'exécution). Ce dashboard est construit sur mesure pour ce jeu de données précis — pour explorer un autre CSV, dupliquer le dossier avec un nouveau `data.js`.

## Note d'implémentation

Les 4 KPI affichés en haut de la zone principale (n, médiane, moyenne, nombre d'outliers) reflètent l'ensemble des observations valides de la feature sélectionnée (tous groupes confondus) et restent stables quel que soit l'onglet actif ; les répartitions par groupe (WIN/LOSS, LONG/SHORT) apparaissent dans le contenu de chaque onglet comparatif.

## Addendum : intervalle au meilleur ratio observé (par feature)

Dans l'onglet **WIN vs LOSS** de chaque feature, un encart calcule automatiquement l'intervalle `[borne_basse, borne_haute]` qui maximise un score de confiance (borne basse de l'intervalle de Wilson à 95 %, z = 1,96), parmi les intervalles construits à partir des 101 percentiles (0 à 100 par pas de 1) de la feature, sous contrainte `n_total ≥ 10`. Cette formule et ce seuil sont strictement identiques pour les 16 features — aucun réglage n'est optimisé feature par feature.

Ce calcul reste **indépendant par feature** (pas de croisement) et une mise en garde rappelle systématiquement qu'un intervalle choisi par recherche exhaustive sur un échantillon historique n'est ni un signal validé ni une garantie future.

## Addendum : croisement des intervalles (vue séparée)

La vue "Croisement des intervalles" (accessible depuis le bandeau supérieur, hors sidebar par feature) reprend les 16 intervalles individuels et calcule l'effectif restant en les appliquant tous simultanément. Cette vue est volontairement isolée du reste du dashboard : empiler 16 filtres déjà optimisés sur le même échantillon cumule le risque de sur-ajustement, ce que le tableau "entonnoir" et la mise en garde renforcée affichée en permanence rendent explicite.

**Convention arbitraire documentée** : dans le tableau entonnoir, les features sont ajoutées une par une dans l'ordre décroissant de leur score de Wilson individuel. Ce choix d'ordre est une convention parmi d'autres possibles (ex. ordre alphabétique, ordre du CSV) — il n'est pas présenté comme la "meilleure" façon d'ordonner les features, seulement comme un ordre fixe et reproductible pour construire le tableau.

## Addendum : meilleure combinaison observée (vue séparée)

Sur ce jeu de données, le croisement direct des 16 intervalles individuels (section précédente) fait tomber l'échantillon à 0 dès la 3ᵉ feature ajoutée. La vue "Meilleure combinaison observée" (troisième bouton du bandeau supérieur) répond à une question différente : quelle **combinaison conjointe** d'intervalles (pas nécessairement l'intervalle individuellement optimal de chaque feature) produit le meilleur résultat ajusté ?

**Méthode : recherche gloutonne (forward greedy), pas exhaustive.** Tester toutes les combinaisons possibles des intervalles des 16 features est numériquement impossible (des milliers d'intervalles candidats par feature, combinés entre 16 features). L'algorithme, implémenté dans `intervals.js` (`computeGreedyBestCombination`), procède donc par étapes :

1. Partir de l'échantillon complet (1 295 setups).
2. À chaque étape, pour chaque feature pas encore retenue, chercher son meilleur intervalle (score de Wilson) **sur l'échantillon déjà filtré par les étapes précédentes** (pas sur l'échantillon complet).
3. Retenir la feature (et son intervalle) qui améliore le plus ce score.
4. S'arrêter dès qu'aucune feature restante n'améliore le score, ou si le plancher `n_total ≥ 10` n'est plus atteignable.

Cette méthode ne garantit pas de trouver la combinaison mathématiquement optimale parmi toutes celles imaginables (ce qui exigerait une recherche exhaustive infaisable) — seulement une bonne combinaison trouvée par cette exploration progressive. Elle est documentée comme telle dans l'interface, avec une mise en garde plus appuyée encore que celle du croisement direct, car le nombre de combinaisons testées au total y est supérieur.

## Addendum : y a-t-il un signal ? (vue séparée)

Quatrième bouton du bandeau supérieur. Répond à une question différente des trois sections précédentes, qui recherchent toutes un intervalle ou une combinaison : est-ce qu'**une feature, prise isolément et sans aucune recherche**, sépare déjà nettement les groupes WIN et LOSS dans cet échantillon ?

**Indicateur** (`probabilityOfSuperiority` dans `stats.js`) : la probabilité de supériorité (statistique de Mann-Whitney) — on tire au hasard une valeur WIN et une valeur LOSS pour une feature donnée, et on mesure dans quel pourcentage des cas la valeur WIN dépasse la valeur LOSS. 50 % = mélange total (aucune séparation) ; proche de 0 % ou 100 % = les deux groupes sont presque totalement séparés sur cette feature (quasi-unanimité). L'écart à 50 %, ramené sur une échelle 0–100 %, sert de "force de séparation" pour trier les 16 features sans se soucier du sens de l'écart.

Contrairement au croisement des intervalles et à la recherche de combinaison, cet indicateur est calculé **une seule fois par feature, sans recherche de seuil ni de combinaison** — il est donc beaucoup moins exposé au risque de sur-ajustement, et répond directement à la question « peut-on tirer quoi que ce soit de ce dataset, ou est-ce à oublier ? » de façon plus robuste que les sections de recherche d'intervalle.
