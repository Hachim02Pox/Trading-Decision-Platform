# Cahier des charges — Dashboard 1 : Feature Explorer

**Destinataire : Claude Code**
**Statut : validé, prêt pour implémentation**
**Périmètre : strictement celui décrit ici — aucune fonctionnalité supplémentaire**

---

## 1. Contexte et objectif

Ce document spécifie le premier des deux dashboards descriptifs de la Trading Decision Platform.

L'utilisateur possède un ensemble de **1 295 observations historiques de marché** appelées "setups" (instrument GC), avec 16 features numériques calculées par setup, une direction (LONG/SHORT) et un résultat (WIN/LOSS).

**Objectif du dashboard : permettre de comprendre visuellement et statistiquement comment chaque feature est distribuée, et si des différences descriptives existent entre les groupes WIN/LOSS et LONG/SHORT.**

Ce dashboard est **exclusivement descriptif**. Il ne doit :
- produire aucune prédiction ;
- produire aucune recommandation ;
- produire aucune règle d'action ;
- suggérer aucune capacité prédictive d'une feature.

Toute formulation dans l'interface doit rester au niveau : "voici ce qu'on observe dans cet échantillon", jamais "voici ce que cela signifie pour l'avenir".

---

## 2. Emplacement et structure des fichiers

Le projet est déjà initialisé sous contrôle de version. Structure attendue :

```
trading-decision-platform/
└── Dashboard-1/
    ├── index.html
    ├── style.css
    ├── app.js
    ├── stats.js
    ├── charts.js
    ├── data.js
    ├── setups_export.csv
    └── README.md
```

Contraintes de structure :
- Tous les fichiers sont dans le dossier `Dashboard-1/`, déjà créé.
- `index.html` est le point d'entrée unique, ouvert directement dans un navigateur (double-clic ou `file://`). Il affiche le dashboard **déjà rempli** dès l'ouverture, sans aucune action de l'utilisateur.
- `style.css`, `app.js`, `stats.js`, `charts.js`, `data.js` sont chargés en références **relatives** depuis `index.html` (pas de CDN, pas d'URL absolue).
- Découpage logique suggéré (adaptable si plus cohérent techniquement, sans changer le comportement) :
  - `data.js` : les données de `setups_export.csv` **intégrées en dur** sous forme d'un tableau JavaScript (ex. `const setupsData = [ {...}, {...}, ... ];`). Voir §7 pour le détail de génération.
  - `stats.js` : toutes les fonctions de calcul statistique (percentiles, moyenne, médiane, écart-type, IQR, détection outliers).
  - `charts.js` : génération des graphiques (histogramme, boxplot) en SVG ou Canvas natif.
  - `app.js` : logique d'interface — lecture de `setupsData`, état de l'application, mise à jour de l'UI, orchestration. Aucune logique d'import de fichier.
- `setups_export.csv` : conservé dans le dossier comme fichier source de référence et de traçabilité (pour pouvoir régénérer `data.js` si les données changent), mais **n'est jamais lu par le navigateur au moment de l'exécution**.
- `README.md` : mode d'emploi bref (comment ouvrir `index.html`), et note expliquant que ce dashboard est construit sur mesure pour ce jeu de données précis (voir §7).

---

## 3. Contraintes techniques non négociables

- **Aucun serveur.** Le fichier `index.html` doit fonctionner en étant simplement ouvert dans un navigateur, sans `npm start`, sans backend, sans build step.
- **Aucune dépendance externe.** Pas de CDN, pas de librairie de graphiques (pas de Chart.js, D3, Plotly, etc.), pas de framework (pas de React/Vue). HTML/CSS/JavaScript natifs uniquement (vanilla JS). Les graphiques sont dessinés à la main en SVG ou Canvas.
- **Aucune connexion Internet requise.** L'outil doit fonctionner intégralement hors-ligne.
- **Aucune base de données, aucune authentification, aucun agent IA, aucun ML.**
- **Aucun import manuel de fichier.** Ce dashboard est construit sur mesure pour `setups_export.csv` : les données sont intégrées directement dans le code (`data.js`), chargées automatiquement à l'ouverture de `index.html`. Pas de bouton d'import, pas d'`<input type="file">`, pas de `FileReader`. L'utilisateur ouvre le fichier et voit immédiatement le dashboard rempli.
- **Thème sombre**, sidebar + zone principale, interface simple et rapide à utiliser.

---

## 4. Données d'entrée

### 4.1 Format attendu

Fichier CSV avec en-tête, encodage UTF-8, séparateur virgule. Colonnes attendues (noms exacts, sensibles à la casse) :

`SetupId, Direction, Outcome, volume_ratio, delta_intensity_ratio, delta_direction_ratio, delta_slope_ratio, delta_acceleration, poc_volume_ratio, poc_migration_ratio, poc_delta_ratio, poc_bid_ask_imbalance, poc_position_migration, recent_max_buy_stack, recent_buy_stack_position, recent_max_sell_stack, recent_sell_stack_position, baseline_volume_med, baseline_abs_delta_med`

- `SetupId` : entier, identifiant unique.
- `Direction` : chaîne, valeurs attendues `LONG` ou `SHORT`.
- `Outcome` : chaîne, valeurs attendues `WIN` ou `LOSS`.
- 16 colonnes de features : valeurs numériques (flottants).

### 4.2 Principe : dashboard sur mesure, données figées

Ce dashboard n'est **pas un outil générique** capable d'ouvrir n'importe quel CSV — il est construit spécifiquement pour `setups_export.csv` tel qu'audité (1295 lignes × 19 colonnes, aucune valeur manquante ni infinie, `Direction` ∈ {LONG, SHORT}, `Outcome` ∈ {WIN, LOSS}). Les données sont converties une fois en JavaScript (`data.js`) et intégrées au code. Il n'y a pas de sélection de fichier à l'exécution.

### 4.3 Validation — à quel moment et comment

La validation décrite ci-dessous (§4.4) s'applique **au moment de la génération de `data.js` à partir du CSV**, c'est-à-dire pendant le développement, pas à chaque ouverture par l'utilisateur final. Objectif : garantir que les données intégrées dans le code sont fidèles à 100 % au CSV source, sans corruption ni perte silencieuse lors de la conversion.

Concrètement, avant d'intégrer les données dans `data.js`, vérifier et consigner (dans `README.md` ou un commentaire en tête de `data.js`) :

1. **Colonnes.** Les 19 colonnes attendues sont présentes dans le CSV source.
2. **Doublons de `SetupId`.** Aucun doublon détecté sur ce jeu de données (confirmé lors de l'audit : 1295 valeurs uniques sur 1295 lignes). Si un futur CSV en contient, le signaler avant intégration plutôt que de les supprimer silencieusement.
3. **Valeurs de `Direction` / `Outcome`.** Uniquement `LONG`/`SHORT` et `WIN`/`LOSS` (confirmé lors de l'audit).
4. **Valeurs numériques des features.** Aucune valeur manquante, non numérique ou infinie (confirmé lors de l'audit).
5. **Fidélité de la conversion.** Le nombre de lignes dans `data.js` doit être strictement égal au nombre de lignes du CSV source (1295), et un contrôle ponctuel (quelques lignes vérifiées manuellement) doit confirmer que les valeurs n'ont pas été altérées (arrondies, tronquées, mal parsées) lors de la conversion.

### 4.4 Robustesse du code malgré des données déjà propres

Même si ce jeu de données précis ne contient aucune valeur invalide, le code de calcul statistique (`stats.js`) doit rester défensif : il ne doit pas planter si une valeur non numérique venait à apparaître (ex. lors d'une future régénération de `data.js` avec un CSV mis à jour), et doit l'exclure proprement du calcul de la feature concernée plutôt que de produire un résultat erroné (`NaN` propagé, crash). Ce n'est pas une fonctionnalité utilisateur visible dans ce MVP, c'est une exigence de fiabilité du code.

---

## 5. Calculs statistiques — définitions exactes

Toutes les formules ci-dessous s'appliquent **par feature**, sur les valeurs valides uniquement (voir §4.2), et éventuellement restreintes à un sous-groupe (WIN, LOSS, LONG, SHORT) selon l'onglet actif.

### 5.1 Moyenne
Moyenne arithmétique simple des valeurs valides.

### 5.2 Médiane
Valeur centrale après tri croissant. Si n est pair, moyenne des deux valeurs centrales.

### 5.3 Percentiles (P1, P10, P25, P50, P75, P90, P99)
Méthode : **interpolation linéaire sur rang** (équivalente à `numpy.percentile` méthode par défaut / Excel `PERCENTILE.INC`).

Pour un percentile p (entre 0 et 1) sur n valeurs triées :
- rang = p × (n − 1)
- si rang est un entier exact, prendre la valeur à cet index
- sinon, interpoler linéairement entre la valeur à `floor(rang)` et celle à `ceil(rang)`, au prorata de la partie décimale

Cette méthode doit être appliquée de façon strictement identique partout dans le dashboard (KPI, tableau, axes de graphique).

### 5.4 Écart-type
Écart-type **d'échantillon** (dénominateur n − 1, pas n). Affiché dans le tableau descriptif de l'onglet Distribution.

### 5.5 IQR et détection des outliers
- IQR = P75 − P25 (mêmes percentiles que définis en 5.3)
- Borne basse = P25 − 1,5 × IQR
- Borne haute = P75 + 1,5 × IQR
- Une valeur est un outlier si elle est strictement inférieure à la borne basse ou strictement supérieure à la borne haute.
- **Les outliers restent inclus dans tous les calculs** (moyenne, médiane, écart-type, percentiles). Ils sont uniquement comptés et marqués visuellement, jamais retirés des statistiques.

### 5.6 Axe visuel P1–P99
Utilisé **uniquement** pour cadrer l'échelle visuelle de l'histogramme (et du boxplot si pertinent). Toutes les données, y compris celles hors de [P1, P99], sont incluses dans les calculs et dans les graphiques (les points hors axe peuvent être affichés en butée de bord, ou signalés, mais jamais supprimés du rendu ou du calcul). Une mention textuelle discrète doit rappeler que l'axe est cadré sur P1-P99 mais que le calcul utilise 100 % des données.

### 5.7 KPI affichés en haut de la zone principale (pour la feature sélectionnée, dans le contexte de l'onglet actif)
- `n` : nombre de valeurs valides utilisées dans le calcul
- Médiane
- Moyenne
- Nombre d'outliers (méthode IQR × 1,5)

---

## 6. Organisation de l'interface

### 6.1 Structure générale
- **Sidebar gauche (fixe)** :
  - Dès l'ouverture de la page : liste des 16 features, chacune affichant son nom et sa plage min/max globale (sur toutes les valeurs valides, tous groupes confondus).
  - Une feature est sélectionnée à la fois ; la sélection est visuellement mise en évidence.
  - Par défaut, au chargement de la page, la première feature de la liste est sélectionnée automatiquement.
- **Zone principale (droite)** :
  - En-tête : nom de la feature sélectionnée.
  - Les 4 KPI (§5.7).
  - 3 onglets : **Distribution**, **WIN vs LOSS**, **LONG vs SHORT**.
  - Contenu de l'onglet actif en dessous.

### 6.2 Onglet Distribution
- Histogramme de la feature sélectionnée (toutes observations valides confondues).
- Tableau des percentiles : P1, P10, P25, P50 (médiane), P75, P90, P99.
- Tableau de statistiques descriptives : n, moyenne, médiane, écart-type, min, max, nombre d'outliers.
- Marquage visuel des outliers (ex. points distincts sur ou sous l'histogramme, ou liste courte si peu nombreux).
- Légende/texte explicatif courte sous le graphique expliquant ce qu'il représente, en langage simple (voir §6.5).

### 6.3 Onglets WIN vs LOSS / LONG vs SHORT
Structure identique pour les deux onglets (seul le critère de groupement change) :
- Histogrammes comparatifs des deux groupes (superposés avec transparence, ou côte à côte — choisir l'option la plus lisible).
- Boxplots horizontaux, un par groupe, alignés sur le même axe.
- Effectifs (`n`) de chaque groupe affichés clairement à côté de chaque série.
- Tableau comparatif : médiane, moyenne, écart-type, n, nombre d'outliers, pour chaque groupe côte à côte.
- Une phrase de synthèse générée automatiquement, strictement descriptive, formulée simplement, par exemple sur le modèle : "Dans cet échantillon, la médiane du groupe WIN est de [valeur] contre [valeur] pour LOSS (n=[x] vs n=[y])." Cette phrase ne doit jamais employer de vocabulaire prédictif ou causal ("indique que", "permet de prédire", "suggère un signal", etc.).

### 6.4 Comportement de la sélection de feature
Changer de feature dans la sidebar met à jour instantanément le contenu de l'onglet actif (pas de rechargement de page, pas de rechargement du CSV).

### 6.5 Exigence de pédagogie
Chaque graphique et chaque tableau doit être accompagné d'un texte bref expliquant ce qu'il montre, avec un vocabulaire accessible à quelqu'un sans formation en statistiques (éviter le jargon non expliqué ; si un terme technique est utilisé — médiane, percentile, écart-type, IQR — une info-bulle ou une courte définition doit être disponible).

---

## 7. Génération de `data.js` à partir du CSV — comportement détaillé

- `data.js` contient un unique tableau JavaScript, par exemple :
  `const setupsData = [ { SetupId: 1335, Direction: "SHORT", Outcome: "LOSS", volume_ratio: 0.82, ... }, ... ];`
  — un objet par setup, une clé par colonne, valeurs numériques converties en `Number` (pas de chaînes de caractères pour les features).
- Ce fichier est généré **une fois**, à partir de `setups_export.csv`, au moment du développement (script de conversion ponctuel, ou conversion manuelle — au choix de l'implémentation, tant que le résultat respecte §4.3-4.4). Il n'est pas régénéré automatiquement à l'exécution.
- À l'ouverture de `index.html`, `data.js` est chargé comme un script classique (`<script src="data.js"></script>`), avant `app.js`. `app.js` lit directement `setupsData` en mémoire — aucune étape de chargement, aucun état "en attente de données".
- La sidebar et les 16 features sont donc peuplées **immédiatement** à l'ouverture de la page, sans action de l'utilisateur.
- Si l'utilisateur veut explorer un autre jeu de données à l'avenir, la démarche est de **dupliquer le dossier** (ex. `Dashboard-1-v2/`) avec un nouveau `data.js` généré à partir du nouveau CSV — pas de remplacement dynamique dans ce dashboard. Ce point est hors périmètre du MVP actuel, mentionné ici uniquement pour clarifier le choix de conception.

---

## 8. Gestion des erreurs et cas limites — récapitulatif

| Cas | Comportement attendu |
|---|---|
| Valeur `Direction`/`Outcome` hors valeurs attendues (si un futur `data.js` en contenait) | Ligne exclue des comparaisons concernées, compteur affiché |
| Valeur de feature manquante/non numérique/infinie (si un futur `data.js` en contenait) | Valeur exclue du calcul de cette feature seule, compteur affiché par feature |
| Groupe vide dans un onglet comparatif (ex. 0 setup SHORT) | Afficher "n=0" et un message indiquant qu'aucune comparaison n'est possible pour ce groupe, sans erreur bloquante |

Sur le jeu de données actuel (`setups_export.csv` audité), aucun de ces cas ne se produit réellement — cette robustesse est une exigence de qualité du code (`stats.js`), pas un comportement que l'utilisateur verra en pratique avec ce fichier.

---

## 9. Critères de fin de MVP (definition of done)

Le dashboard est considéré terminé quand tous les points suivants sont vrais :

1. Ouvrir `index.html` directement dans un navigateur (sans serveur, sans action de l'utilisateur) affiche immédiatement l'interface **déjà remplie** : sidebar peuplée des 16 features, feature par défaut sélectionnée, KPI et graphiques affichés.
2. `data.js` contient bien les 1295 setups du CSV source, fidèlement convertis (vérification ponctuelle faite, voir §4.3 point 5).
3. Sélectionner une feature met à jour les KPI et les 3 onglets sans rechargement de page.
4. Les percentiles affichés (P1/P10/P25/P50/P75/P90/P99) correspondent, pour au moins une feature vérifiée manuellement, au calcul par interpolation linéaire décrit en §5.3.
5. Le nombre d'outliers affiché correspond à la méthode IQR × 1,5 décrite en §5.5, et ces valeurs restent incluses dans moyenne/médiane/écart-type.
6. L'axe des histogrammes est cadré visuellement sur P1–P99 sans exclure de données du calcul.
7. Les onglets WIN vs LOSS et LONG vs SHORT affichent des effectifs corrects par groupe et des statistiques cohérentes avec un contrôle manuel sur un sous-échantillon.
8. Aucune formulation de l'interface ne suggère une prédiction, une recommandation ou une règle d'action.
9. Le dashboard fonctionne sans connexion Internet et sans aucune dépendance externe chargée depuis un CDN.
10. Les cas limites du tableau §8 sont gérés sans faire planter l'application (pas d'écran blanc, pas d'erreur JavaScript non gérée visible par l'utilisateur).

---

## 10. Hors périmètre (rappel explicite)

Ne pas implémenter dans ce dashboard, même si cela semble facile à ajouter :
- Corrélations entre features.
- Croisement combiné WIN/LOSS × LONG/SHORT (4 groupes).
- Export des résultats (CSV, image, PDF).
- Filtrage par date/temps.
- Toute forme de score, règle, seuil de décision ou suggestion.
- Toute dépendance à une base de données, un serveur, une authentification, un agent IA.

---

*Fin du cahier des charges. Toute question d'implémentation non couverte ici doit être posée avant de coder, plutôt que tranchée arbitrairement.*
