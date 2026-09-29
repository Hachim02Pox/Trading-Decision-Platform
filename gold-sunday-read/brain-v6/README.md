# Reprise Codex — références Brain v6 disponibles dans ce dépôt

Ce kit lève le blocage « schémas/artefacts Brain absents du workspace » du compte
rendu de `9f955cd`. Il contient les **74 fichiers suivis** de Brain, octet pour
octet, et six copies de livraison historiques. Aucun accès à un second dépôt
n'est nécessaire pour les lire et exécuter leurs validateurs.

Source canonique : [gold-market-story-brain au commit a633809](https://github.com/Hachim02Pox/gold-market-story-brain/tree/a633809fed6af805da2634edbf01586935004145).
Arbre Git : `d3f91f16e88f48f6d1aef368fa43cec54f97d6ea`.
Platform inspectée : `9f955cd01f19c3d336bf141ba875feef911ee2fc`.

## Démarrage depuis la racine de Trading-Decision-Platform

```sh
python3 gold-sunday-read/brain-v6/materialize.py
npm ci --prefix gold-sunday-read/brain-v6/reference/brain
npm test --prefix gold-sunday-read/brain-v6/reference/brain
node gold-sunday-read/brain-v6/reference/brain/tools/validate.mjs \
  gold-sunday-read/brain-v6/reference/delivered-snapshot/sunday_read_2026-09-27.json \
  gold-sunday-read/brain-v6/reference/delivered-snapshot/NEXT_GOLD_RECAP.json \
  gold-sunday-read/brain-v6/reference/delivered-snapshot/RUN_COMPLETION_RECORD_gold-sunday-2026-09-27-editorial-v6-01.json
```

Python 3 suffit à l'extraction ; npm ci installe les dépendances verrouillées
du validateur. `manifest.json` fixe les empreintes SHA256 de l'archive et de
chaque fichier, ainsi que leurs identités Git blob. L'extraction refuse les
chemins non sûrs et l'écrasement d'une référence modifiée. `reference/` est
ignoré par Git. Ne pas modifier ces copies pour faire passer l'intégration.

Lire ensuite **[RESUME_CODEX.md](RESUME_CODEX.md)**, puis :

1. `reference/brain/README.md` et tous les documents qu'il impose ;
2. `reference/brain/docs/CODEX_PLATFORM_V6_INTEGRATION.md`, prompt complet ;
3. `reference/brain/specs/GOLD_DRIVE_MIGRATION_2026-09-28.md` ;
4. schémas, outils, fixtures et tests référencés par le prompt.

Brain reste la source canonique. Cette copie est épinglée à un commit vérifié,
pas une synchronisation automatique. Si Brain est accessible, vérifier s'il a
évolué avant d'intégrer. S'il ne l'est pas, travailler avec ce contrat explicite
et consigner cette limite au lieu d'inventer les champs manquants.

## Données historiques incluses

`reference/delivered-snapshot/` contient les quatre livrables officiels du Sunday
du 27 septembre, le handoff scellé v14 et son reçu Control, issus des copies
locales de relecture de la migration du 28 septembre. Leur provenance et leurs
IDs sont dans le manifeste et le journal de migration. Ce sont des observations
REAL historiques : **ne pas les republier, les rendre fraîches ou les convertir
en fixtures par simple changement de drapeau**. Les fixtures de test synthétiques
se trouvent séparément dans `reference/brain/tests/fixtures/`.

Drive fait autorité pour les versions courantes. Le handoff peut avoir évolué
après ce snapshot. Ne jamais restaurer v14 automatiquement. L'archive compressée
est une référence de développement ; elle ne doit pas être découverte par
l'ingestion Drive ni servir de fallback de production.

## Périmètre de cette livraison

Ajout de références, d'un extracteur vérifiable et d'instructions de reprise.
Aucune modification du backend/frontend, du trigger de refresh, des secrets ou
du dispatcher. Les défauts constatés dans `9f955cd` sont documentés dans la
consigne de reprise ; ils ne sont pas corrigés par la présence de ce kit.
