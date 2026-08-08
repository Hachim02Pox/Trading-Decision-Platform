# Addendum — Dashboard 1 : Intervalle au meilleur ratio WIN/LOSS par feature

**À envoyer à Claude Code comme complément au cahier des charges déjà implémenté.**
**Ne pas régénérer le dashboard — ajouter cette fonctionnalité à l'existant, dans l'onglet "WIN vs LOSS" de chaque feature.**

---

## 1. Objectif

Pour chaque feature (indépendamment, sans lien avec les autres features), trouver automatiquement l'intervalle de valeurs qui maximise le **ratio WIN/(WIN+LOSS)**, sous contrainte d'un nombre minimum d'observations dans cet intervalle. Objectif : remplacer une recherche manuelle par une recherche automatique équivalente, feature par feature, sans classement entre features et sans croisement entre elles.

## 2. Ce qui n'est PAS demandé (hors périmètre explicite)

- Pas d'intersection entre plusieurs features (pas de recherche de type "volume_ratio entre X et Y ET delta entre A et B").
- Pas de classement des 16 features entre elles ("la meilleure feature").
- Pas de recommandation, pas de règle d'entrée en position, pas de seuil présenté comme signal fiable.

## 3. Algorithme — recherche du meilleur intervalle

Pour une feature donnée, sur les valeurs valides uniquement :

1. Trier toutes les valeurs de la feature par ordre croissant.
2. Générer une liste de bornes candidates à partir des **percentiles** de la feature (par exemple tous les percentiles de 0 à 100 par pas de 1 — soit 101 points de coupure). Ne pas tester chaque valeur individuelle brute (trop coûteux et instable sur de petites variations) — les percentiles suffisent à couvrir toutes les zones intéressantes de la distribution.
3. Tester toutes les combinaisons possibles d'intervalles `[borne_basse, borne_haute]` à partir de ces points de coupure (borne_basse < borne_haute).
4. Pour chaque intervalle testé, calculer :
   - `n_WIN` = nombre de setups WIN dont la valeur tombe dans l'intervalle
   - `n_LOSS` = nombre de setups LOSS dont la valeur tombe dans l'intervalle
   - `n_total` = n_WIN + n_LOSS
   - `ratio` = n_WIN / n_total
   - `score` = borne basse de l'intervalle de confiance de Wilson à 95 % (voir §4) — c'est ce score, pas le ratio brut, qui sert à comparer les intervalles entre eux.
5. Écarter uniquement les intervalles dégénérés (`n_total < 10`, plancher de bon sens pour éviter un intervalle à 1 ou 2 observations — ce plancher est identique pour toutes les features, ce n'est pas un réglage optimisé par feature).
6. Parmi les intervalles restants, sélectionner celui avec le `score` (Wilson) le plus élevé.
7. Répéter cette recherche indépendamment pour chacune des 16 features. La méthode de calcul du score est strictement identique pour toutes les features — aucun paramètre n'est ajusté feature par feature.

## 4. Score de Wilson — pourquoi et comment

**Pourquoi pas un seuil fixe (ex. n ≥ 30) ni un seuil "optimisé" par feature ?**
Un seuil fixe est arbitraire. Un seuil optimisé automatiquement pour chaque feature séparément serait pire : cela reviendrait à ajuster un paramètre supplémentaire pour flatter le résultat de chaque feature individuellement, ce qui aggrave le risque de sur-ajustement déjà présent dans la recherche d'intervalle elle-même. Le score de Wilson résout ce problème autrement : c'est **une seule formule, identique pour toutes les features**, qui pénalise mathématiquement les petits échantillons sans qu'on ait besoin de choisir un seuil.

**Principe :** à ratio égal, un intervalle avec plus d'observations obtient un score plus élevé qu'un intervalle avec peu d'observations. Un intervalle avec un ratio très élevé mais très peu d'observations (ex. 2 WIN / 0 LOSS) obtient un score modeste, reflétant l'incertitude réelle.

**Formule (borne basse de l'intervalle de confiance de Wilson, z = 1,96 pour 95 %)** :

```
p̂ = n_WIN / n_total
z = 1.96
score = ( p̂ + z²/(2·n_total) − z · racine( (p̂·(1−p̂)/n_total) + z²/(4·n_total²) ) )
        / ( 1 + z²/n_total )
```

C'est ce `score` qui remplace à la fois le ratio brut et le seuil fixe — un seul chiffre qui reflète "un bon ratio, avec suffisamment de confiance dessus".

## 5. Affichage — où et comment

Dans l'onglet **WIN vs LOSS** de chaque feature (celui qui existe déjà), ajouter un nouvel encart sous le tableau comparatif actuel, intitulé par exemple **"Intervalle au meilleur ratio observé"**, contenant :

- La plage exacte : `[borne_basse — borne_haute]`
- `n_WIN`, `n_LOSS`, `n_total`
- Le ratio brut affiché en pourcentage (ex. "72 % de WIN dans cet intervalle")
- Le score de Wilson affiché à côté, présenté simplement (ex. "indice de confiance : 0.61") — pas besoin d'expliquer la formule à l'écran, juste préciser en une phrase que c'est ce score, et pas le ratio brut, qui a servi à choisir l'intervalle, car il tient compte du nombre d'observations.
- **Une phrase de rappel obligatoire, toujours affichée à côté du résultat** (formulation proche de celle-ci, à adapter mais sans en atténuer le sens) :
  > "Cet intervalle est celui qui présente le meilleur score observé sur cet échantillon historique (ratio ajusté au nombre d'observations). Il ne s'agit pas d'un signal validé ni d'une garantie pour de futures observations — de nombreuses combinaisons d'intervalles ont été testées, ce qui augmente le risque de tomber sur un résultat favorable par hasard."
- Optionnel mais recommandé : surligner visuellement cet intervalle sur l'histogramme déjà existant de l'onglet (ex. une bande semi-transparente derrière les barres concernées), pour un repérage visuel immédiat.

## 6. Cas limites

- Si aucun intervalle ne satisfait `n_total >= 10` pour une feature (peu probable avec 1295 lignes réparties en WIN/LOSS quasi égaux, mais à prévoir), afficher un message clair : "Aucun intervalle suffisamment représenté n'a pu être identifié pour cette feature."
- Le calcul doit s'exécuter côté client en JavaScript pur, sans dépendance externe, cohérent avec le reste du projet.
- Le calcul par feature (101×101/2 environ 5000 combinaisons max) reste largement dans les capacités d'exécution instantanée en JavaScript pour 1295 lignes — aucune optimisation particulière de performance n'est nécessaire.

## 7. Finalité — croisement de tous les intervalles (section distincte, à haut risque statistique)

**Cette section est volontairement isolée du reste du dashboard** (nouvel onglet ou section globale de niveau application, pas à l'intérieur d'une feature précise), car elle combine les 16 optimisations individuelles de la section 3, ce qui **cumule leur risque de sur-ajustement**. Chaque intervalle par feature est déjà "le meilleur trouvé sur cet échantillon" ; en croiser 16 revient à empiler 16 filtres déjà optimisés, ce qui réduit l'échantillon final de façon importante et rend le résultat statistiquement fragile. Ce n'est pas une erreur d'implémentation à corriger — c'est la nature du calcul demandé, et l'interface doit le montrer clairement plutôt que le cacher.

### 7.1 Calcul du résultat final

1. Reprendre l'intervalle au meilleur score de Wilson déjà calculé pour chacune des 16 features (section 3).
2. Filtrer l'ensemble des 1295 setups pour ne garder que ceux dont **les 16 features tombent simultanément** dans leur intervalle respectif.
3. Sur ce sous-ensemble final, calculer `n_WIN`, `n_LOSS`, `n_total`, et le ratio WIN (`n_WIN / n_total`).
4. Si `n_total = 0`, l'afficher tel quel ("aucun setup ne satisfait les 16 conditions simultanément") — ne jamais forcer un chiffre ou masquer ce résultat.

### 7.2 Tableau "entonnoir" (obligatoire, pas optionnel)

Pour rendre visible pourquoi l'échantillon final est petit, afficher un tableau qui ajoute les features une par une et montre l'effectif restant à chaque étape :

| Étape | Feature ajoutée | n restant | n_WIN | n_LOSS |
|---|---|---|---|---|
| 0 | (aucune — échantillon complet) | 1295 | 642 | 653 |
| 1 | feature A (son intervalle appliqué seul) | ... | ... | ... |
| 2 | + feature B | ... | ... | ... |
| ... | ... | ... | ... | ... |
| 16 | + feature P (toutes appliquées) | ... | ... | ... |

- Ordre d'ajout des features dans ce tableau : trier par score de Wilson décroissant (la feature au score individuel le plus élevé appliquée en premier). Ce choix d'ordre doit être documenté dans le README comme une convention arbitraire parmi d'autres possibles, pas une "meilleure méthode".
- Ce tableau doit rester visible en permanence à côté du résultat final, pas dans un menu séparé — l'objectif est que le rétrécissement de l'échantillon soit impossible à ignorer.

### 7.3 Mise en garde renforcée (obligatoire, plus visible que celle de la section 5)

Affichée de façon proéminente au-dessus du résultat final (pas en petit texte en bas) :

> "Ce résultat croise 16 intervalles déjà individuellement optimisés sur le même échantillon de 1295 setups. Le risque de sur-ajustement est très élevé : ce chiffre reflète très probablement des coïncidences statistiques plutôt qu'un phénomène réel et reproductible. Le tableau ci-dessous montre comment l'échantillon rétrécit à mesure que les conditions s'accumulent — plus il devient petit, moins le résultat est fiable. Ceci n'est en aucun cas une stratégie, une règle d'entrée ou une recommandation."

### 7.4 Emplacement dans l'interface

Un nouvel onglet ou une nouvelle section au niveau de l'application (pas dans la sidebar par feature), par exemple accessible depuis un lien "Croisement des intervalles" séparé du reste — pour bien marquer que ce n'est pas la même nature d'analyse que le reste du dashboard, purement descriptif.

## 8. Critère de fin pour cet ajout

- Pour chaque feature, l'onglet WIN vs LOSS affiche l'intervalle au meilleur score de Wilson, avec n_WIN/n_LOSS/n_total, le ratio brut et le score.
- La formule de score de Wilson est identique pour les 16 features — aucun paramètre n'est ajusté ou optimisé feature par feature.
- Le plancher de bon sens (n_total ≥ 10) est respecté strictement.
- La phrase de mise en garde (section 5) est présente et visible à chaque affichage par feature, jamais omise.
- La section de croisement final (section 7) est isolée du reste, affiche le résultat même si n_total = 0, inclut le tableau entonnoir complet, et affiche la mise en garde renforcée de façon visible en permanence à côté du résultat.
- Aucune formulation de type "meilleure feature", "signal fiable", "stratégie" ou "recommandation d'entrée" n'apparaît nulle part dans l'interface, y compris dans la section de croisement.
