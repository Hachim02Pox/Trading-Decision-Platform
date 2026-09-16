# Liste de tâches — nuit du 2026-09-16 (Hachim absent, dort)

## ⚠️ INSTRUCTION DE DÉMARRAGE — LIRE EN PREMIER

**Hachim ne sera pas disponible pendant l'exécution de ce document — il dort, ~8h.** Procède à travers toutes les sections ci-dessous **sans t'arrêter pour demander confirmation, sans poser de question, sans attendre de réponse**. Pour chaque point ambigu ou chaque décision de détail (texte exact d'un libellé, choix entre deux options équivalentes, etc.), **prends la meilleure décision toi-même** et documente-la clairement (dans le code via un commentaire si pertinent, et dans un résumé de fin de session) plutôt que de bloquer.

Ceci est différent des documents précédents de la même journée (`PREVIOUS_VALUE_PERSISTENCE_NEXT_STEPS.md`) où il fallait confirmer avant d'implémenter — **ici, implémente directement**. Si un point est vraiment bloquant (ex. une API tierce nécessite une clé payante que Hachim n'a pas), fais le meilleur choix de repli possible, documente pourquoi, et continue plutôt que de t'arrêter.

**Vérifications avant de committer/pusher quoi que ce soit** : `npm run typecheck && npm run build`, tests pertinents. Une fois un point terminé et vérifié, **commit + push directement** (pas besoin de demander, comme établi plus tôt dans la session du 2026-09-16 — Hachim a explicitement autorisé "push sans demander" pour cette session, et il ne sera de toute façon pas là pour répondre).

**À la fin, laisse un résumé clair** (nouveau fichier ou en tête de ce document) de ce qui a été fait, ce qui n'a pas pu être fait et pourquoi, et ce qui reste en attente d'une vraie décision de Hachim (rare, seulement si vraiment impossible de trancher seul).

---

## 1. Renommer la marque "Zenith" → "HT"

**Fichier principal** : `apps/frontend/src/components/shell/TopNav.tsx` — actuellement `<span className={styles.wordmark}>Zenith</span>`, `aria-label="Zenith Terminal"`, `id="zenith-easter-egg"`.

- Remplacer le texte affiché "Zenith" par **"HT"** (initiales de Hachim Tib — H-A-C-H-I-M, "ch" comme dans le prénom, pas juste un "S" ; T-I-B pour le nom de famille).
- Le easter egg (`apps/frontend/src/components/brand/brandEasterEgg.ts`, `BRAND_EASTER_EGG_COPY`) fait actuellement référence au mot "zénith" dans son texte explicatif (FR : *"atteindre son zénith, c'est viser son point culminant"*). Hachim n'a pas encore donné la nouvelle explication ("on verra pour l'explication plus tard") — **ne pas inventer une fausse histoire pour "HT"**. Solution la plus sûre : garder le texte de l'easter egg TEL QUEL pour l'instant (il reste vrai et personnel — présentation de Hachim, pas une explication du nom "Zenith" à proprement parler, en tout cas la partie titre `"Salut, c'est Hachim"` reste valide), juste changer le mot affiché dans le logo (`wordmark`) et les `aria-label`/`id` qui référencent littéralement "zenith"/"Zenith" pour rester cohérents (ex. `id="ht-easter-egg"`).
- Chercher aussi "Zenith"/"ZENITH" ailleurs dans le repo (`grep -ri zenith apps/`) — au moins `apps/frontend/src/app/icon.tsx` (favicon/tab icon) pourrait aussi référencer la marque, et il y a un test `tests/brand-easter-egg.test.ts` ("brand easter egg credits Hachim and explains Zenith plus the gyroscope mark", "browser tab icon is a Zenith gyroscope mark") — **ce test va probablement casser**, il faut le mettre à jour pour refléter "HT" au lieu de "Zenith" tout en gardant la même intention (le easter egg crédite toujours Hachim, explique toujours la marque du gyroscope).
- Le mark gyroscope (`GyroscopeMark`) reste inchangé — seul le texte/nom change.

---

## 2. Remplacer l'onglet "PARAMÈTRES" par un menu compte, en haut à droite, loin des onglets

### 2.1 Ce qui existe déjà (confirmé en lisant le code)

- `apps/frontend/src/app/settings/page.tsx` a actuellement 3 sections : coloration directionnelle (Hachim l'appelle "KPI"), langue (EN/FR), et un tableau "sources de données connectées" (`DataSourcesSection`, via `fetchProviderStatuses`).
- `apps/frontend/src/components/shell/TopNav.tsx`'s `NAV_DESTINATIONS` a `{ labelKey: "nav.settings", href: "/settings" }` comme dernier onglet.
- Il n'existe **aucun menu compte/déconnexion actuellement** (vérifié : aucune trace de `signOut`/menu utilisateur dans `apps/frontend/src/components/shell/`). `apps/frontend/src/lib/supabase/client.ts` expose `createClient()` (client Supabase navigateur) — utiliser `.auth.getUser()` pour l'email, `.auth.signOut()` pour la déconnexion.

### 2.2 Ce qu'il faut construire

1. **Supprimer `nav.settings` de `NAV_DESTINATIONS`** dans `TopNav.tsx` — plus d'onglet "Paramètres" dans la barre de navigation.
2. **Ajouter une icône compte** (avatar rond simple, ou icône générique type silhouette) tout à droite de la barre `TopNav`, séparée visuellement des onglets (ex. `margin-left: auto` sur un nouvel élément après `.tabs`, ou une troisième zone flex dans `.bar`).
3. Au clic sur cette icône, ouvrir un petit menu déroulant (dropdown) contenant :
   - Identité de l'utilisateur : email (`user.email` du client Supabase) — Hachim a mentionné vouloir peut-être un nom/prénom, mais le flux d'inscription actuel (`/login`) ne collecte probablement pas ces champs (vérifier `apps/frontend/src/app/login/page.tsx` et le schéma Supabase Auth). **Si trop complexe à ajouter ce soir (migration du formulaire d'inscription + colonnes) : afficher juste l'email, c'est suffisant et sûr** — ne pas bloquer là-dessus, c'est un "nice to have" explicitement secondaire dans la demande de Hachim ("un nom et prénom OU juste l'email").
   - Un lien "Paramètres du compte" qui ouvre soit la même page `/settings` (gardée, mais retirée de la nav principale — accessible seulement via ce menu), soit un sous-panneau inline dans le dropdown lui-même avec les 2 seuls réglages voulus :
     - Langue (EN/FR) — logique déjà dans `useSettings()`/`SettingsContext`, juste déplacer l'UI.
     - "KPI" = la coloration directionnelle (`directionalColoring`) — même logique existante, déplacer l'UI.
   - Un bouton "Se déconnecter" (`supabase.auth.signOut()` puis redirection vers `/login`).
4. **Supprimer complètement `DataSourcesSection`** (le tableau des sources de données connectées) de l'expérience utilisateur — Hachim est explicite : *"les users ils s'en foutent de ça"*. Si la route `/settings` est conservée pour d'autres raisons, au minimum ne plus jamais afficher ce tableau nulle part côté utilisateur. Le endpoint backend `/api/providers/status` peut rester (utile en debug/CLI), juste ne plus être appelé/affiché côté frontend utilisateur.
5. Si la page `/settings` autonome n'a plus de raison d'exister une fois le dropdown construit (elle ne contiendrait plus que ce qui est déjà dans le dropdown), la supprimer proprement et rediriger `/settings` vers `/market` ou simplement retirer la route — au choix, décision de détail, ne pas bloquer dessus.

---

## 3. Réordonner les onglets de navigation

Ordre actuel (`TopNav.tsx`'s `NAV_DESTINATIONS`) : Marché/Décision, Histoire du Marché, Graphique, Exécution, Actualités/Recherche, Journal/Historique, Connaissances, (Paramètres — supprimé par la section 2).

**Nouvel ordre demandé explicitement** :
1. Marché / Décision (`/market`)
2. Graphique (`/chart`)
3. Histoire du Marché (`/sunday-read`)
4. Actualités / Recherche (`/news`)
5. Connaissances (`/knowledge`)
6. Exécution (`/execution`)
7. Journal / Historique (`/journal`)

(Exécution passe en avant-dernier, juste avant Journal/Historique — pas plus en 4e position comme aujourd'hui.)

---

## 4. Refonte de la page Exécution (`apps/frontend/src/components/workspace/ExecutionWorkspace.tsx`)

### 4.1 Supprimer

- Les champs "Thèse du trade" (`execution.thesis`, textarea `draft.thesis`) et "Qu'est-ce qui invalide la thèse" (`execution.invalidation`, textarea `draft.invalidation`) — actuellement juste écrits en `localStorage`, jamais vraiment exploités. Raison de Hachim : ça sera géré par le Journal à la place, ce texte libre ici ne sert à rien.
- La checklist pré-trade actuelle à 6 items (`CHECKS` : `execution.check.thesis`, `.invalidation`, `.catalyst`, `.calendar`, `.size`, `.order`) et sa section entière (`execution.checklistTitle`, `execution.readiness`, `execution.noBroker`).

### 4.2 Garder

- Le bloc "Plan de risque" (`execution.riskTitle`) tel quel : capital (`accountBalance`), risque % (`riskPercent`), entrée (`entryPrice`), stop (`stopPrice`), et les stats calculées (montant risqué, distance du stop, unités approximatives — `calculateRiskPlan`, `apps/frontend/src/lib/traderWorkspace.ts`). Rien à changer dans cette logique métier.

### 4.3 Ajouter — connexion à une plateforme de trading

Demande de Hachim : possibilité de se connecter à MetaTrader, à un compte de prop firm, ou à un broker, affichée à droite de la page (où était la checklist).

**C'est un vrai sujet de recherche, pas une implémentation évidente** — Hachim l'a explicitement reconnu ("je ne sais pas si c'est possible, il va falloir se renseigner"). Démarche suggérée :
1. Chercher si MetaTrader 5 (MT5) a une API publique/gratuite accessible sans serveur intermédiaire payant (historiquement, l'accès programmatique à MT5 nécessite soit un compte broker avec API propriétaire, soit des solutions tierces payantes type MetaApi — à vérifier, ne pas assumer que c'est gratuit).
2. Chercher les 2-3 prop firms les plus connues (ex. FTMO, MyForexFunds équivalents actuels en 2026, The 5%ers, etc. — vérifier lesquelles existent encore et ont une API publique) et si elles exposent une API de connexion de compte.
3. Si RIEN de gratuit/accessible n'est trouvé ce soir : **ne pas construire une fausse connexion qui ne marche pas**. Construire à la place un état "Connecter un compte (bientôt disponible)" avec la liste des plateformes visées, honnête sur le fait que ce n'est pas encore branché — mieux qu'une fonctionnalité qui prétend marcher sans vraiment fonctionner. Documenter précisément ce qui a été trouvé/pas trouvé pour que Hachim puisse décider en connaissance de cause au réveil.

### 4.4 Ajouter — validation pré-trade simplifiée (remplace l'ancienne checklist à 6 items)

Trois questions simples, format à décider (case à cocher, ou petit texte oui/non) :
1. As-tu une raison macro d'entrée claire ?
2. As-tu une raison fondamentale ?
3. Le risque est-il bien ajusté ?

Pas besoin de sauvegarder ces réponses nulle part de façon persistante/analysée — juste un check rapide avant de trader, dans le même esprit léger que demandé (pas une usine à gaz comme l'ancienne checklist à 6 items).

---

## 5. Page Actualités/Recherche — section Night Recap (texte + persistance)

### 5.1 Texte d'intro — confirmer/ajuster

Hachim aime la fonctionnalité telle quelle aujourd'hui. Le texte actuel (`i18n/fr.ts`, `goldOvernight.intro`) est déjà très proche de ce qu'il redemande mot pour mot dans sa dictée — comparer et ajuster seulement si un écart réel existe, ne pas tout réécrire inutilement :
- Texte demandé (reformulé) : "Un résumé des séances Asie et Londres sur l'or, recoupé avec des sources en plusieurs langues, généré automatiquement une fois par jour vers 9h heure de l'Est."
- **Le texte du récap lui-même (`recapText`, pas l'intro) doit déjà être dans la langue de l'interface** — c'est déjà le cas (le backend génère EN et FR séparément, le frontend affiche celle qui correspond à `language` courant). Vérifier que c'est bien le comportement observé, pas besoin de reconstruire si c'est déjà correct.
- Le message "pas encore de récap" (`goldOvernight.pending`) dit déjà : *"Pas encore de récap — la prochaine génération automatique est vers 9h (heure de l'Est)."* — déjà conforme à la demande, rien à changer.

### 5.2 "Montrer le dernier récap en haut à droite" — clarifier et implémenter au mieux

Phrase de Hachim pas totalement claire (dictée vocale) — interprétation la plus probable : le dernier récap disponible doit être visible/accessible facilement, pas cliqué pour être révélé à chaque fois. Le composant `GoldOvernightSection.tsx` a actuellement un état replié par défaut (`collapsed = true`, bouton "Afficher"/"Masquer"). **Décision à prendre seul ce soir** : soit déplier le récap par défaut (`collapsed = false` dès qu'un `report` existe), soit repositionner la section elle-même en haut à droite de la page `/news`. Choisir l'interprétation la plus simple et cohérente avec "j'aime bien comme c'est aujourd'hui" — probablement juste garder l'emplacement actuel mais afficher le contenu déplié par défaut, sans notification "recap updated" custom (déjà supprimée plus tôt aujourd'hui). Documenter le choix fait.

### 5.3 Persistance du dernier récap — la rendre durable (cohérent avec le reste de la session)

**Point important que Hachim n'a pas explicitement demandé ce soir, mais qui découle directement du thème de toute la journée (voir `PREVIOUS_VALUE_PERSISTENCE_NEXT_STEPS.md`)** : le cache du Night Recap (`apps/backend/src/intelligence/runtimeStore.ts`, fichier `.runtime/goldOvernightRecap.json`) est **éphémère, vidé à chaque redémarrage/redeploy** — exactement le même problème que celui trouvé et corrigé aujourd'hui pour `previousFetch`. Si Railway redéploie après la génération du soir et avant que Hachim consulte le site, le dernier récap disparaîtrait et affficherait "pas encore de récap" à tort. **Recommandé : persister le dernier récap (par langue) dans Postgres** (nouvelle petite table, ou réutiliser un mécanisme existant type `kpi_observations`/`fedRateDistributionStore.ts` comme modèle), lu en priorité, avec repli sur le fichier `.runtime` comme aujourd'hui — même pattern que ce qui a déjà été fait pour `previousFetch` ce jour. Implémenter si le temps le permet ce soir ; sinon documenter clairement comme point ouvert.

---

## 6. Flux d'actualités en direct (page Actualités/Recherche) — trop lent / vide, à corriger

**Diagnostic déjà fait en lisant le code (`apps/backend/src/news/finnhubGoldNews.ts`)** — cause probable identifiée avant même de commencer : le filtre est TRÈS strict —
- Fenêtre de fraîcheur : seulement les 4 dernières heures (`LIVE_NEWS_WINDOW_MS = 4h`).
- Filtre mots-clés Gold obligatoire (`GOLD_TERMS` regex) appliqué à des catégories Finnhub génériques (`general`, `forex`), pas une recherche Gold-native.
- Résultat plausible : très souvent zéro ou très peu d'articles passent les deux filtres à la fois, d'où "rien n'apparaît" — ce n'est probablement pas un problème de vitesse de rafraîchissement (le backend poll déjà toutes les 5s, push SSE en direct, le frontend a son propre repli 15s) mais un problème de **disponibilité de contenu** après un filtre trop restrictif.

**Concernant un vrai WebSocket gratuit** : à vérifier avant de conclure quoi que ce soit, mais attention — Finnhub documente son WebSocket News comme fonctionnalité payante/Premium (déjà noté dans `docs/GUIDE_FONCTIONNEMENT_DONNEES.md` §4.12). Ne pas supposer qu'une solution WebSocket gratuite existe sans l'avoir vérifiée en direct ce soir.

**Plan d'action suggéré, à ajuster selon ce qui est trouvé en cherchant** :
1. Élargir la fenêtre de fraîcheur (ex. 4h → 12h ou 24h) et/ou assouplir le filtre mots-clés — impact immédiat, faible risque, à tester d'abord.
2. Envisager d'utiliser Tavily (déjà configuré, déjà utilisé comme repli ici) comme source PRINCIPALE plutôt que repli seulement quand Finnhub renvoie <5 items — Tavily avec `time_range: "day"` a déjà fait ses preuves plus tôt dans la journée (Night Recap) pour trouver du contenu Gold récent multi-langue.
3. Chercher activement une vraie alternative gratuite en temps réel (WebSocket ou polling très fréquent) — si rien de solide n'est trouvé, ne pas fabriquer une fausse solution ; améliorer le pipeline existant (points 1-2) est déjà un gain réel et honnête.
4. Documenter précisément ce qui a été essayé/trouvé/écarté et pourquoi, pour que Hachim comprenne le choix final au réveil.

---

## 7. F12 (Central Bank Net Buying / Total Gold Demand) — remplacer "Indisponible"

Déjà documenté dans `PREVIOUS_VALUE_PERSISTENCE_NEXT_STEPS.md` §5.2, confirmé/précisé ce soir par Hachim : remplacer le badge "Indisponible" par un texte cliquable du type **"Cliquer pour voir"** menant vers gold.org (widget ou page pertinente), plutôt qu'un badge sec. Vérifier d'abord si `getExternalSourceLink` (`apps/frontend/src/content/externalSourceLinks.ts`, utilisé par `KpiMiniCell.tsx`/`FamilyDrawerView.tsx`) couvre déjà ces deux KPI (`f12-cb-net-buying`, `f12-quarterly-demand`) — le petit lien "gold.org" visible dans les screenshots de la journée suggère que oui, au moins partiellement. Si c'est déjà câblé, il s'agit juste d'ajuster le texte affiché ; si non, l'ajouter à ce fichier de config plutôt que de coder un cas spécial.

---

## 8. F9 (Trésor/Fiscal) — enrichir le contenu, actuellement trop pauvre

Aujourd'hui la carte F9 n'affiche que "Prochaine adjudication à 10 ans dans 1 jour" — Hachim trouve ça trop maigre. Chercher des données gratuites supplémentaires pertinentes pour le financement du Trésor US, par exemple (à vérifier, pas garanti disponible gratuitement) :
- Calendrier complet des prochaines enchères (pas seulement la 10 ans — 2Y, 5Y, 20Y, 30Y, T-Bills) via l'API Treasury Fiscal Data déjà utilisée (`apps/backend/src/providers/treasury.ts`) — `upcoming_auctions` est déjà fetché (`f9Treasury.ts`) mais peut-être sous-exploité côté affichage.
- Montant total de dette émise récemment, taille des dernières enchères.
- Toute autre statistique Treasury Fiscal Data pertinente et déjà accessible sans nouvelle clé.

Chercher/implémenter le maximum de ce qui est raisonnablement accessible sans nouvelle intégration lourde — objectif : une carte F9 moins vide, pas nécessairement exhaustive.

---

## 9. F11 (Options/Vol) et tous les autres KPI — previous/current

Rappel explicite de Hachim : le principe "toujours montrer l'ancienne et la nouvelle valeur" (voir `PREVIOUS_VALUE_PERSISTENCE_NEXT_STEPS.md`, document séparé et déjà détaillé le même jour) s'applique aussi à F11 et à tous les autres KPI listés dans ce document — **ne pas dupliquer le travail ici, se référer à `PREVIOUS_VALUE_PERSISTENCE_NEXT_STEPS.md` pour l'implémentation complète de ce chantier**, qui couvre déjà F11 explicitement dans sa liste de KPI à traiter.

---

## 10. Résumé de fin de session (à écrire à la fin, pas maintenant)

Avant de terminer, ajouter en haut de CE fichier (ou dans un nouveau fichier `OVERNIGHT_SESSION_RESULTS_2026-09-16.md`) :
- Ce qui a été fait, section par section, avec les commits concernés.
- Ce qui n'a pas pu être fait et pourquoi (ex. API introuvable, gratuite inexistante).
- Toute décision de détail prise seul (texte exact d'un libellé, choix d'implémentation) — pour que Hachim comprenne vite au réveil sans devoir tout relire.
- Tout point vraiment resté ouvert nécessitant une vraie décision de Hachim (à minimiser autant que possible, seulement si vraiment impossible de trancher seul).
