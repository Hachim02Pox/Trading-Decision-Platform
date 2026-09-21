# Refonte de l'onglet Execution (FundedNext MCP) — journal d'avancement

> **Pour la prochaine IA (Claude ou Codex) :** lis ce fichier en entier avant de toucher à l'onglet Execution.
> Il est mis à jour à CHAQUE étape. La section "Où reprendre" en bas dit exactement quoi faire ensuite.
> Ne pas éditer en parallèle avec un autre agent (voir `AI_WORKFLOW.md`).

## Demande de Hachim (2026-09-21)

Refaire l'onglet Execution "comme jamais vu" à partir de tout ce que l'API FundedNext expose, et retirer
l'ancien contenu. Garder uniquement le calcul de risque, en petit. La page doit être excellente, bien
intégrée au terminal, et montrer tout ce qui est nécessaire au suivi de trading : où j'en suis, ce qu'il me
reste comme risque avant breach, si je suis dans le bon, etc.

Contrainte : Hachim est à 95 % de sa limite hebdo Claude, donc tout doit être journalisé ici pour qu'une
autre IA puisse reprendre.

## Contexte technique établi (vérifié en direct le 2026-09-21)

- Serveur MCP : `https://mcp.fundednext.com` (Streamable HTTP, JSON-RPC 2.0). Auth : `Authorization: Bearer <token>`
  où le token = la clé `FUNDEDNEXT_API_KEY` générée dans Dashboard FundedNext > "Connect with AI".
- Handshake : `POST initialize` (renvoie l'en-tête `Mcp-Session-Id`), puis `notifications/initialized`, puis
  `tools/list` / `tools/call` avec l'en-tête `Mcp-Session-Id`. Limite annoncée : `x-ratelimit-limit: 1200`.
- 177 outils, lecture seule (sauf `record_ai_feedback`). Certains ont des effets de bord ou des données sensibles
  (`get_investor_password` génère un mot de passe) : **jamais appelés depuis le terminal** (liste blanche côté backend).
- `get_accounts` exige `type` = `active|inactive|breached` ET `tab` = `forex|futures` (défaut forex).
- Comptes actifs de Hachim au 2026-09-21 : CFD Stellar 1-Step Demo 6K (MT5, id 4243981, login 14263128) et
  Futures Flex Demo 50K (Tradovate, id 4240550, login 966465706). Plus 17 anciens comptes inactifs/breachés.
- Les outils par compte prennent l'`id` interne (`account_id` / `id`), pas le login. `resolve_account(login)` convertit.

## Décisions de sécurité (importantes)

- La clé FundedNext est **personnelle** (une seule, dans l'env backend). Le terminal a plusieurs comptes Supabase.
  Donc toutes les routes `/api/execution/*` exigent `requireHolder` ET que l'email du holder soit celui du
  propriétaire (`FUNDEDNEXT_OWNER_EMAIL`, défaut `hachimtib06@gmail.com`, même précédent que la migration 011).
  Échec fermé : tout autre compte reçoit 403. Même classe de bug que la fuite du journal du 2026-09-20.
- Liste blanche d'outils côté backend : aucune route ne permet d'appeler un outil arbitraire.
- La clé n'est jamais loguée ni renvoyée au client.

## Formats vérifiés (réponses réelles du MCP, 2026-09-21)

Chaque réponse `tools/call` est `result.content[0].text` = du JSON (parfois suivi d'un bloc texte `[INTERNAL — FOR AI...]`
à ignorer : couper avant `\n[INTERNAL`). Erreur applicative = JSON `{error:true, code, message, status}` avec `isError:true`.

| Outil (args) | Forme utile |
|---|---|
| `get_accounts {type, tab}` | `{data:[{id, login, type, balance, equity, breached, starting_balance, created_at, server:{server_type}, plan:{title}}], current_page, last_page, total}` |
| `get_account_overview {account_id}` (CFD) | `account_details` (**contient `password` et `investor_password` : ne jamais exposer**), `stats{equity,balance,profit,profit_target,drawdown,trading_days}`, `objectives{trading_days,daily_loss,overall_loss,profit,quick_strike}`, `account_summary.objectives.{daily_loss,overall_loss}.{target_value,remaining,percentage,target_value_percentage}` (**restant en $ déjà calculé par FundedNext**), `threshold{daily_loss_threshold,max_loss_threshold}`, `consistency`, `risk_parameters`, `trading_cycle_details{starting_date,ending_date,payout_eligible_date}` |
| `get_account_overview` (Futures Flex 50K) | **HTTP 500 `API_ERROR "Server Error"`** sur ce compte (vérifié aussi pour `get_risk_card`). À traiter comme section indisponible, pas comme crash. |
| `get_risk_card {account_id}` | `{margin_usage, risk_limit{violation,current_risk_limit,highest_risk}, news_trade{...}, quick_strike{violation,quick_strike,quick_strike_percentage,max_percentage}}` |
| `get_account_consistency_status` | `{rule_applicable, status, message, current_week, weeks[], stored_violations[]}` |
| `get_running_trades {account_id}` | `{trades:[]}` (forme d'une position ouverte non vérifiée : aucune sur les comptes testés, normaliser défensivement) |
| `get_trading_history {account_id, page}` (CFD) | `{stats{total_trades,balance,profit_factor,win_rate}, trades{data:[{ticket,symbol,type_str,lots,open_price,close_price,open_time_str,close_time_str,sl,tp,profit,commission,swap,pnl_percentage,trade_duration,rr_ratio,is_news}], current_page,last_page,total}}`, 10 par page. `page` marche même s'il n'est pas dans le schéma. |
| `get_futures_trade_history {account_id, page, per_page}` | `{stats, trades{data:[{open_ticket,symbol,type,qty,open_price,close_price,open_time,close_time,gross_pnl,net_pnl,commission,pnl_percentage,trade_duration}], ...}, runningTrades{data:[]}}` (nombres en chaînes) |
| `get_trading_overview {account_id, type}` | `stats` : `{equity,balance,average_wing,average_loss,trades,lots,average_rrr,win_rate,loss_rate,profit_factor,best_trade,worst_trade,long_won,short_won,gross_profit,gross_loss}` ; `symbol-performance` : objet par symbole `{title,symbol_percentage,lot,no_of_trade,profit,wining_trade,losing_trade}` ; `weekly-profit-loss` : `[{Monday:n},...]` ; `hourly-profit-loss` : 24 nombres |
| `get_trading_calendar_month {account_id, month:"YYYY-MM"}` | `{days:[{date,is_weekend,has_trade,net_pnl,win_rate,total_trades,trades_preview:[{ticket,symbol,type,pnl}]}]}` |
| `get_rule_breach_history {id}` | `[{breach_reason, breach_date, balance, equity, metrics(JSON string), trades(JSON string)}]` |
| `get_account_applicable_rules {account_id}` | `{rules:[{condition,label,value}]}` ; Futures Flex 50K : DLL=0, MLL=3, PT=5, CRD=40, PS=0 (**unités des valeurs non documentées : ne pas interpréter**) |
| `get_account_plan_info`, `get_account_cycles` | plan/plateforme/cycles (fonctionnent sur le Futures) |
| `position_size_calculator {symbol, account_balance, risk_percentage, entry_price, stop_loss_price}` | `{risk_amount, stop_distance, loss_per_lot, recommended_lots}` |
| `get_account_payout_terms {account_id}` | `{profit_split{percentage}, payout_cycle, withdrawal_caps, cap_consumption}` |
| `get_wallets` | contient l'email perso : **ne pas utiliser** |

Anomalie à connaître (CFD Stellar 1-Step Demo 6K) : le libellé `objectives.daily_loss.label` dit "Max daily loss - $300" et
`overall_loss.label` "Max loss - $600", mais les nombres (`target_value` 180 = 3 %, 360 = 6 %) et `threshold` disent autre chose.
Le terminal utilise **les nombres** (`remaining`, `target_value`), jamais le libellé. À signaler à Hachim (plan "Demo modified").

## Plan par étapes

- [x] 1. Sonder les formats de réponse réels (overview, trades, calendrier, payout, risque, breach) — voir "Formats vérifiés"
- [x] 2. Backend : client MCP + cache + liste blanche (`apps/backend/src/fundednext/`)
- [x] 3. Backend : normalisation défensive + routes `/api/execution/*` + garde propriétaire
- [x] 4. Backend : tests (client, normalisation, garde propriétaire) — 12/12 verts, tsc OK, test réel OK
- [x] 5. Frontend : client API + types
- [x] 6. Frontend : nouvelle page Execution (remplace ExecutionWorkspace) + i18n FR/EN + CSS
- [~] 7. Vérification : tsc backend + frontend OK, 317/317 tests OK (dont 16 nouveaux). **Rendu navigateur avec vraie session NON fait** (voir "À faire")
- [x] 8. Docs : ce fichier, HISTORY.md (EXD), PROVIDER_SETUP.md

## Journal des étapes

### 2026-09-21 — Étape 0 : cadrage
- Lu : CLAUDE.md, AI_WORKFLOW.md, DESIGN.md (tokens et tableaux), JOURNAL_FEATURE.md, ancien ExecutionWorkspace.tsx,
  supabaseAuth.ts, httpClient.ts, Workspace.module.css.
- `server.ts` a des modifications non commitées d'un autre agent (edge-check Gold) : ne pas les écraser. La refonte
  monte un routeur séparé avec une seule ligne dans `server.ts`.
- Le fichier `.codex/attachments/.../pasted-text.txt` ouvert dans l'IDE concerne une autre tâche (Gold edge check), sans rapport.

### 2026-09-21 — Étape 2 : client MCP (fait)
- Créé `apps/backend/src/fundednext/mcpClient.ts` : `FundedNextMcpClient` (session MCP, liste blanche `TOOL_POLICY` avec TTL de cache
  par outil, cache négatif 30 s des erreurs 500, dédoublonnage des appels en vol, timeout 15 s, erreurs typées `FundedNextError`,
  clé jamais loguée). Non encore testé (étape 4).
- Décision d'architecture : DTOs normalisés définis dans `apps/backend/src/fundednext/types.ts` (étape 3), dupliqués côté frontend dans
  `apps/frontend/src/lib/api/executionClient.ts` (même convention que `journalClient.ts`).
- Chaque section du dashboard est indépendante `{status:"ok"|"unavailable", data, message}` : un endpoint FundedNext en 500
  (ex. overview du Futures Flex) n'empêche pas d'afficher le reste.

### 2026-09-21 — Étapes 3 et 4 : backend complet + tests (fait, vérifié)
- Fichiers : `apps/backend/src/fundednext/{mcpClient,types,normalize,service,routes,index}.ts`, config `fundedNext` dans `config/env.ts`
  (`FUNDEDNEXT_API_KEY`, `FUNDEDNEXT_OWNER_EMAIL` défaut hachimtib06@gmail.com, `FUNDEDNEXT_MCP_URL` optionnel), routeur monté dans `server.ts`
  (2 lignes : import + `app.use("/api/execution", buildExecutionRouter())`).
- Routes (toutes `requireHolder` + propriétaire uniquement, sinon 401/403, 503 si clé absente) :
  - `GET /api/execution/accounts[?refresh=1]` → `{accounts: ExecutionAccount[], fetchedAt}` (21 comptes : actifs, inactifs, breachés, CFD + Futures)
  - `GET /api/execution/accounts/:id/dashboard?month=YYYY-MM&page=N[&refresh=1]` → `ExecutionDashboard` (sections indépendantes, voir `types.ts`)
  - `GET /api/execution/position-size?symbol&balance&riskPercent&entry&stop` → `{result: PositionSizeDto}`
  - Erreurs : `{error:{code,message}}` (attention : `journalClient.ts` lit `error` comme une chaîne, pas le nouveau client).
- Tests : `tests/execution-fundednext.test.ts` (12 tests, verts) : liste blanche, session/bearer, cache, dédoublonnage, erreurs sans fuite de clé,
  normalisation sans mot de passe, dégradation par section, garde propriétaire, validation des entrées. `tsc --noEmit` backend OK.
- Test réel contre le vrai MCP (script jetable) : CFD 4243981 OK (limites 180 $/360 $, restant 180/360) ; Futures 4240550 : overview et risk card = 500 côté
  FundedNext (section "unavailable" gérée), le reste OK ; ancien compte breaché 1664080 : 17 trades, calendrier, breach OK.
- Correctifs issus du test réel : (1) `get_trading_history` renvoie `trades: []` (tableau) pour un compte sans trade ; (2) `objectives.*.current_value` est un P&L signé
  (négatif = perte, peut dépasser la limite) alors que `daily_loss_till_now`/`max_loss_till_now` = allocation consommée plafonnée à la limite : `LimitMeter` expose
  `used` (>= 0), `recorded` (signé) et `remaining` (valeur FundedNext, jamais recalculée).
- Sur un compte breaché les chiffres sont figés au moment du breach (et incohérents côté FundedNext : overall_loss consommé 360 alors que recorded = -143,42) :
  l'UI doit l'afficher comme "au moment du breach".

### 2026-09-21 — Étape 5 : client frontend + helpers + i18n (fait, pas encore vérifié par tsc frontend)
- `apps/frontend/src/lib/api/executionClient.ts` : types miroirs + `fetchExecutionAccounts`, `fetchExecutionDashboard(id,{month,page,refresh})`, `fetchPositionSize`.
  `ExecutionApiError.code` distingue `SIGN_IN_REQUIRED`, `NOT_OWNER`, `FUNDEDNEXT_NOT_CONFIGURED`, `NETWORK`, codes FundedNext.
- `apps/frontend/src/lib/execution.ts` : `riskUsage` (seuils 50 % / 80 %, constantes `RISK_WATCH_RATIO`/`RISK_CRITICAL_RATIO`), `cumulativePnl`, `shiftMonth`, `firstWeekdayOffset`.
  Tests : `tests/execution-helpers.test.ts`.
- i18n : anciennes clés `execution.*` supprimées de `en.ts` et `fr.ts`, remplacées par 93 nouvelles clés (générées par script jetable, même liste des deux côtés).
  Seul l'ancien `ExecutionWorkspace.tsx` utilisait les anciennes clés : il DOIT être réécrit (étape 6) sinon le typecheck frontend échoue.

### 2026-09-21 — Étapes 6 à 8 : page Execution réécrite (fait, compile, testé hors rendu)
- Réécrit `apps/frontend/src/components/workspace/ExecutionWorkspace.tsx` (orchestrateur : liste des comptes, sélection, mois, page, auto-refresh 30 s sur compte actif, états
  erreur 401/403/503) + `apps/frontend/src/components/execution/{shared.tsx,RiskPanel.tsx,PerformancePanel.tsx,TradesPanel.tsx,RiskCalculator.tsx,Execution.module.css}`.
  Route inchangée : `apps/frontend/src/app/execution/page.tsx`.
- Ancien contenu retiré : checklist pré-trade, faux bloc "connexion broker bientôt", bouton de reset, brouillon `goldTerminal.executionWorkspace.v1` (le nouveau calculateur
  utilise sa propre clé `goldTerminal.executionCalculator.v1` : symbole, risque %, entrée, stop ; le solde vient du compte sélectionné).
- Contenu de la page (dans l'ordre) : sélecteur de compte (actifs en onglets, historique en liste) + pastilles statut/plateforme ; "Où tu en es" (solde, equity, profit, drawdown,
  objectif de profit, jours de trading, statut, date de payout) ; "Risque restant avant breach" (2 jauges perte journalière / perte max avec montant restant FundedNext, consommé, limite,
  état marge confortable / à surveiller / zone critique, signaux quick strike / risk limit / news trade) ; positions ouvertes ; calculateur de risque compact (lots via FundedNext) ;
  performance (win rate, profit factor, gain/perte moyens, best/worst, R:R) ; calendrier P&L du mois + courbe P&L cumulé ; par symbole ; historique paginé ; règles (Futures) ;
  historique des breaches (comptes breachés).
- Vérifié : `tsc --noEmit` backend et frontend OK ; `npm test` = 317/317 (tests Execution : `tests/execution-fundednext.test.ts` 12, `tests/execution-helpers.test.ts` 4).
- NON vérifié : rendu visuel réel dans le navigateur (l'accès est réservé au compte propriétaire connecté via Supabase, impossible de se connecter depuis l'agent), et le comportement
  d'une position OUVERTE (aucune sur les comptes testés : la forme des lignes de `get_running_trades` est supposée proche de celle des trades clôturés).
- Rien n'est commité ni poussé (`server.ts` contient aussi des changements non commités d'un autre agent : commit à faire par Hachim ou après revue).

## À faire / décisions ouvertes (dans l'ordre)

1. **Déploiement** : commit + push de `main` déclenche Vercel/Railway. Vérifier que Railway a bien `FUNDEDNEXT_API_KEY` (même nom, majuscules). Optionnel : `FUNDEDNEXT_OWNER_EMAIL`
   (défaut `hachimtib06@gmail.com`, seul compte autorisé à voir la page). Sans clé : la page affiche "FundedNext n'est pas configuré". Autre compte : "réservé au propriétaire".
2. **Contrôle visuel** connecté en tant que propriétaire : desktop + mobile (< 700 px), contraste, alignement, densité ; comparer à `DESIGN.md` (skill web-design-guidelines / Playwright).
3. **Confirmer les seuils 50 % / 80 %** de la jauge (décision d'affichage du terminal, pas une règle FundedNext ; constantes dans `apps/frontend/src/lib/execution.ts`).
4. **Anomalie FundedNext** à signaler à Hachim : sur le CFD Stellar 1-Step Demo 6K, les libellés disent "Max daily loss - $300 / Max loss - $600" mais les nombres sont 180 $ (3 %) et 360 $ (6 %).
   Le terminal affiche les nombres (`target_value`, `remaining`), pas les libellés.
5. **Futures Flex Demo 50K** : `get_account_overview` et `get_risk_card` renvoient 500 côté FundedNext (au 2026-09-21) : la page n'a donc pas de jauges de risque pour ce compte tant que
   FundedNext ne corrige pas (elle affiche le message "Server Error" dans la carte, et les règles brutes `DLL/MLL/PT...` du compte). Retester plus tard ; ne pas inventer les limites Futures.
6. **Idées pour la suite (non demandées)** : import automatique des trades clôturés dans `/journal` ; alerte visuelle quand le restant journalier passe sous un seuil ; onglet "leçons"
   qui rapproche l'historique des breaches (17 anciens comptes) des règles ; graphique d'equity par compte.

## Où reprendre

Tout est codé et compile. Reste : point 1 (déploiement) et 2 (contrôle visuel) ci-dessus, puis les décisions 3 à 5. Ne pas réécrire ce qui est fait : lire d'abord les sections "Formats vérifiés"
et "Décisions de sécurité". Si tu modifies `apps/backend/src/fundednext/types.ts`, mets aussi à jour `apps/frontend/src/lib/api/executionClient.ts` (types dupliqués).

## Spécification de la page Execution (décidée, à implémenter)

Remplace `apps/frontend/src/components/workspace/ExecutionWorkspace.tsx` (ancien contenu à retirer : checklist de validation, "connexion broker bientôt", brouillon localStorage).
Utiliser les classes de `Workspace.module.css` et `DESIGN.md` (terminal dense, sombre, mono pour les nombres, pas de SaaS générique). i18n FR/EN dans `i18n/{fr,en}.ts` (clés `execution.*`).
Ordre des blocs, de haut en bas :
1. En-tête : titre, sélecteur de compte (actifs d'abord, puis "Historique" : inactifs/breachés), bouton Actualiser (`?refresh=1`), horodatage `fetchedAt`, pastille plateforme (MT5/Tradovate).
2. Bandeau "Où j'en suis" : balance, equity, profit du cycle, drawdown, statut du compte, jours de trading, progression vers le profit target.
3. Bloc RISQUE (le plus important) : jauges perte journalière et perte max : limite $, consommé $, restant $ (valeur FundedNext) + barre. Seuils d'affichage (décision UI à confirmer par Hachim,
   pas une règle FundedNext) : < 50 % consommé = "Marge confortable", 50-80 % = "À surveiller", >= 80 % = "Zone critique" ; couleur `warn`/`adverse` + libellé texte, jamais la couleur seule.
   Compte breaché : bandeau breach + "chiffres au moment du breach".
4. Positions ouvertes (`running`) et flags de risque (quick strike, risk limit, news trade) quand présents.
5. Calculateur de risque en PETIT : garder `calculateRiskPlan` de `lib/traderWorkspace.ts` + lots recommandés via `/api/execution/position-size`, préremplir balance/risque depuis le compte sélectionné.
6. Performance : stats (win rate, profit factor, gain/perte moyens, best/worst, RR moyen), calendrier P&L du mois (mois précédent/suivant), P&L cumulé du mois (SVG simple), performance par symbole.
7. Historique des trades : tableau paginé, montants alignés à droite, P&L net = profit + commission + swap (Futures : net_pnl).
8. Compte Futures : règles applicables (`rules`) affichées telles quelles (unités non documentées : ne pas interpréter). Compte breaché : historique des breaches.
9. Chaque section gère "unavailable" avec le message renvoyé (ex. "Server Error") sans casser la page ; états chargement/vide explicites (comptes neufs sans trade).
Accès : si 403 NOT_OWNER ou 503 FUNDEDNEXT_NOT_CONFIGURED, état explicite (pas de données, pas de crash). Invité sans session : message "connexion requise".
