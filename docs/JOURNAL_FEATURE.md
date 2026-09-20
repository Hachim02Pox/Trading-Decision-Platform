# Journal de trading — contrat et historique des décisions

Persistance : Postgres (Supabase), table `public.journal_entries` (voir
`apps/backend/src/db/migrations/003_journal_entries.sql`). API :
`GET/POST /api/journal`, `DELETE /api/journal/:id`,
`PATCH /api/journal/:id` (notes uniquement).

## Isolation par compte (2026-09-20, bug remonté par l'utilisateur)

**Bug** : le journal était mono-utilisateur (pas de `user_id`) alors que
plusieurs comptes Supabase se connectent au même terminal — un trade
enregistré par un compte était visible par tous les autres comptes.

**Fix** :
- `apps/backend/src/db/migrations/010_journal_entries_holder_id.sql` — ajoute
  `holder_id uuid references public.holders(id)`, nullable, indexé.
- `apps/backend/src/db/migrations/011_journal_entries_backfill_holder_id.sql`
  — assigne toutes les lignes existantes (créées avant ce fix) au holder
  `hachimtib06@gmail.com`, le seul trader ayant utilisé le journal jusqu'ici.
  Les deux migrations ont été appliquées en direct sur le Supabase de prod
  (`npm run db:migrate`, 2026-09-20).
- Les 4 routes `/api/journal*` exigent désormais `requireHolder` (bearer
  token Supabase) et chaque requête SQL est filtrée par `holder_id` —
  `apps/backend/src/db/journalEntries.ts`, `apps/backend/src/server.ts`.
- `apps/frontend/src/lib/api/journalClient.ts` attache maintenant
  `Authorization: Bearer <access_token>` (via `supabase.auth.getSession()`)
  sur les 4 appels — jusqu'ici aucun n'envoyait de token, ce qui n'avait
  jamais posé de souci tant que le backend n'exigeait pas d'auth dessus.
- `holder_id` n'est jamais renvoyé au client (`StoredJournalEntry` l'exclut
  explicitement) — c'est un détail d'accès, pas une donnée du journal.
- Voir aussi la section "Mode invité" de `docs/AUTH_SUPABASE.md` : un
  visiteur sans compte peut maintenant naviguer en lecture seule, mais
  `/api/journal` continue de rejeter toute requête sans token réel (401),
  donc il ne peut jamais voir ni écrire de trades.

## Décisions produit verrouillées (2026-09-10, demande explicite utilisateur)

- **Décision** : LONG ou SHORT uniquement à la création. `NO_TRADE` reste une
  valeur valide en base pour les entrées créées avant ce changement (aucune
  migration de données), mais n'est plus proposé dans le formulaire ni accepté
  par la validation du `POST`.
- **Contexte technique** (`setup` en base) : la raison technique de la décision
  (structure de prix, niveau clé, catalyseur macro…). Anciennement "Setup / contexte".
- **Thèse et réaction directionnelle** (`thesis` en base) : juste en dessous du
  contexte technique. Anciennement "Thèse et réaction attendue".
- **Invalidation** : placeholder guidant la rédaction — "à quel moment ma thèse
  s'avérera fausse, et pourquoi". Le champ reste obligatoire, seul le placeholder change.
- **Note de revue** (`notes` en base) : n'est plus un champ du formulaire de
  création (toujours envoyée vide à la création). Devient une édition optionnelle
  sur une entrée déjà existante, via un bouton "Ajouter une note" / "Modifier la
  note" dans l'historique, qui appelle `PATCH /api/journal/:id`. Pensé comme un
  débrief post-trade, pas une information à connaître avant de trader.
- **"J'ai respecté le plan écrit"** : décochée par défaut (avant : cochée par
  défaut). Si l'utilisateur enregistre sans cocher, une confirmation
  (`window.confirm`) demande "Tu n'as pas coché avoir respecté le plan.
  Enregistrer quand même ?" avant d'envoyer la requête.

## Fichiers concernés

- `apps/backend/src/db/journalEntries.ts` — `updateJournalEntryNotes` (nouveau).
- `apps/backend/src/server.ts` — route `PATCH /api/journal/:id` (nouveau),
  `JOURNAL_DIRECTIONS` restreint à `["LONG", "SHORT"]` pour la création.
- `apps/frontend/src/lib/api/journalClient.ts` — `updateJournalEntryNotes` (nouveau).
- `apps/frontend/src/components/workspace/JournalWorkspace.tsx` — formulaire et
  historique.
- `apps/frontend/src/i18n/fr.ts` / `en.ts` — libellés `journal.*`.

Voir `docs/AUTH_SUPABASE.md` pour le contexte de déploiement (le journal était
indisponible en prod jusqu'au 2026-09-10 à cause d'un déploiement Railway resté
bloqué sur un build pré-migration Postgres, pas à cause de ce feature).
