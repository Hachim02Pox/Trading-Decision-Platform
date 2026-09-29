# Références v6 pour l’intégration en cours

Le kit [brain-v6/README.md](brain-v6/README.md) fournit une copie vérifiable des contrats Brain, des fixtures et des artefacts de migration. Pour reprendre après `9f955cd`, lire [brain-v6/RESUME_CODEX.md](brain-v6/RESUME_CODEX.md). Le contenu historique ci-dessous reste une référence du pipeline précédent ; il ne remplace pas le contrat Brain v6.

---

# Gold Sunday Read

Le pipeline Sunday Read conserve les spécifications source dans `docs/` et écrit les runs locaux dans `gold-sunday-read/runs/YYYY-MM-DD/` (ignorés par Git, sauf ce README).

## Test complet sans coût

```powershell
npm run sunday:doctor
npm run sunday:fixture
npm run sunday:bundle
npm run sunday:validate
npm run sunday:dev
```

Ouvrir `http://localhost:3000/sunday-read?date=YYYY-MM-DD` avec la date affichée par la commande fixture. La page est explicitement étiquetée `FIXTURE`; elle ne constitue pas une analyse de marché.

## Recherche réelle Puter / Perplexity

Le SDK officiel `@heyputer/puter.js` est installé dans le frontend. Pour le CLI local, Puter documente son endpoint OpenAI-compatible avec un **Puter auth token** (pas une clé Perplexity) : créer le token dans le [dashboard Puter](https://puter.com/dashboard), puis définir `PUTER_AUTH_TOKEN` dans `apps/backend/.env`. Le token ne va jamais dans le frontend. Le défaut est `perplexity/sonar-deep-research`; `perplexity/sonar-pro` reste configurable.

```powershell
npm run sunday:research -- --job family_1_fed --date 2026-09-12
npm run sunday:research -- --date 2026-09-12
npm run sunday:bundle -- --date 2026-09-12
```

Chaque job est isolé. Une erreur est enregistrée dans `manifest.json` et n'efface pas les résultats des autres familles. Les réponses brutes sont dans `raw/`; les preuves validées sont dans `evidence/` en JSON et Markdown.

## Astra manuel

Après `sunday:bundle`, ouvrir `runs/YYYY-MM-DD/reasoning/README_RUN_ASTRA.md`. Donner à Astra `ASTRA_PROMPT.md`, `evidence_bundle.json`, `final_output.schema.json` et les deux specs indiquées. Sauvegarder la réponse JSON pure dans :

`gold-sunday-read/runs/YYYY-MM-DD/final/sunday_read.json`

Puis exécuter `npm run sunday:validate -- --date YYYY-MM-DD` et rafraîchir l'URL UI. `ASTRA_CLI_CMD` est seulement un indicateur de configuration : aucune commande shell configurable n'est exécutée par le projet.

## Provenance et limites

Les URL sont normalisées pour identifier les copies syndiquées, sans supprimer l'évidence ni confondre deux interprétations. Les réponses sans données ou citations restent `UNKNOWN`/`PARTIAL`. Le parseur attend le JSON demandé au fournisseur; s'il est absent ou malformé, le brut est conservé et le job échoue honnêtement.

