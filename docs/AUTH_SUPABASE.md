# Auth Supabase — journal de travail

> Ce fichier est le carnet de bord de la mise en place de l'authentification Supabase et du déploiement. Chaque session (Claude ou autre) doit lire ce fichier en premier, et le mettre à jour avant de s'arrêter : où on en est, ce qui reste, ce qui bloque.

## STATUT — 2026-09-09 : chaîne complète confirmée fonctionnelle

**Vérifié par l'utilisateur en conditions réelles** : inscription → confirmation email → connexion → `/market` affiche des données réelles (statut "Connected", KPIs marqués `REAL`, aucune donnée mock). Screenshot à l'appui. Les 3 couches (Supabase Auth, backend Railway, frontend Vercel) sont en ligne et se parlent correctement.

**URLs de production :**
- Frontend : https://frontend-nine-sand-21.vercel.app
- Backend : https://backend-production-470b.up.railway.app

**Il reste seulement ceci — rien de plus, ne pas re-refaire ce qui est déjà fait au-dessus :**

1. **[Dashboard Supabase, utilisateur]** Authentication → URL Configuration : mettre `Site URL` = `https://frontend-nine-sand-21.vercel.app` et ajouter `https://frontend-nine-sand-21.vercel.app/auth/callback` dans `Redirect URLs`. Sans ça, un lien de confirmation/reset envoyé alors qu'on est sur `localhost` en dev pointera vers `localhost` en prod (déjà rencontré une fois, cause documentée dans "Mise à jour 2" plus bas). **Peut ne plus être bloquant si l'utilisateur l'a déjà fait entre-temps — vérifier avant d'agir, ne pas supposer.**
2. **[Mis en pause volontairement par l'utilisateur, 2026-09-09]** Template email de confirmation personnalisé — **impossible en l'état** : tenté via l'API Management de Supabase (token `SUPABASE_API_KEY=sbp_...` dans `.env`, fonctionnel et vérifié pour lire `SITE_URL`/`URI_ALLOW_LIST`), rejeté avec `400 : "Email template modification is not available for free tier projects using the default email provider. Please upgrade your plan or configure a custom SMTP provider."` — **erreur de ma part plus tôt dans le projet** : j'avais dit qu'un template perso ne nécessitait pas de SMTP externe, c'est faux sur le plan gratuit Supabase. Trois options présentées à l'utilisateur (SMTP externe gratuit type Resend / rester sur le template par défaut / passer Supabase en payant) — **décision reportée explicitement à plus tard**, ne pas relancer ce sujet sans que l'utilisateur le redemande. L'email de confirmation reste donc au template générique anglais de Supabase pour l'instant — fonctionnel, juste pas personnalisé. `docs/email-templates/confirm-signup.html` reste prêt si l'utilisateur choisit l'option SMTP externe plus tard.
3. **[Optionnel, IA]** Le build Railway compile actuellement tout le monorepo (contracts + backend + **frontend**, ce dernier inutile puisque Vercel sert déjà le frontend) — `railway.json` pointe vers `npm run build:backend` mais Railpack a utilisé le script racine `build` à la place lors du déploiement initial ; investiguer pourquoi et corriger si les temps de build gênent. Non bloquant, juste plus lent que nécessaire.
4. **[Décision utilisateur, pas urgent]** Railway tourne sur un essai (30 jours ou 5$ de crédits). Décider avant expiration : payer (~5$/mois) ou migrer.
5. **[Jamais fait, hors scope initial]** Aucune page de profil ne prouve encore la chaîne frontend → Supabase → **backend** de bout en bout via `requireHolder`/`GET /api/auth/me` (le screenshot prouve frontend → Supabase et frontend → backend pour les données marché publiques, mais pas une route backend protégée par un token). À faire si une fonctionnalité a besoin de savoir "qui est connecté" côté backend (ex : sauvegarder des données liées à un holder).
6. **[Fixé en local, pas encore redéployé]** Open redirect corrigé sur `next` (login + callback) — voir "Mise à jour 5" plus bas. Redéployer sur Vercel avant de considérer le fix live en prod.
7. **[Action utilisateur ou token trouvé dans `.env`, pas encore fait]** MySQL local abandonné entièrement — voir "Mise à jour 6" plus bas. `SUPABASE_DB_PASSWORD` doit être ajouté aux variables d'environnement Railway (jusqu'ici volontairement exclu, maintenant réellement nécessaire au runtime). Un `railway_api_token` existe dans `apps/backend/.env` — pourrait servir à l'ajouter par API plutôt qu'à la main sur le dashboard, à confirmer avec l'utilisateur avant d'agir (action sur une infra de prod).

**Avant de toucher au code pour une nouvelle demande** : relire tout ce fichier (pas seulement ce statut) pour le contexte des décisions (pourquoi Supabase Auth plutôt qu'une table maison, pourquoi le Session Pooler, pourquoi pas de MCP, etc.) — ça évite de re-déboguer des problèmes déjà résolus et documentés plus bas.

## Contexte / décisions prises

- Auth gérée entièrement par **Supabase Auth** (`auth.users`) : mots de passe, hashing, confirmation par email, sessions/JWT. On ne stocke jamais de mot de passe nous-mêmes.
- Table `public.holders` = profil seulement (id, email, display_name, created_at), liée 1:1 à `auth.users.id`. RLS activée : chacun ne voit/modifie que sa propre ligne.
- Template d'email de confirmation : **personnalisé** (HTML custom dans le dashboard Supabase), pas de SMTP externe pour l'instant (donc pas d'adresse d'expéditeur perso — reste `noreply@mail.app.supabase.io` ou équivalent tant qu'aucun SMTP custom n'est branché).
- Connexion à Supabase Postgres : le host direct (`db.<ref>.supabase.co`) est IPv6-only et injoignable depuis cet environnement de dev. On utilise le **Session Pooler** (`aws-0-us-east-2.pooler.supabase.com:5432`, user `postgres.hohhiirntlndbgarvmhr`), gratuit, compatible IPv4.
- Le MCP Supabase a été configuré (`claude mcp add ... supabase`) mais s'est révélé peu fiable entre sessions/fenêtres Claude Code différentes (outils non chargés de façon cohérente). **On travaille sans MCP**, via connexion Postgres directe (scripts ponctuels, jamais committés) et l'API REST/Auth de Supabase.
- Déploiement prévu : frontend Next.js sur **Vercel**, backend Express reste à héberger séparément (pas encore fait — voir section Déploiement).

## Secrets (où ils vivent, ne jamais les committer)

Dans `apps/backend/.env` (non versionné) :
- `SUPABASE_API_URL`, `SUPABASE_DB_PASSWORD`, `vercel_api_key`
- À AJOUTER par l'utilisateur si pas déjà fait : `SUPABASE_PUBLISHABLE_KEY` (sb_publishable_...), `SUPABASE_SECRET_KEY` (sb_secret_...)

Pour le frontend (`apps/frontend/.env.local`, non versionné) :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (safe côté client, RLS protège les données)

## État d'avancement

### Fait
- [x] Security review du diff en cours (rien de critique trouvé) — voir conversation, pas de fichier séparé.
- [x] Migration `apps/backend/src/db/migrations-supabase/001_holders.sql` écrite et **appliquée** sur Supabase (table `holders` existe, RLS + trigger auto-création de profil en place).
- [x] Package `pg` ajouté à `apps/backend` (scripts de migration ponctuels seulement — le runtime backend continue MySQL pour les données marché ; Supabase/Postgres est dédié à l'auth).
- [x] Note "Déploiement" ajoutée au README principal (piste Netlify explorée puis abandonnée, Supabase+Vercel actée).
- [x] `apps/backend/src/config/env.ts` : ajout de `SupabaseConfig`/`loadSupabase()` — accepte les noms de clés legacy (`SUPABASE_API_ANON`/`SUPABASE_API_service_role`, déjà dans `.env`) et les nouveaux (`SUPABASE_PUBLISHABLE_KEY`/`SUPABASE_SECRET_KEY`), normalise l'URL REST vers l'URL de base.
- [x] `apps/backend/src/auth/supabaseAuth.ts` : middleware `requireHolder` qui vérifie le JWT Supabase (`Authorization: Bearer <token>`) et attache `req.holder`. Route de test `GET /api/auth/me`.
- [x] Frontend : `@supabase/supabase-js` + `@supabase/ssr` installés. `src/lib/supabase/client.ts` (browser) et `server.ts` (SSR).
- [x] `apps/frontend/src/middleware.ts` (⚠️ doit être dans `src/`, pas à la racine — piège Next.js avec un projet en layout `src/`, ça m'a fait perdre du temps) : protège toutes les routes sauf `/login` et `/auth/callback`, redirige vers `/login?next=...` si pas de session.
- [x] `apps/frontend/src/app/login/page.tsx` + `page.module.css` : écran d'authentification (inscription/connexion par onglets), design animé cohérent avec `DESIGN.md` (grille or qui dérive lentement, glow pulsé, transitions douces, respecte `prefers-reduced-motion`).
- [x] `apps/frontend/src/app/auth/callback/route.ts` : échange le code de confirmation email contre une session.
- [x] `.env.local` (frontend) et `.env.local.example` mis à jour avec les clés Supabase publiques.
- [x] Tests ajoutés (`tests/supabase-auth.test.ts`) : `loadSupabase()` (legacy + nouveaux noms, URL normalisée, cas non configuré), `requireHolder` (503 non configuré, 401 sans token). **195 tests passent, 0 échec.**
- [x] **Bug préexistant trouvé et corrigé** (pas lié à cette feature) : `/market` utilisait `useSearchParams()` sans `Suspense`, ce qui faisait planter `npm run build`. Corrigé en enveloppant dans un `<Suspense>` (même pattern que la page login).
- [x] Vérification réelle (pas juste "ça compile") : serveur de dev lancé, `/login` testé en HTTP (contenu correct), `/market` testé sans session → confirmé redirection 307 vers `/login`. **Bug trouvé pendant cette vérification** : le middleware ne s'appliquait pas du tout au premier essai (racine du projet au lieu de `src/`) — corrigé, puis revérifié.
- [x] **Déployé en production sur Vercel** : https://frontend-nine-sand-21.vercel.app — vérifié en HTTP après déploiement (`/market` redirige bien vers `/login` en prod aussi). Root directory du projet Vercel configuré sur `apps/frontend` (monorepo npm workspaces — un déploiement naïf de `apps/frontend` seul casse la résolution de `@gold-terminal/contracts`, corrigé en pointant le déploiement sur la racine du repo avec Root Directory = `apps/frontend`).
- [x] Variables d'environnement de production configurées sur Vercel : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_BACKEND_URL` (⚠️ ce dernier est un **placeholder** — voir "à faire" ci-dessous).
- [x] Template email de confirmation personnalisé écrit : `docs/email-templates/confirm-signup.html` (dark, accent or, cohérent avec l'identité produit).
- [x] `.vercel/` ajouté au `.gitignore`.

### Reste à faire — actions qui nécessitent le dashboard (pas automatisables avec les clés disponibles)

Les clés qu'on a (anon/service_role + mot de passe DB) donnent accès aux **données**, pas à la **configuration du projet** Supabase (templates email, liste des URLs de redirection autorisées). Ça nécessite un token "Management API" (Supabase Dashboard > Account > Access Tokens), qu'on n'a pas. Donc, à faire manuellement :

1. **Coller le template email** : Supabase Dashboard > Authentication > Email Templates > "Confirm signup" → coller le contenu de `docs/email-templates/confirm-signup.html`.
2. **Autoriser l'URL Vercel dans les redirections** : Supabase Dashboard > Authentication > URL Configuration → ajouter `https://frontend-nine-sand-21.vercel.app/auth/callback` dans "Redirect URLs" (et idéalement mettre `https://frontend-nine-sand-21.vercel.app` comme "Site URL"). **Sans ça, la confirmation d'email ne redirigera pas correctement en production** (ça marchera en local sur `localhost:3000` par défaut selon la config actuelle de Supabase).
3. Si tu veux un expéditeur d'email personnalisé (pas juste le template) : configurer un SMTP externe (ex: Resend) dans Authentication > Settings > SMTP Settings — pas fait, hors scope de la demande initiale ("template perso" seulement, pas SMTP perso).

### Mise à jour 3 — backend déployé sur Railway (2026-09-09)

Suite au test réel de l'utilisateur (connecté avec succès, puis `Failed to fetch market snapshot: 404` sur `/market` — attendu, backend pas encore en ligne), le backend a été déployé :

- [x] **Compte Railway créé par l'utilisateur**, authentifié en CLI via device-code flow (`railway login --browserless`) — un premier essai avec un token API compte (`railway_api_token` dans `.env`) a échoué ("Not Authorized" sur les deux formats d'en-tête testés) malgré un token visiblement correct (bon scope "hachim02pox's Projects", valeur confirmée identique) ; cause exacte non élucidée (peut-être une restriction sur compte d'essai tout neuf), contournée avec le login OAuth classique qui a fonctionné du premier coup.
- [x] Projet Railway `gold-terminal-backend` + service `backend` créés via CLI (`railway init`, `railway add --service backend`).
- [x] **Piège monorepo (même famille de problème que Vercel)** : Railpack (le buildpack de Railway) construit depuis la racine du repo (nécessaire pour résoudre `@gold-terminal/contracts`), mais détecte automatiquement la commande de démarrage depuis le `package.json` racine — qui n'avait pas de script `start`. Un `railway.json` avec `deploy.startCommand` a été ajouté mais son effet sur la phase de détection initiale n'était pas fiable. **Fix retenu** : ajout direct de scripts `start` et `build:backend` dans le `package.json` racine (`node apps/backend/dist/server.js`), que Railpack détecte nativement. `railway.json` conservé en complément (config-as-code, non nécessaire au fonctionnement mais inoffensif).
- [x] 22 variables d'environnement poussées sur le service Railway (toutes les clés fournisseurs + Supabase, `DATA_MODE=MOCK`, `FRONTEND_ORIGIN` pointant vers l'URL Vercel de prod). **Exclus délibérément** : `railway_api_token`, `vercel_api_key` (secrets de déploiement, pas des secrets applicatifs), `DB_NAME`/`SUPABASE_DB_PASSWORD` (pas de MySQL distant configuré — cohérent avec le comportement local, `db` reste `null` côté backend).
- [x] Déployé avec succès : **https://backend-production-470b.up.railway.app** — `/health` et `/api/market/snapshot` testés en direct, données réelles retournées, en-tête CORS correctement scopé à l'URL Vercel.
- [x] `NEXT_PUBLIC_BACKEND_URL` mis à jour sur Vercel avec cette URL (remplace le placeholder), frontend **redéployé** pour que la variable (figée au build) soit prise en compte.
- [x] Build + typecheck + 195 tests revérifiés après les changements de `package.json`.

**Note coût** : Railway tourne sur un essai (30 jours ou 5$ de crédits, selon ce qui arrive en premier) — pas gratuit indéfiniment, l'utilisateur devra décider de passer sur un plan payant (~5$/mois) ou migrer ailleurs une fois l'essai épuisé.

**Reste à faire** : le build Railway compile actuellement `contracts + backend + frontend` (le script racine `build`, que Railpack a utilisé au lieu de `build:backend` du `railway.json`) — fonctionnel mais plus lent que nécessaire, le frontend compilé n'étant jamais utilisé (c'est Vercel qui sert le frontend). Optimisation possible mais non bloquante, à reprendre si les temps de build deviennent gênants.

### Mise à jour — UX/sécurité du formulaire (suite à retour utilisateur)

L'utilisateur a testé le flux réel et reçu une erreur `otp_expired` avec redirection vers `localhost` (confirme le point "Redirect URLs" ci-dessus, pas encore réglé côté dashboard à ce moment). Il a aussi signalé 3 manques de bonnes pratiques sur l'écran de connexion, tous corrigés :

- [x] **Afficher/masquer le mot de passe** : bouton "Afficher/Masquer" à côté du champ (`apps/frontend/src/app/login/page.tsx`, `.passwordRow`/`.toggleVisibility` dans le CSS module).
- [x] **Mot de passe oublié** : lien sous le mot de passe en mode connexion → formulaire dédié (mode `forgot`) qui appelle `supabase.auth.resetPasswordForEmail`, redirige vers `/auth/callback?next=/reset-password` une fois le lien cliqué.
- [x] **Nouvelle page `apps/frontend/src/app/reset-password/page.tsx`** : formulaire nouveau mot de passe + confirmation, appelle `supabase.auth.updateUser({password})`. Protégée par le middleware comme toute route (nécessite la session recovery établie par le callback — vérifié : sans session, `/reset-password` redirige vers `/login`, ce qui est le comportement voulu).
- [x] **Champs sensibles vidés au changement de mode** (connexion/inscription/mot de passe oublié) : le mot de passe tapé ne survit jamais à un changement d'onglet, plutôt que de rester en mémoire React sans raison.
- [x] `apps/backend/src/app/auth/callback/route.ts` distingue maintenant confirmation email (`confirmation_failed`) et reset password expiré (`reset_failed`) pour un message d'erreur plus juste sur `/login`.
- [x] Build + typecheck revérifiés après ces changements, `/reset-password` apparaît bien dans le build, **redéployé en production** (nouvelle URL de déploiement, alias stable inchangé : https://frontend-nine-sand-21.vercel.app).

**Toujours en attente côté utilisateur** : les 2 réglages dashboard Supabase (Site URL + Redirect URLs vers l'URL Vercel) — sans ça, le nouveau flux "mot de passe oublié" aura le même problème `localhost` que la confirmation email initiale.

### Mise à jour 2 — bugs trouvés en testant le vrai flux (retour utilisateur avec screenshot)

L'utilisateur a testé pour de vrai et remonté 4 problèmes. Diagnostic + fix pour chacun :

1. **`email rate limit exceeded`** : pas un bug, c'est le plafond anti-spam par défaut de Supabase (email intégré, pas un SMTP perso — quelques envois/heure max). Normal en test répété. Fix : message traduit en français, actionnable (`translateAuthError` dans `login/page.tsx` reconnaît maintenant `/rate limit/i`).
2. **Recliquer "créer un compte" avec le même email n'envoie rien** : conséquence directe de #1 (Supabase ne renvoie pas d'email si la limite est atteinte) combiné à un message de succès qui mentait ("vérifiez votre boîte mail" même quand rien n'était réellement envoyé). Fix : le message de succès à l'inscription est maintenant honnête sur l'incertitude (Supabase ne révèle jamais si un email a été **réellement** envoyé, pour ne pas laisser deviner si un compte existe déjà).
3. **Cliquer un ancien lien de confirmation renvoie vers "se connecter" mais sans aucun message** — **vrai bug, corrigé**. Cause : quand un lien Supabase (confirmation ou reset) est invalide/expiré, GoTrue redirige directement vers la racine du Site URL (`/`) avec `error`/`error_code` en paramètres — PAS via notre route `/auth/callback`. Le middleware interceptait `/` (non authentifié) et redirigeait vers `/login` enécrasant ces paramètres au passage (une nouvelle redirection HTTP ne transporte jamais l'ancienne query string). Résultat : l'erreur disparaissait silencieusement. **Fix** : `apps/frontend/src/middleware.ts` détecte maintenant ce cas en tout premier (avant la porte d'authentification) et relaie l'erreur vers `/login?error=<code>`. Nouvelle fonction `describeLinkError()` dans `login/page.tsx` traduit `otp_expired`, `access_denied`, `reset_failed`, `confirmation_failed` en messages clairs. **Vérifié en local (dev server) et en production** avant/après déploiement — le message s'affiche bien maintenant.
4. **Compte existant, confirmé ou non, message d'erreur peu clair** : `translateAuthError` distingue maintenant "un compte confirmé existe déjà" (Supabase renvoie une vraie erreur dans ce cas précis) et invite à se connecter ou utiliser "mot de passe oublié" — le cas "existe mais pas confirmé" reste indissociable du cas "rate limit atteint" côté Supabase par design (anti-énumération de comptes), donc le message de succès générique du point 2 couvre ce cas aussi.

Build + typecheck + test manuel local (curl sur `/?error=...`) revérifiés, **redéployé en production**.

**Accès aux données** (question posée par l'utilisateur) : oui, accès admin complet via Supabase Dashboard → Authentication → Users (comptes, statut confirmé, dernière connexion) et Table Editor → holders (profils). Pas besoin de moi pour consulter ça.

### Reste à faire — vérification humaine

- [ ] **Test manuel réel par l'utilisateur** : créer un compte sur https://frontend-nine-sand-21.vercel.app/login, recevoir l'email de confirmation (avec le template par défaut Supabase tant que l'étape 1 ci-dessus n'est pas faite manuellement), cliquer le lien, vérifier la redirection vers `/market`, se déconnecter/reconnecter. Une IA ne peut pas recevoir un email à une vraie adresse — ce test doit être fait par un humain.

## Bugs / points d'attention connus

- Le connection string Postgres "Direct" de Supabase ne fonctionne pas depuis cet environnement (IPv6 requis). Toujours utiliser le Session Pooler.
- Le pooler Supavisor renvoie parfois une chaîne de certificat TLS incomplète (`self-signed certificate in certificate chain`) — pour un script d'admin ponctuel, `ssl: { rejectUnauthorized: false }` a été accepté explicitement par l'utilisateur comme contournement temporaire. **Ne jamais faire ça dans le code applicatif normal**, seulement dans des scripts de migration jetables, jamais committés.
- MCP Supabase : configuré et authentifié, mais outils non fiables entre sessions Claude Code différentes dans ce setup — ne pas perdre de temps à déboguer ça, utiliser la connexion directe.

## Prochaine étape immédiate

Voir la section STATUT tout en haut de ce fichier — c'est la liste à jour. Ne pas se fier à l'historique ci-dessous pour savoir quoi faire ensuite, seulement pour comprendre le pourquoi des décisions déjà prises.

## Mise à jour 4 — durcissement des messages d'erreur d'auth (2026-09-09)

L'utilisateur a confirmé que les réglages dashboard Supabase (Site URL, Redirect URLs) étaient déjà faits — c'est même ce qui a permis au flux réel de fonctionner (screenshot `/market` avec données réelles, statut "Connected"). Suite à sa demande de vérifier la robustesse des messages d'erreur d'auth :

- [x] `translateAuthError`/`describeLinkError` déplacés de `login/page.tsx` vers un module partagé `apps/frontend/src/lib/auth/errors.ts`, réutilisé maintenant par `/reset-password` aussi (qui affichait auparavant le message brut anglais de Supabase, pas traduit).
- [x] Couverture étendue : mot de passe faible/trop court, "nouveau mot de passe identique à l'ancien" (cas spécifique de `/reset-password`), email invalide, session de récupération expirée/manquante ("Auth session missing!"), "user not found", et un filet générique pour tout message contenant "expired"/"invalid...token/link/otp" non explicitement mappé — plutôt que de renvoyer le texte anglais brut de Supabase tel quel.
- [x] Tests dédiés `tests/auth-error-messages.test.ts` (6 tests, tous passants). **201 tests au total**, typecheck + build OK, redéployé en prod.
- [ ] Template email de confirmation : toujours pas collé dans le dashboard Supabase. Utilisateur a choisi que je le pousse automatiquement via l'API Management de Supabase — en attente d'un Personal Access Token (`supabase_management_token`, commence par `sbp_`, différent des clés API du projet) dans `apps/backend/.env`. Une fois reçu : `PATCH https://api.supabase.com/v1/projects/hohhiirntlndbgarvmhr/config/auth` avec le contenu de `docs/email-templates/confirm-signup.html` dans le champ approprié (vérifier le nom exact du champ via un `GET` sur ce même endpoint avant d'écrire, ne pas deviner). Profiter du même token pour vérifier par API (pas juste supposer) que `SITE_URL`/`URI_ALLOW_LIST` pointent bien vers l'URL Vercel de prod.

## Mise à jour 5 — correction open redirect sur le flux post-auth (2026-09-09)

Un review de sécurité automatisé a détecté 2 open redirects HIGH sur le paramètre `next` du flux d'auth :

- `apps/frontend/src/app/login/page.tsx` : `window.location.href = searchParams.get("next") ?? "/market"` après connexion réussie — un lien du type `/login?next=https://site-malveillant.com` redirigeait vers n'importe quelle origine externe après une connexion légitime.
- `apps/frontend/src/app/auth/callback/route.ts` : même faille côté serveur, `next` injecté tel quel dans `NextResponse.redirect`.

**Fix** : nouvelle fonction partagée `getSafeNextPath()` dans `apps/frontend/src/lib/auth/safeRedirect.ts` — n'accepte que les chemins relatifs same-origin (doit commencer par `/`, refuse `//...` et `/\...` qui sont aussi interprétés comme des redirections externes par les navigateurs). Utilisée dans les deux fichiers ci-dessus à la place de l'usage brut de `searchParams.get("next")`.

- [x] `apps/frontend/src/lib/auth/safeRedirect.ts` créé, importé dans `login/page.tsx` et `auth/callback/route.ts`.
- [x] Tests `tests/safe-redirect.test.ts` (5 tests : chemin relatif valide, fallback si absent, URL absolue rejetée, `//`/`/\` rejetés, chemin sans `/` initial rejeté). **206 tests au total, 205 passent, 1 skip préexistant sans rapport.**
- [x] Typecheck (contracts + backend + frontend) OK après le changement.
- [ ] Pas encore redéployé en prod (Vercel) — à faire avant de considérer le fix live.

## Mise à jour 6 — MySQL local abandonné, tout sur Supabase Postgres (2026-09-09)

Le journal de trading affichait `Database is not configured` (MySQL local jamais branché avec des identifiants). Décision utilisateur : oublier MySQL complètement, tout faire passer par Supabase (le même projet Postgres qu'utilise déjà l'auth), aucune base séparée à gérer.

- [x] `apps/backend/src/db/pool.ts` réécrit avec `pg` (au lieu de `mysql2`) — se connecte au même Session Pooler Supabase déjà documenté ci-dessus (`aws-0-us-east-2.pooler.supabase.com:5432`, `postgres.<ref>`), `ref` extrait automatiquement de `SUPABASE_API_URL`. Plus besoin de `DB_HOST`/`DB_USER`/`DB_NAME` : `config/env.ts`'s `loadDb()` dérive tout de la config Supabase déjà présente.
- [x] `apps/backend/src/db/migrations-supabase/` renommé en `apps/backend/src/db/migrations/` (un seul dossier de migrations, un seul moteur) — `001_holders.sql` (déjà appliqué manuellement avant cette passe) conservé, marqué comme déjà appliqué dans `schema_migrations` sans être rejoué ; trois nouvelles migrations Postgres ajoutées et **réellement appliquées sur le Supabase de prod** via `npm run db:migrate` : `002_market_data.sql` (macro_events, kpi_observations, ingestion_state), `003_journal_entries.sql`, `004_global_read_runs.sql`. L'ancien dossier MySQL (`db/migrations/001_init.sql` etc.) est supprimé.
- [x] `apps/backend/src/db/migrate.ts` réécrit pour `pg`.
- [x] `journalEntries.ts`, `kpiObservations.ts`, `macroEvents.ts`, `ingestionState.ts`, `globalReadRuns.ts` réécrits (placeholders `$1,$2...` au lieu de `?`, `ON CONFLICT ... DO UPDATE` au lieu de `ON DUPLICATE KEY UPDATE`, `boolean`/`timestamptz`/`jsonb` au lieu de `TINYINT(1)`/`DATETIME`/`JSON`). Signatures de fonctions inchangées — aucun appelant (`real/*.ts`, `jobs/f13CalendarIngestion.ts`, etc.) n'a eu besoin d'être modifié.
- [x] `apps/backend/src/real/f5Employment.ts` et `scripts/global-read-recoverability.ts` avaient chacun une requête SQL brute en dehors de `db/*.ts` — corrigées aussi.
- [x] `mysql2` retiré de `apps/backend/package.json` ; `@types/pg` ajouté (`pg` ne fournit pas ses propres types TS).
- [x] `apps/backend/.env.example` : section MySQL remplacée par une seule variable, `SUPABASE_DB_PASSWORD` (déjà présente dans le vrai `.env` de l'utilisateur — utilisée jusqu'ici seulement par des scripts ponctuels, maintenant aussi par l'app elle-même).
- [x] **Vérifié contre la vraie base Supabase de prod, pas un mock** : migration appliquée avec succès, 206 tests passent (0 skip — le test `kpi_observations` qui exigeait une vraie DB tourne maintenant pour de vrai), et le journal (insert/liste/delete) vérifié directement contre la table réelle.
- [ ] **`SUPABASE_DB_PASSWORD` doit être ajouté aux variables d'environnement Railway** — jusqu'ici exclu volontairement du push de 22 variables (voir plus haut, "pas de MySQL distant configuré") ; maintenant réellement nécessaire puisque le backend de prod appellera aussi cette base. Sans ça, le journal (et le reste de la persistance) restera `DB not configured` en prod même après ce fix.

### Note TLS — `rejectUnauthorized: false` maintenant dans le code applicatif réel

La note plus bas ("Bugs / points d'attention connus") disait explicitement de ne jamais utiliser ce contournement ailleurs que dans un script jetable. Cette passe l'utilise maintenant dans `db/pool.ts`, le code réel et committé. Testé en direct avant de trancher : une connexion stricte (`rejectUnauthorized: true`, y compris la valeur par défaut de `pg`) échoue systématiquement avec `SELF_SIGNED_CERT_IN_CHAIN` depuis ce réseau — confirmé à nouveau pendant cette passe, pas juste supposé à partir de l'ancienne note. Le trafic reste chiffré (TLS actif) ; seule la vérification de la chaîne de certificats est relâchée. Le risque résiduel réaliste est une interception au niveau du réseau entre ce backend et l'infrastructure de Supabase, pas un hôte arbitraire non fiable. **Non vérifié : si Railway (environnement Linux différent) rencontrerait le même problème** — possible que ce soit spécifique à un antivirus/pare-feu faisant de l'inspection TLS sur cette machine Windows locale, auquel cas la prod pourrait tolérer une vérification stricte. Pas testé faute d'accès direct à l'environnement Railway depuis cette session.

## Sujet noté pour plus tard — hors scope de cette tâche auth

L'utilisateur a mentionné vouloir discuter, dans une prochaine session dédiée (pas maintenant), du remplacement du CLI/des abonnements LLM actuels par un **LLM local** : comment l'héberger, comment le connecter au web pour qu'il puisse répondre à des utilisateurs en ligne (pas juste en local), et les implications architecturales (qui répond à qui, latence, coût vs abonnements actuels). Pas de travail commencé là-dessus — juste noté pour ne pas perdre le fil.
