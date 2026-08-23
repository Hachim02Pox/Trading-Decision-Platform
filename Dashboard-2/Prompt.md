Prompt — Dashboard 2 : Bougies d'Inflexion
Contexte général

Je suis un trader sur Gold Futures (GC) avec une approche order flow / footprint. Je collecte manuellement des setups de trading et je veux comprendre mes données avant de faire du machine learning.

Ce dashboard est le deuxième d'une série :

Dashboard 1 (déjà construit) → Features agrégées par setup (SetupFeatures)
Dashboard 2 (à construire) → Bougies d'inflexion individuelles (SetupInflexionCandles)
Ce qu'est une bougie d'inflexion

Une bougie d'inflexion est une bougie où le marché a marqué une pause ou une résistance dans un move en cours. Ce stop a soit initié un vrai retournement, soit échoué rapidement.

Granularité importante :

1 ligne = 1 bougie d'inflexion (pas 1 setup)
Un setup peut avoir plusieurs bougies d'inflexion
Je veux étudier chaque bougie individuellement, pas agrégée par setup
L'objectif est de comprendre le comportement intrinsèque de ces bougies
Données disponibles

Fichier : inflexion_data.json (généré depuis inflexion_export.csv)

Dimensions :

1 558 bougies d'inflexion
1 295 setups uniques
Moyenne de 1.2 bougies par setup (la plupart des setups ont 1 seule bougie)

Distribution :

WIN : 868 bougies / LOSS : 690 bougies
LONG : 792 bougies / SHORT : 766 bougies

Colonnes :

Colonne	Type	Nulls	Description
SetupId	int	0	Identifiant du setup parent
Direction	LONG/SHORT	0	Direction du setup (de SetupReview)
Outcome	WIN/LOSS	0	Résultat du setup (de SetupReview)
inflexion_volume_ratio	decimal	263	Volume de la bougie vs baseline
effort_close_alignment	decimal	0	Alignement effort/clôture
volume_delta_balance	decimal	0	Balance volume/delta
intra_battle_intensity	decimal	0	Intensité du combat intra-bougie
poc_volume_ratio	decimal	0	Volume au POC vs total
poc_position	decimal	0	Position du POC dans la range
poc_delta	decimal	0	Delta net au POC
poc_bid_ask_imbalance	decimal	0	Déséquilibre bid/ask au POC
max_buy_stack	decimal	0	Max imbalances acheteuses
buy_stack_position	decimal	0	Position imbalances acheteuses
max_sell_stack	decimal	0	Max imbalances vendeuses
sell_stack_position	decimal	0	Position imbalances vendeuses

Note importante : inflexion_volume_ratio a 263 valeurs nulles (17% des bougies). Le dashboard doit gérer ces nulls proprement — les exclure des calculs et l'indiquer clairement.

Questions auxquelles le dashboard doit répondre
Pour cette feature de bougie, comment sont distribuées les valeurs ?
Les bougies d'inflexion WIN ont-elles des caractéristiques différentes des LOSS ?
Les bougies LONG diffèrent-elles des SHORT ?
Y a-t-il des valeurs atypiques ?
Quelle est la dispersion — les valeurs sont-elles regroupées ou éparpillées ?
Structure du dashboard (à reproduire depuis Dashboard 1)

Même architecture exacte que le Dashboard 1 :

Interface générale
Sidebar gauche fixe avec liste des 12 features (+ plage min→max)
Main content à droite
Dark theme identique
Stack : HTML + CSS + JS vanilla + Canvas API, zéro dépendance
Header de la feature sélectionnée
Nom de la feature
Description courte
4 KPI cards : bougies valides, médiane, moyenne, valeurs atypiques
3 onglets par feature
Distribution — réglette de percentiles + histogramme + tableau de stats
WIN vs LOSS — histogramme superposé + boxplot + tableau comparatif + conclusion
LONG vs SHORT — même structure
Mesure de différence

Cohen's d robuste (MAD poolé × 1.4826) avec 4 niveaux :

d < 0.2 → Très faible
d < 0.5 → Faible
d < 0.8 → Modérée
d ≥ 0.8 → Marquée
Gestion des outliers
Axe des graphiques limité à P1–P99
Statistiques calculées sur toutes les valeurs valides
Note discrète indiquant l'exclusion visuelle
Différences vs Dashboard 1
Aspect	Dashboard 1	Dashboard 2
Granularité	1 ligne = 1 setup	1 ligne = 1 bougie
Nombre de lignes	1 295	1 558
Features	16	12 (dont 1 avec nulls)
Fichier données	setups_data.json	inflexion_data.json
Titre sidebar	"Feature Explorer"	"Inflexion Explorer"
Sous-titre	"1 295 setups · 16 features"	"1 558 bougies · 1 295 setups · 12 features"
Labels et descriptions des features
json
{
  "inflexion_volume_ratio": {
    "label": "Inflexion Volume Ratio",
    "desc": "Volume de la bougie d'inflexion par rapport à la baseline. 263 valeurs nulles (17%)."
  },
  "effort_close_alignment": {
    "label": "Effort / Close Alignment",
    "desc": "Alignement entre l'effort directionnel et la clôture de la bougie."
  },
  "volume_delta_balance": {
    "label": "Volume Delta Balance",
    "desc": "Balance entre le volume total et le delta net de la bougie."
  },
  "intra_battle_intensity": {
    "label": "Intra Battle Intensity",
    "desc": "Intensité du combat entre acheteurs et vendeurs à l'intérieur de la bougie."
  },
  "poc_volume_ratio": {
    "label": "POC Volume Ratio",
    "desc": "Part du volume total concentré au Point of Control de la bougie."
  },
  "poc_position": {
    "label": "POC Position",
    "desc": "Position relative du POC dans la range de la bougie (0=bas, 1=haut)."
  },
  "poc_delta": {
    "label": "POC Delta",
    "desc": "Delta net (acheteurs - vendeurs) au niveau du Point of Control."
  },
  "poc_bid_ask_imbalance": {
    "label": "POC Bid/Ask Imbalance",
    "desc": "Déséquilibre bid/ask au POC — proche de 1 = acheteurs dominants, -1 = vendeurs."
  },
  "max_buy_stack": {
    "label": "Max Buy Stack",
    "desc": "Taille maximale des imbalances acheteuses dans la bougie."
  },
  "buy_stack_position": {
    "label": "Buy Stack Position",
    "desc": "Position relative des imbalances acheteuses dans la range (0=bas, 1=haut)."
  },
  "max_sell_stack": {
    "label": "Max Sell Stack",
    "desc": "Taille maximale des imbalances vendeuses dans la bougie."
  },
  "sell_stack_position": {
    "label": "Sell Stack Position",
    "desc": "Position relative des imbalances vendeuses dans la range (0=bas, 1=haut)."
  }
}
Fichiers à fournir à l'IA
inflexion_export.csv — données brutes (ou inflexion_data.json après conversion)
feature_explorer.html — Dashboard 1 à prendre comme référence exacte de design et structure
Ce fichier prompt_dashboard2.md
Instruction finale

Construis le Dashboard 2 en reprenant exactement la même structure, le même design et la même logique que le Dashboard 1. Change uniquement : le titre, le sous-titre, les features et leurs descriptions, et le fichier de données. Le résultat doit être un fichier inflexion_explorer.html + inflexion_data.json dans le même dossier.