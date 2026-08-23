# Guide complet — Environnement IA de développement pour `trading-decision-platform`

> **But de ce document**  
> Ce fichier explique, de zéro et de manière très détaillée, tout ce qui a été installé et configuré autour de **Claude Code**, **Codex**, **ECC**, des **skills**, des **rules**, des **hooks**, des **agents**, des **MCP**, du **design system**, de **Playwright**, de **21st**, de **Git**, des **secrets**, et de la collaboration Claude ↔ Codex.
>
> Il est écrit pour quelqu’un qui veut **comprendre réellement ce qu’il a copié-collé**, pas seulement reproduire des commandes.

---

# 0. La vue d’ensemble en une phrase

Au départ, on avait surtout deux IA capables de coder.

Maintenant, on a construit autour d’elles un **environnement d’ingénierie** :

- des instructions permanentes ;
- des procédures spécialisées ;
- des contrôles automatiques ;
- des outils externes ;
- une constitution visuelle ;
- un système de collaboration ;
- une séparation entre implémentation et review ;
- une gestion propre des secrets ;
- une base commune pour Claude Code et Codex.

L’objectif n’est pas de rendre les modèles « magiquement plus intelligents ».

L’objectif est de faire en sorte qu’ils travaillent dans **un environnement mieux structuré**, avec **moins d’ambiguïté**, **moins d’improvisation**, **moins de vibe coding**, et **plus de vérification**.

---

# 1. Les mots qu’il faut comprendre avant tout

## 1.1 Modèle

Un **modèle** est le cerveau statistique.

Exemples :

- Claude ;
- GPT.

Le modèle sait lire, raisonner, écrire du code, expliquer, etc.

Mais tout seul, il n’a pas automatiquement :

- accès à ton repo ;
- accès au terminal ;
- accès au navigateur ;
- accès à Git ;
- accès à tes fichiers ;
- accès à une base de données ;
- accès à des outils externes.

---

## 1.2 Agent / agent de coding

Un agent comme **Claude Code** ou **Codex** ajoute autour du modèle des capacités d’action.

Il peut par exemple :

1. lire ton repo ;
2. chercher un fichier ;
3. ouvrir plusieurs fichiers ;
4. proposer un plan ;
5. modifier du code ;
6. lancer des commandes ;
7. exécuter des tests ;
8. voir une erreur ;
9. corriger ;
10. relancer les tests ;
11. inspecter le diff Git.

Donc :

**modèle = cerveau**  
**agent = cerveau + outils + boucle d’action**

---

## 1.3 Context window

La **context window** est la mémoire de travail momentanée du modèle.

Imagine :

- ton repo = une bibliothèque entière ;
- la context window = le bureau sur lequel tu poses quelques documents.

Le modèle ne doit pas forcément avoir **tout ton projet** dans son contexte à chaque instant.

Il doit surtout avoir **les bons documents pour la tâche actuelle**.

C’est pour cela qu’on cherche à organiser :

- les règles permanentes ;
- les documents métier ;
- le design system ;
- les skills spécialisés ;
- les fichiers précis concernés par la tâche.

C’est du **context engineering**.

---

## 1.4 Prompt

Le prompt est simplement ce que tu demandes.

Exemple faible :

> Fais-moi le dashboard.

Exemple meilleur :

> Implémente la carte Gold principale selon la spec F1, respecte DESIGN.md, ne modifie pas la navigation, utilise le composant existant, ajoute les tests, puis vérifie dans le navigateur.

Le prompt est important.

Mais le prompt ne doit pas porter **à lui seul** tout le savoir du projet.

C’est pour ça qu’on a créé des instructions persistantes et des skills.

---

# 2. ECC — ce que c’est réellement

ECC n’est pas une nouvelle IA.

ECC n’est pas un remplacement de Claude.

ECC n’est pas un remplacement de Codex.

ECC est plutôt une **boîte à outils / couche d’organisation pour les agents de coding**.

Son rôle est de fournir des éléments comme :

- skills ;
- agents spécialisés ;
- hooks ;
- règles ;
- workflows ;
- prompts ;
- garde-fous ;
- outils de review ;
- outils de vérification ;
- intégrations.

L’image simple :

- Claude/Codex = développeurs ;
- ECC = méthodes, checklists, reviewers, automatismes et procédures autour des développeurs.

---

# 3. Skill — le concept le plus important à retenir

Un **skill** est une procédure spécialisée qu’un agent peut charger quand la tâche correspond.

Pense à un skill comme à un **manuel métier**.

Exemple :

`financial-data-ingestion`

pourrait dire :

1. définir l’unité ;
2. définir `observation_at` ;
3. définir `retrieved_at` ;
4. documenter la source ;
5. gérer le stale ;
6. interdire les fallbacks silencieux ;
7. tester la normalisation ;
8. documenter la convention.

Quand Claude travaille sur une ingestion financière, il peut charger ce skill.

### Pourquoi c’est utile

Sans skill, tu réexpliques les mêmes exigences dans chaque prompt.

Avec un skill, la procédure est réutilisable.

### Ce qu’un skill ne fait pas

Il n’augmente pas magiquement le QI du modèle.

Il réduit surtout l’espace des mauvaises décisions possibles.

---

# 4. Rule — différence avec un skill

Une **rule** est une règle permanente.

Exemple :

> Ne jamais hardcoder une clé API.

ou :

> Ne jamais remplacer silencieusement une source de données par une autre.

Le skill dit :

> « Voici comment faire correctement ce type de tâche. »

La rule dit :

> « Cette règle s’applique de manière générale. »

---

# 5. Hook — automatisation déclenchée automatiquement

Un **hook** est une action automatique déclenchée quand un événement arrive.

Exemple :

- avant une commande Bash ;
- après une modification ;
- avant de terminer une tâche ;
- avant un commit ;
- avant un push.

On a réellement vu un hook ECC agir.

Claude voulait lancer une commande Bash.

ECC a répondu avec un **Fact-Forcing Gate**.

Il a demandé à Claude de préciser :

1. la demande actuelle ;
2. ce que la commande allait vérifier ou produire.

Puis seulement après, Bash a été autorisé.

Même chose avant la création de `DESIGN.md`.

ECC a demandé :

- quel fichier va être créé ;
- s’il existe déjà un équivalent ;
- pourquoi il est nécessaire ;
- quelle est l’instruction utilisateur.

### Pourquoi c’est intéressant

On ne dépend plus uniquement de ta mémoire.

Tu n’as pas besoin de répéter :

> « Claude, réfléchis avant de faire cette commande. »

Le hook peut imposer cette discipline automatiquement.

---

# 6. Agent / subagent

ECC fournit aussi des agents spécialisés.

Pense à une équipe :

- architecte ;
- reviewer ;
- expert sécurité ;
- expert documentation ;
- explorateur ;
- expert base de données.

L’agent principal peut déléguer.

### Exemple

Claude implémente une feature.

Ensuite :

- un reviewer vérifie le diff ;
- un agent sécurité regarde les vulnérabilités ;
- un agent doc vérifie la documentation.

L’idée est d’éviter que la même IA :

> conçoive → code → s’auto-évalue → conclue que tout est parfait.

---

# 7. MCP — la prise USB des outils IA

MCP signifie **Model Context Protocol**.

La vulgarisation la plus utile :

> un MCP est une prise standard qui permet de brancher un outil externe à l’agent.

Avec MCP, l’agent peut recevoir de nouvelles « mains ».

Exemples installés dans notre environnement :

- Playwright ;
- Chrome DevTools ;
- 21st.

Un MCP ne rend pas le modèle plus intelligent.

Il lui donne de nouvelles capacités d’action.

---

# 8. Mise à jour de Claude Code

Version initiale observée :

```text
2.1.70
```

On a lancé :

```powershell
claude update
```

Résultat :

```text
Successfully updated from 2.1.70 to version 2.1.240
```

### Pourquoi on l’a fait

ECC utilisait dans son manifest un champ `userConfig` que l’ancienne version de Claude Code ne reconnaissait pas.

Avant mise à jour, l’installation échouait avec :

```text
Unrecognized key: "userConfig"
```

Après mise à jour, l’installation a fonctionné.

### Leçon

Quand un plugin récent échoue sur son manifest :

1. ne pas modifier le plugin au hasard ;
2. vérifier la version de l’outil hôte ;
3. mettre à jour ;
4. retester.

---

# 9. Installation du marketplace ECC dans Claude Code

Commande utilisée :

```powershell
claude plugin marketplace add affaan-m/ECC
```

Résultat :

```text
Successfully added marketplace: ecc
```

### Ce que ça fait

Ça ne voulait pas encore dire :

> « ECC est installé ».

Ça voulait dire :

> « Claude Code connaît maintenant le catalogue ECC et sait où récupérer le plugin. »

Analogie :

- marketplace ajouté = magasin enregistré ;
- plugin installé = produit réellement installé.

---

# 10. Installation du plugin ECC

Commande :

```powershell
claude plugin install ecc@ecc
```

Après mise à jour de Claude Code :

```text
Successfully installed plugin: ecc@ecc
```

Puis Claude a indiqué :

```text
2 userConfig options not yet set
```

On a donc configuré le plugin.

---

# 11. Configuration des hooks ECC

Dans Claude Code :

```text
/plugin configure ecc@ecc
```

On a activé les hooks.

Puis on a choisi le profil :

```text
standard
```

### Pourquoi `standard`

- `minimal` = peu de garde-fous ;
- `standard` = compromis qualité / sécurité / fluidité ;
- `strict` = plus intrusif.

Pour un projet encore en construction, `standard` était le meilleur compromis.

Ensuite :

```text
/reload-plugins
```

Claude a affiché environ :

```text
1 plugin
94 skills
74 agents
23 hooks
1 plugin MCP server
```

Ce log nous a confirmé qu’ECC était réellement chargé.

---

# 12. Rules ECC copiées dans le projet

Le plugin n’injectait pas automatiquement toutes les rules du repo dans le projet.

On a donc cloné ECC à côté :

```powershell
git clone --depth 1 https://github.com/affaan-m/ECC.git ..\ECC
```

Puis :

```powershell
New-Item -ItemType Directory -Force .\.claude\rules\ecc | Out-Null
Copy-Item -Recurse -Force ..\ECC\rules\common .\.claude\rules\ecc\
```

### Pourquoi uniquement `common`

Parce que les rules permanentes coûtent du contexte.

On ne voulait pas charger immédiatement :

- TypeScript ;
- Python ;
- autres langages ;

tant que la stack n’était pas complètement figée.

On garde donc les règles universelles maintenant.

On ajoutera les règles spécifiques au langage uniquement lorsque ce sera justifié.

---

# 13. Vercel Web Design Guidelines

Installation :

```powershell
npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines -a claude-code
```

Le CLI a trouvé plusieurs skills mais on n’a installé que :

```text
web-design-guidelines
```

### Rôle

C’est un **auditeur UI**.

Il sert surtout après qu’une interface existe.

Il peut aider à vérifier :

- accessibilité ;
- interactions ;
- responsive ;
- structure ;
- focus clavier ;
- états d’interface ;
- bonnes pratiques web.

### Image mentale

Taste = designer  
Vercel Guidelines = contrôleur qualité

---

# 14. `find-skills`

Pendant l’installation Vercel, le CLI a proposé d’installer :

```text
find-skills
```

On a accepté.

### Rôle

Il aide l’agent à découvrir des skills existants.

### Attention

Ça ne veut pas dire qu’on doit installer tous les skills qu’il trouve.

Nouvelle règle :

> On ajoute un skill uniquement quand un problème réel le justifie.

---

# 15. Taste — `design-taste-frontend`

Installation :

```powershell
npx skills add https://github.com/Leonxlnx/taste-skill --skill design-taste-frontend -a claude-code
```

### Rôle

Taste influence la manière dont Claude réfléchit au frontend.

On l’utilise pour éviter le rendu :

- générique ;
- SaaS ;
- trop arrondi ;
- trop décoratif ;
- gros vide inutile ;
- gradients gratuits ;
- vibe coding.

### Ce qu’il apporte

Un cadre pour réfléchir à :

- typographie ;
- densité ;
- hiérarchie ;
- spacing ;
- surfaces ;
- composition ;
- accents ;
- rythme visuel.

---

# 16. `image-to-code`

Première tentative :

```text
image-to-code-skill
```

Le repo a répondu :

```text
No matching skills found
```

et nous a donné le vrai nom :

```text
image-to-code
```

Installation correcte :

```powershell
npx skills add https://github.com/Leonxlnx/taste-skill --skill image-to-code -a claude-code
```

### Rôle

Quand on donne une capture d’écran ou une maquette à Claude, ce skill l’aide à analyser :

- proportions ;
- grille ;
- spacing ;
- typographie ;
- couleurs ;
- composants ;
- radii ;
- structure.

Puis à reconstruire.

### Usage futur

Tu pourras lui donner une référence et demander :

> Rebuild this interface faithfully using our stack and DESIGN.md.

---

# 17. Playwright MCP — Claude

Commande :

```powershell
claude mcp add playwright npx @playwright/mcp@latest
```

Résultat :

```text
Added stdio MCP server playwright
```

Puis :

```powershell
claude mcp list
```

a confirmé :

```text
playwright ... Connected
```

### À quoi ça sert

Playwright donne à Claude un navigateur automatisable.

Claude pourra potentiellement :

1. démarrer l’application ;
2. ouvrir localhost ;
3. naviguer ;
4. cliquer ;
5. lire le DOM ;
6. prendre des screenshots ;
7. inspecter des erreurs ;
8. vérifier des flows ;
9. comparer avant/après.

### Pourquoi c’est important pour le design

Sans navigateur :

> Claude imagine le résultat à partir du code.

Avec navigateur :

> Claude peut vérifier le résultat réel.

---

# 18. Chrome DevTools MCP

ECC a aussi ajouté :

```text
plugin:ecc:chrome-devtools
```

qui était connecté côté Claude.

Plus tard, ECC a aussi configuré Chrome DevTools côté Codex.

### Rôle

Donner aux agents des capacités d’inspection navigateur complémentaires :

- console ;
- réseau ;
- structure ;
- debugging ;
- inspection de page.

---

# 19. Awesome Design MD

On a cloné la bibliothèque :

```powershell
git clone --depth 1 https://github.com/VoltAgent/awesome-design-md.git ..\awesome-design-md
```

Important :

on l’a mise **à côté du projet**, pas dedans.

Pourquoi ?

Parce que ce repo est une bibliothèque de références.

On ne voulait pas que Claude pense que :

> « 57 design systems = la spec officielle du projet ».

---

# 20. Références visuelles explorées

On a inspecté :

- Linear ;
- Coinbase ;
- Kraken ;
- Vercel.

On a choisi **Linear comme base de référence principale** pour :

- sobriété ;
- hiérarchie ;
- dark surfaces ;
- bordures discrètes ;
- faible décoration ;
- densité.

On n’a pas décidé de copier Linear.

---

# 21. `DESIGN_REFERENCE_LINEAR.md`

Commande :

```powershell
Copy-Item ..\awesome-design-md\design-md\linear.app\DESIGN.md .\DESIGN_REFERENCE_LINEAR.md
```

### Pourquoi le renommer

On ne voulait surtout pas l’appeler directement :

```text
DESIGN.md
```

Sinon Claude aurait pu croire :

> « Le design de Linear est la loi officielle du produit. »

Donc :

```text
DESIGN_REFERENCE_LINEAR.md
```

signifie :

> inspiration / prior art / direction de discipline visuelle.

Pas source de vérité.

---

# 22. Création du vrai `DESIGN.md`

On a relancé Claude avec le skill :

```text
design-taste-frontend
```

Puis on lui a demandé de lire :

```text
DESIGN_REFERENCE_LINEAR.md
```

et de créer :

```text
DESIGN.md
```

spécifique au terminal Gold.

Claude a créé un document d’environ :

```text
815 lignes
~39 KB
```

### Ce `DESIGN.md` contient maintenant

Entre autres :

- philosophie visuelle ;
- système de couleurs ;
- backgrounds ;
- surfaces ;
- typography ;
- numeric typography ;
- spacing scale ;
- grid/layout ;
- modules/cards ;
- borders ;
- radii ;
- shadows ;
- navigation ;
- tables ;
- charts ;
- buttons ;
- forms ;
- badges ;
- freshness indicators ;
- warnings ;
- events ;
- responsive ;
- motion ;
- accessibility ;
- loading/error/stale ;
- iconography ;
- density ;
- do/don’t.

### Pourquoi c’est très important

Avant :

> « Fais-moi une belle page ».

Maintenant :

> « Implémente la page conformément à DESIGN.md. »

On réduit fortement l’improvisation visuelle.

---

# 23. Hiérarchie design actuelle

Le workflow design voulu est :

```text
DESIGN_REFERENCE_LINEAR.md
        ↓ inspiration

design-taste-frontend
        ↓ méthode de design

DESIGN.md
        ↓ loi visuelle officielle

image-to-code
        ↓ si référence visuelle

21st
        ↓ briques/composants éventuels

Claude/Codex
        ↓ implémentation

Playwright / Chrome DevTools
        ↓ inspection réelle

web-design-guidelines
        ↓ audit
```

Important :

**21st n’a pas le droit de redéfinir le design.**

Le design reste piloté par `DESIGN.md`.

---

# 24. 21st — première configuration côté Claude

On a lancé le CLI 21st.

Le CLI a généré une configuration MCP de type :

```json
{
  "mcpServers": {
    "21st": {
      "type": "http",
      "url": "https://21st.dev/api/mcp",
      "headers": {
        "x-api-key": "${API_KEY_21ST}"
      }
    }
  }
}
```

### Point crucial

La clé n’est pas écrite dans le repo.

Le fichier contient seulement :

```text
${API_KEY_21ST}
```

qui veut dire :

> prends la vraie valeur depuis l’environnement de la machine.

---

# 25. Clé API 21st sous Windows

On a créé une clé côté 21st.

Puis on l’a enregistrée comme variable d’environnement utilisateur :

```text
API_KEY_21ST
```

On a volontairement évité :

- `.env` commité ;
- fichier source ;
- `.mcp.json` avec la vraie clé ;
- copier la clé dans la conversation.

On a vérifié :

```powershell
if ($env:API_KEY_21ST -and $env:API_KEY_21ST.StartsWith("21st_sk_")) { "OK: API_KEY_21ST loaded" } else { "NOT OK" }
```

Résultat :

```text
OK: API_KEY_21ST loaded
```

---

# 26. Autorisation MCP 21st dans Claude

`claude mcp list` indiquait d’abord :

```text
Pending approval
```

On a relancé Claude.

Claude a demandé l’autorisation.

On a choisi :

```text
Use this MCP server
```

et pas l’option :

> approuver automatiquement tous les futurs MCP.

### Pourquoi

On veut rester explicite avec les outils externes.

Un MCP peut communiquer avec un service.

On préfère autoriser individuellement.

---

# 27. État MCP Claude obtenu

On a vu notamment :

- Google Drive ;
- Gmail ;
- Google Calendar ;
- `plugin:ecc:chrome-devtools` ;
- `playwright` ;
- `21st`.

Le setup principal navigateur/design côté Claude était donc opérationnel.

---

# 28. Installation de l’extension Codex VS Code

Commande :

```powershell
code --install-extension OpenAI.chatgpt
```

Résultat :

```text
Extension 'openai.chatgpt' ... successfully installed.
```

Puis on a vérifié :

```powershell
code --list-extensions | Select-String -Pattern '^openai\.chatgpt$'
```

Résultat :

```text
openai.chatgpt
```

### Ce que ça apporte

Codex est utilisable directement depuis l’environnement VS Code.

---

# 29. Installation du Codex CLI

Commande :

```powershell
npm i -g @openai/codex
```

Vérification :

```powershell
codex --version
```

Résultat observé :

```text
codex-cli 0.149.0
```

### Pourquoi avoir le CLI ET l’extension

Extension :

> interaction dans VS Code.

CLI :

> interaction directe dans le terminal, scripts, config, outils, MCP, workflow avancé.

---

# 30. Premier lancement Codex

Commande :

```powershell
codex
```

Codex a demandé :

```text
Do you trust the contents of this directory?
```

On a choisi :

```text
Yes, continue
```

Parce que le dossier était notre propre projet.

### Pourquoi cette question existe

Les repos peuvent contenir :

- instructions ;
- hooks ;
- config locale ;
- scripts.

Un repo non fiable pourrait tenter des comportements dangereux.

C’est donc une barrière de sécurité.

---

# 31. Sync ECC → Codex

On voulait que Codex bénéficie du socle ECC.

On a exécuté le script ECC avec Git Bash :

```powershell
& "C:\Program Files\Git\bin\bash.exe" scripts/sync-ecc-to-codex.sh
```

Le log a indiqué notamment :

```text
Merging ECC AGENTS
Merging ECC Codex baseline
multi_agent enabled
profiles.strict
profiles.yolo
agents.explorer
agents.reviewer
agents.docs_researcher
chrome-devtools MCP
global git safety hooks
102 prompts generated
```

Puis :

```text
ECC GLOBAL SANITY: PASS
```

### Ce que cela veut dire

Codex a reçu un environnement ECC adapté à sa propre architecture.

---

# 32. Git safety hooks côté Codex

La sync ECC a installé des hooks Git globaux.

On a vu :

```text
Global pre-commit hook
Global pre-push hook
```

### Idée

Avant certaines opérations Git, ECC peut exécuter des vérifications.

### Important

Ce type de hook doit rester sous surveillance.

S’il ralentit trop ou bloque de manière incorrecte, on pourra l’ajuster.

---

# 33. Skills ECC dans Codex

Le sanity check a d’abord averti :

```text
Skills directory missing
```

On a donc créé/copié :

```powershell
New-Item -ItemType Directory -Force "$HOME\.agents\skills" | Out-Null
Copy-Item -Recurse -Force .\.agents\skills\* "$HOME\.agents\skills\"
```

### But

Permettre à Codex de trouver les skills.

---

# 34. Bug `bunx` dans Codex

Au redémarrage, Chrome DevTools essayait d’utiliser :

```text
bunx
```

mais Bun n’était pas installé.

On a inspecté :

```powershell
Select-String -Path "$HOME\.codex\config.toml" -Pattern 'chrome-devtools' -Context 0,6
```

Résultat :

```text
command = "bunx"
```

On a remplacé par :

```text
command = "npx"
```

### Pourquoi

Node/NPM était déjà installé.

Pas besoin d’ajouter Bun uniquement pour ce MCP.

---

# 35. Skills design partagés Claude + Codex

On a installé pour Codex :

```text
design-taste-frontend
image-to-code
web-design-guidelines
```

Le listing final a montré :

```text
Agents: Codex, Claude Code
```

### Pourquoi c’est important

Les deux agents peuvent maintenant utiliser le même langage de design.

Ils ne sont pas condamnés à avoir :

- Claude avec un design system ;
- Codex avec un autre.

---

# 36. 21st côté Codex

La tentative d’installation via marketplace plugin Codex a échoué :

```text
marketplace root does not contain a supported manifest
```

On n’a pas forcé.

On a configuré 21st directement comme MCP dans Codex.

Puis on a installé :

```text
21st-ai
21st-cli-use
```

pour Codex.

Le listing a confirmé :

```text
21st-ai
Agents: Codex

21st-cli-use
Agents: Codex
```

---

# 37. MCP Codex final

Le listing Codex a indiqué :

- `chrome-devtools` ;
- `node_repl` ;
- `playwright` ;
- `sites-design-picker` ;
- `21st`.

Pour 21st :

```text
enabled
Bearer token
```

Donc l’authentification était configurée.

---

# 38. `AGENTS.md`

On a créé à la racine :

```text
AGENTS.md
```

### Rôle

C’est le point d’entrée projet de Codex.

Il lui dit notamment :

- lire `AI_WORKFLOW.md` ;
- lire `DESIGN.md` pour l’UI ;
- ne pas inventer la business logic ;
- inspecter Git avant modification ;
- préserver le travail non commité ;
- vérifier après modification ;
- utiliser les skills/MCP quand utile ;
- ne pas éditer les mêmes fichiers que Claude simultanément.

---

# 39. `CLAUDE.md`

On a créé :

```text
CLAUDE.md
```

### Rôle

Même idée côté Claude Code.

Il pointe vers :

```text
AI_WORKFLOW.md
```

et vers :

```text
DESIGN.md
```

selon le type de tâche.

---

# 40. `AI_WORKFLOW.md`

On a créé :

```text
AI_WORKFLOW.md
```

C’est la **charte commune de travail**.

Elle contient notamment :

## Source of truth

- ne pas inventer business rules ;
- ne pas inventer market definitions ;
- ne pas inventer formulas ;
- ne pas inventer providers ;
- ne pas inventer UI semantics ;
- ne pas remplacer silencieusement une méthodologie.

## Avant modification

1. lire les docs pertinentes ;
2. inspecter l’implémentation ;
3. regarder `git status` ;
4. préserver les changements existants ;
5. proposer un plan si tâche non triviale.

## UI

- `DESIGN.md` autoritaire ;
- Linear = inspiration uniquement ;
- design terminal financier, pas SaaS ;
- couleurs sémantiques ;
- Playwright lorsque pertinent ;
- audit Guidelines.

## Engineering

- patterns existants d’abord ;
- scope limité ;
- pas d’overengineering ;
- pas de secrets hardcodés ;
- validation des données externes ;
- erreurs/stale/unavailable explicites ;
- tests/build/typecheck ;
- ne jamais prétendre que ça marche si la vérification échoue.

## Collaboration Claude ↔ Codex

- jamais les mêmes fichiers en parallèle ;
- un agent implémente ;
- l’autre review ensuite ;
- préserver les changements non commités ;
- petites boundaries de commits.

## Business logic

- métier avant commodité provider ;
- provider s’adapte au requirement ;
- fact/derived/model/AI distincts ;
- pas de hidden fallback ;
- pas de causalité inventée ;
- pas de BUY/SELL inventé.

---

# 41. Pourquoi trois fichiers et pas un seul

Architecture :

```text
Claude Code
   ↓
CLAUDE.md
   ↓
AI_WORKFLOW.md
```

et :

```text
Codex
   ↓
AGENTS.md
   ↓
AI_WORKFLOW.md
```

### Pourquoi

Si on dupliquait tout dans les deux fichiers :

- un jour tu modifies Claude ;
- tu oublies Codex ;
- deux vérités divergent.

Avec un document commun :

```text
AI_WORKFLOW.md
```

on minimise ce risque.

---

# 42. Test Codex

On a demandé à Codex de lire :

- `AGENTS.md` ;
- `AI_WORKFLOW.md` ;
- `DESIGN.md`.

Sans modifier de fichiers.

Codex a correctement identifié :

- les règles avant modification ;
- `DESIGN.md` comme source visuelle ;
- le comportement en cas d’ambiguïté ;
- la coordination avec Claude ;
- les skills frontend ;
- Playwright/browser pour vérification.

### Conclusion

Codex voit réellement les instructions projet.

---

# 43. Test Claude

Même test côté Claude.

Claude a correctement identifié :

- les règles ;
- `DESIGN.md` ;
- le stop-and-ask si logique métier ambiguë ;
- la coordination avec Codex ;
- les skills ;
- Playwright ;
- la vérification obligatoire.

### Problème observé

Pendant la lecture, certains hooks ECC ont généré :

```text
VirtualAlloc failed
Resource temporarily unavailable
```

mais avec statut non bloquant.

### Ce qu’il faut retenir

ECC fonctionne.

Mais si ces erreurs deviennent fréquentes en développement réel, il faudra identifier le hook gourmand et l’ajuster.

---

# 44. Gestion de la clé 21st

On a vérifié :

```powershell
Get-Content .\.mcp.json
```

Le fichier contenait :

```json
"x-api-key": "${API_KEY_21ST}"
```

Puis on a scanné le projet à la recherche de :

```text
21st_sk_
```

Résultat :

```text
OK: no 21st API key found inside project files
```

### Conclusion

La clé n’est pas dans le repo.

C’est exactement ce qu’on voulait.

---

# 45. Git status actuel

Le projet montre plusieurs fichiers non suivis :

```text
?? .agents/
?? .claude/
?? .mcp.json
?? AGENTS.md
?? AI_WORKFLOW.md
?? CLAUDE.md
?? DESIGN.md
?? DESIGN_REFERENCE_LINEAR.md
?? skills-lock.json
```

Mais aussi des dossiers préexistants :

```text
Dashboard-2/
Document Gloabl/
Document options/
```

### Conséquence

NE PAS faire :

```powershell
git add .
```

aveuglément.

Il faudra faire un commit propre et sélectif.

---

# 46. Workflow idéal Claude ↔ Codex

## Pattern 1 — Claude implémente, Codex review

```text
Spec métier lockée
↓
Claude lit CLAUDE.md
↓
Claude lit AI_WORKFLOW.md
↓
Claude lit la spec
↓
Claude planifie
↓
Claude implémente
↓
Claude vérifie
↓
Codex lit AGENTS.md
↓
Codex review le diff
↓
Claude corrige uniquement les remarques valides
```

---

## Pattern 2 — Codex implémente, Claude review

Même chose à l’inverse.

Le principe important :

> **pas deux agents qui écrivent en parallèle sur les mêmes fichiers.**

---

# 47. Workflow frontend idéal

```text
Spec UI / produit
↓
DESIGN.md
↓
Taste
↓
Claude ou Codex
↓
21st si un composant existant est utile
↓
Implémentation
↓
Playwright / Chrome DevTools
↓
screenshot / interaction / console
↓
corrections
↓
web-design-guidelines
↓
review par l'autre agent
```

---

# 48. Workflow backend idéal

```text
Spec métier lockée
↓
requirements data
↓
plan
↓
implémentation
↓
tests
↓
validation des données externes
↓
gestion errors/stale/fallback
↓
security review
↓
review second agent
```

---

# 49. Workflow providers/API idéal pour le terminal Gold

On ne commencera PAS par :

> quelle API est cool ?

On commencera par :

> quel requirement avons-nous ?

Puis :

```text
Requirement
↓
freshness
latency
coverage
history
methodology
rights
cost
↓
candidate providers
↓
fit par dimension
↓
rôle
SOURCE_OF_TRUTH / PRIMARY_DELIVERY / CONFIRMING / FALLBACK
```

Donc les providers doivent s’adapter au produit.

Pas l’inverse.

---

# 50. Où intervient `public-apis/public-apis`

Le repo public APIs n’est pas un plugin.

On ne l’installe pas dans Claude.

C’est simplement un **catalogue de candidats**.

Plus tard, en phase sources :

1. on part d’un requirement ;
2. on regarde les candidates possibles ;
3. on vérifie chaque source réellement ;
4. on ne prend jamais la liste GitHub comme preuve.

---

# 51. Ce que le setup ne doit jamais devenir

Un piège serait :

> installer toujours plus de skills.

Ce n’est pas la bonne stratégie.

Trop de :

- rules ;
- hooks ;
- skills ;
- agents ;
- MCP ;

peut produire :

- plus de contexte ;
- plus de latence ;
- plus de bruit ;
- plus de conflits ;
- plus de bugs.

Nouvelle règle :

> ajouter un outil seulement lorsqu’un problème concret le justifie.

---

# 52. Ce qu’on a gagné techniquement

## Avant

Tu pouvais demander :

> Fais cette feature.

Et l’IA improvisait beaucoup.

## Maintenant

L’agent dispose de :

- règles ;
- design ;
- workflows ;
- skills ;
- hooks ;
- browser tools ;
- collaboration policy ;
- verification discipline.

Donc le même prompt a beaucoup plus de structure autour de lui.

---

# 53. Ce qu’on a gagné en design

Avant :

> beau dashboard.

Maintenant :

- style autoritaire dans `DESIGN.md` ;
- Taste ;
- image-to-code ;
- Playwright ;
- Chrome DevTools ;
- 21st ;
- Vercel Guidelines ;
- second agent en review.

C’est un vrai pipeline.

---

# 54. Ce qu’on a gagné en sécurité

- secrets hors repo ;
- scan de clé ;
- hooks ECC ;
- Git safety hooks ;
- verification ;
- instructions « never hardcode secrets » ;
- approbation explicite des MCP.

---

# 55. Ce qu’on a gagné en continuité

Le projet ne dépend plus uniquement de « ce que Claude se rappelle dans cette conversation ».

Les décisions importantes vivent maintenant dans des fichiers :

```text
DESIGN.md
AI_WORKFLOW.md
AGENTS.md
CLAUDE.md
```

et les specs métier existantes.

Donc une nouvelle session peut reconstruire le contexte beaucoup plus facilement.

---

# 56. Ce que toi tu dois apprendre comme futur software engineer

Le vrai apprentissage n’est pas :

> savoir lancer toutes ces commandes.

Le vrai apprentissage est :

## 1. Spécifier

Savoir définir exactement ce qu’un système doit faire.

## 2. Séparer les responsabilités

Métier ≠ provider  
design ≠ composants  
facts ≠ AI interpretation  
implémentation ≠ review

## 3. Gérer le contexte

Donner à l’IA juste les informations nécessaires.

## 4. Vérifier

Ne jamais croire un agent uniquement parce qu’il dit :

> done.

## 5. Construire des garde-fous

Tests, hooks, rules, audits.

## 6. Garder une source de vérité

Specs et docs autoritaires.

## 7. Préserver les secrets

Jamais dans le repo.

## 8. Utiliser plusieurs agents intelligemment

Pas comme deux codeurs qui se battent sur le même fichier.

---

# 57. La philosophie à retenir

On cherche à transformer :

```text
PROMPT → CODE
```

en :

```text
SPEC
↓
CONTEXT
↓
PLAN
↓
IMPLEMENTATION
↓
TEST
↓
BROWSER/TOOLS
↓
REVIEW
↓
VERIFY
↓
DOCUMENT
↓
IMPROVE THE PROCESS
```

C’est ça la différence entre :

**AI coding**

et :

**AI-assisted software engineering**.

---

# 58. État actuel du setup

## Claude Code

- mis à jour ;
- ECC installé ;
- hooks standard ;
- rules communes ECC ;
- design skills ;
- Playwright ;
- Chrome DevTools ;
- 21st ;
- `CLAUDE.md` ;
- `AI_WORKFLOW.md` ;
- `DESIGN.md`.

## Codex

- extension VS Code installée ;
- CLI installé ;
- ECC sync ;
- agents ECC ;
- prompts ECC ;
- Git hooks ;
- skills ;
- Playwright ;
- Chrome DevTools ;
- 21st ;
- `AGENTS.md` ;
- `AI_WORKFLOW.md` ;
- `DESIGN.md`.

## Design

- Linear référence ;
- `DESIGN.md` propre au terminal ;
- Taste ;
- image-to-code ;
- Vercel Guidelines ;
- Playwright ;
- 21st.

## Secrets

- clé 21st dans variable Windows ;
- pas dans le repo ;
- scan OK.

---

# 59. Ce qui reste à faire après ce setup

Le setup IA est pratiquement terminé.

On doit maintenant revenir au **produit**.

Ordre recommandé :

1. terminer la logique métier F1 ;
2. locker F1 ;
3. remplir F2 ;
4. locker F2 ;
5. continuer jusqu’à F13 ;
6. seulement après, phase Sources/API ;
7. choisir providers ;
8. figer architecture technique réelle ;
9. base de données ;
10. ingestion ;
11. backend ;
12. frontend ;
13. tests ;
14. audit design ;
15. exécution/journal ;
16. durcissement sécurité.

---

# 60. Où en est le terminal Gold au niveau métier

Avant cette session de setup IA, le projet avait déjà :

- philosophie globale définie ;
- 13 familles définies ;
- navigation globale définie ;
- principes de données définis ;
- séparation fact / derived / estimate / AI ;
- règles de freshness ;
- audit/snapshots ;
- logique News/Event ;
- absence de scoring directionnel simpliste ;
- schéma de Data Requirements Matrix locké ;
- F1 Gold/Price presque finalisée.

Ce setup IA n’a donc **pas remplacé** la logique métier.

Il prépare simplement les agents qui vont l’implémenter plus tard.

---

# 61. La phrase finale à retenir

Avant cette session :

> « J’ai Claude Code et je peux lui demander de coder. »

Après cette session :

> « J’ai Claude Code et Codex travaillant dans le même projet avec des règles communes, un système de design autoritaire, des skills spécialisés, des outils navigateur, des garde-fous, des MCP, une gestion des secrets, une politique de review croisée et un workflow d’ingénierie reproductible. »

C’est la vraie transformation.

---

# 62. Cheat sheet ultra-courte

## Claude

```powershell
claude
```

Lit :

```text
CLAUDE.md
→ AI_WORKFLOW.md
→ docs pertinentes
→ DESIGN.md si UI
```

## Codex

```powershell
codex
```

Lit :

```text
AGENTS.md
→ AI_WORKFLOW.md
→ docs pertinentes
→ DESIGN.md si UI
```

## Règle collaboration

```text
Un agent implémente.
L'autre review.
Jamais mêmes fichiers en parallèle.
```

## Design

```text
DESIGN.md = loi
Linear = référence
Taste = goût
image-to-code = reproduction visuelle
21st = composants
Playwright = navigateur
Vercel Guidelines = audit
```

## Secrets

```text
variables d'environnement
≠
code/repo
```

## Fin d’une tâche

Toujours demander :

```text
Qu'as-tu modifié ?
Qu'as-tu réellement testé ?
Qu'est-ce qui a échoué ?
Qu'est-ce qui reste non vérifié ?
```

---

# 63. Commandes principales utilisées pendant le setup

> Cette section sert surtout de mémoire.  
> Ne pas tout relancer aveuglément sur un autre projet sans comprendre les scopes.

## Claude update

```powershell
claude update
```

## ECC marketplace

```powershell
claude plugin marketplace add affaan-m/ECC
```

## ECC plugin

```powershell
claude plugin install ecc@ecc
```

## Vercel design skill

```powershell
npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines -a claude-code
```

## Taste

```powershell
npx skills add https://github.com/Leonxlnx/taste-skill --skill design-taste-frontend -a claude-code
```

## Image-to-code

```powershell
npx skills add https://github.com/Leonxlnx/taste-skill --skill image-to-code -a claude-code
```

## Claude Playwright

```powershell
claude mcp add playwright npx @playwright/mcp@latest
```

## Awesome Design MD

```powershell
git clone --depth 1 https://github.com/VoltAgent/awesome-design-md.git ..\awesome-design-md
```

## Linear reference

```powershell
Copy-Item ..\awesome-design-md\design-md\linear.app\DESIGN.md .\DESIGN_REFERENCE_LINEAR.md
```

## ECC clone

```powershell
git clone --depth 1 https://github.com/affaan-m/ECC.git ..\ECC
```

## Codex extension

```powershell
code --install-extension OpenAI.chatgpt
```

## Codex CLI

```powershell
npm i -g @openai/codex
```

## Codex version

```powershell
codex --version
```

## ECC → Codex sync

Depuis le repo ECC :

```powershell
& "C:\Program Files\Git\bin\bash.exe" scripts/sync-ecc-to-codex.sh
```

## Project skills check

```powershell
npx skills list -a codex
```

## MCP Claude

```powershell
claude mcp list
```

## MCP Codex

```powershell
codex mcp list
```

---

# 64. Prochaine règle de travail

À partir de maintenant :

**On arrête d’installer des outils “parce qu’ils ont l’air cool”.**

On revient au produit.

Si plus tard un problème apparaît :

> “Claude n’arrive pas à faire X correctement”

alors seulement on demande :

> existe-t-il un skill, hook, agent ou MCP qui résout réellement ce problème ?

C’est ainsi qu’on évite de transformer un environnement puissant en usine à gaz.
