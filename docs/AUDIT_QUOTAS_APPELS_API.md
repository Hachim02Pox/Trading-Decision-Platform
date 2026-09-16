# Audit des appels API — quotas gratuits, fréquence, optimisation

> Objectif : donner à Hachim tout ce qu'il faut pour un travail d'optimisation des appels API (éviter de dépasser un quota gratuit, éviter d'appeler plus souvent que la donnée ne change réellement).
> Ce document est une SYNTHÈSE ORIENTÉE OPTIMISATION. Le détail complet du fonctionnement des données (URLs exactes, formats de réponse, comportements d'erreur) reste dans [GUIDE_FONCTIONNEMENT_DONNEES.md](GUIDE_FONCTIONNEMENT_DONNEES.md) — ce fichier-ci n'y ajoute que les colonnes "quota gratuit" et "cadence réelle de la donnée vs cadence d'appel".
> Écrit le 2026-09-15.

## Comment lire ce document (légende de confiance)

Certains chiffres de quota ont été vérifiés en direct aujourd'hui contre la documentation officielle du fournisseur ; d'autres ne l'ont pas été (page qui ne publie pas le chiffre, ou page inaccessible au moment de la recherche). Ne jamais traiter un chiffre non vérifié comme définitif — les quotas des fournisseurs changent sans préavis.

- ✅ **Vérifié aujourd'hui** : chiffre lu en direct sur la documentation officielle du fournisseur le 2026-09-15.
- 📖 **Connaissance générale, non re-vérifiée aujourd'hui** : chiffre largement documenté/cité publiquement mais pas retrouvé formellement sur la doc officielle au moment de cette recherche — à reconfirmer toi-même sur le site du fournisseur avant de t'appuyer dessus pour une décision importante.
- ❓ **Non documenté publiquement** : aucun chiffre officiel trouvé, ni aujourd'hui ni dans le code. Le dépôt applique déjà une garde défensive (cache/TTL) qui ne dépend pas de connaître ce chiffre.

---

## 1. Résumé — ce qui compte le plus pour optimiser

1. **Rien dans ce projet n'appelle une API en boucle libre.** Toutes les familles marché passent par un cache TTL par clé (`apps/backend/src/real/cache.ts`) : un appel réseau seulement quand le TTL est expiré ET qu'une requête arrive, jamais un scheduler qui tourne tout seul en arrière-plan pour F2-F12.
2. **Les deux vrais risques de quota sont Tavily et Groq**, à cause du Night Recap (voir section 4) — et ils viennent d'être vérifiés en direct aujourd'hui : Tavily 1 000 crédits/mois, Groq (tier gratuit) 8 000 tokens/minute. Le 2e chiffre (TPM Groq) était serré vu la taille du prompt du Night Recap — **corrigé** (troncature du contenu des sources + délai 65s entre EN et FR), voir section 4.
3. **JBlanked (F13) et Finnhub (news) sont les deux seuls flux avec un vrai risque de compte bloqué/suspendu** s'ils sont appelés trop souvent — le code les protège déjà (garde 1x/jour pour JBlanked, 3 appels/minute pour Finnhub), donc rien à changer là, juste à savoir que c'est fragile si quelqu'un modifie ce code plus tard.
4. **Le Night Recap ne coûte plus qu'un run par jour** depuis la suppression du bouton manuel (2026-09-15) — avant, chaque clic manuel coûtait autant que le run automatique (10 requêtes Tavily + 2 appels Groq) ; c'était le plus gros risque de dérapage de quota du projet, maintenant neutralisé par la garde `ingestion_state`.
5. **Plusieurs providers marché (Treasury, NY Fed, CFTC, Yahoo, SPDR GLD) n'ont pas de clé et pas de quota officiel documenté trouvé** — ce n'est pas un problème aujourd'hui (cadence TTL déjà généreuse, 15 min à 24 h selon la source), mais ça veut dire qu'il n'existe aucun filet de sécurité contractuel si l'usage augmentait fortement : à garder à l'œil si le projet grossit (plus d'utilisateurs, plus de refresh).

---

## 2. Table par provider — donnée marché (F2-F13)

Chaque ligne = un provider distinct, avec les familles/KPI qui en dépendent. Cadence économique réelle = à quelle fréquence la source PUBLIE réellement une nouvelle valeur (pas la fréquence d'appel du code).

| Provider (API) | Variable(s) env | Familles/KPI | Fréquence d'appel actuelle (TTL code, vérifié dans `real/*.ts`) | Cadence économique réelle de la donnée | Quota gratuit connu | Marge |
|---|---|---|---|---|---|---|
| Treasury Fiscal Data (courbes + auctions + TGA) | aucune (pas de clé) | F2 (2Y/10Y/10Y réel/2s10s/5y5y/be10), F8 (TGA), F9 (auctions, QRA) | Courbes/taux F2 : 15 min · TGA/DTS F8 : 1 h · Auctions/upcoming F9 : 6 h · QRA (HTML parsé) : 24 h | Quotidien (courbes, TGA), ~mensuel par tenor (auctions), trimestriel (QRA) | ❓ non documenté publiquement (open data US gouvernemental, pas de clé) | Large — la donnée est quotidienne au mieux, l'appel le plus fréquent (15 min) est ~96x plus fréquent que la publication |
| FRED (St. Louis Fed) | `FRED_API_KEY` | F2 (2s10s, breakeven), F5 (GDPNow, claims), F7 (VIX, HY OAS, IG OAS), F8 (SOFR, IORB, réserves), F11 (GVZ) | 15 min (F2/F7/F11) · 1 h (GDPNow, F8 quotidien) · 6 h (claims, réserves) | Quotidien (marché : VIX/OAS/GVZ/SOFR/IORB) · quasi-quotidien pendant le trimestre (GDPNow) · hebdomadaire (claims, réserves) | 📖 largement documenté ailleurs à **120 requêtes/minute par clé**, mais pas retrouvé formellement sur la doc officielle FRED aujourd'hui — à reconfirmer sur ton dashboard FRED avant de t'y fier | Très large marge même si 120/min est correct — le projet ne fait jamais de rafale FRED proche de ça |
| BLS (Bureau of Labor Statistics) | `BLS_API_KEY` | F4 (CPI, PPI), F5 (chômage, payrolls, salaires) | 6 h | Mensuel | ✅ vérifié aujourd'hui (bls.gov/developers/api_faqs.htm) : **500 requêtes/jour avec clé enregistrée, 25/jour sans clé** ; 50 séries par requête max avec clé (1 sans) ; historique 20 ans avec clé (3 ans sans) | Très large — au pire quelques dizaines de requêtes/jour avec une donnée mensuelle |
| BEA (Bureau of Economic Analysis) | `BEA_API_KEY` | F4 (PCE) | 6 h | Mensuel | ❓ non trouvé de chiffre officiel aujourd'hui (page d'inscription et guide PDF ne publient pas de nombre exploitable) | Large si un quota raisonnable existe — usage très faible (une poignée d'appels/jour) |
| NY Fed Markets API | aucune (pas de clé) | F3 (target range via EFFR), F8 (EFFR, spreads) | 1 h | Quotidien | ❓ non documenté publiquement | Large |
| Investing.com Fed Rate Monitor (scraping Playwright) | aucune (pas de clé, PAS une API officielle) | F3 (distribution des probabilités de taux) | 5 h (garde persistante `ingestion_state`) | Change en continu (marché des futures), mais la garde limite volontairement à 5h — c'est un choix produit, pas une contrainte technique du fournisseur | ❓ n/a — pas une API, du scraping de page publique ; le vrai risque est le blocage/CAPTCHA si trop fréquent, pas un quota chiffré | La garde 5h existe justement pour ça — ne pas la réduire sans réfléchir |
| CFTC (Commitment of Traders, Socrata) | aucune (pas de clé) | F10 (Managed Money %, percentile) | 6 h (récent) · 12 h (historique 156 semaines) | Hebdomadaire (publié le vendredi) | ❓ non documenté spécifiquement pour ce dataset — les APIs Socrata publiques imposent généralement une limite anonyme (~1000/heure) sans "app token", mais ce chiffre n'est PAS vérifié aujourd'hui pour ce dataset précis | Très large — donnée hebdomadaire, appel toutes les 6-12h |
| SPDR GLD (fichier XLSX public) | aucune | F10 (holdings, flow) | 20 h (~1x/jour) | Quotidien (1 ligne/jour de bourse) | ❓ n/a — téléchargement de fichier public, pas une API avec quota | Très serré mais volontaire — 1 appel/jour pour une donnée qui change 1x/jour, déjà optimal |
| Yahoo Finance (endpoint non officiel) | aucune | F6 (DXY) | 15 min | Intrajournalier (le dollar bouge en continu pendant les heures de marché) | ❓ non officiel, pas de quota publié — risque connu de blocage IP si trop sollicité, pas un chiffre garanti | Correct pour un DXY qui bouge en continu, mais c'est la source la plus fragile du projet (non officielle) |
| JBlanked (calendrier économique F13) | `JBLANKED_API_KEY` | F13 | **1 appel/jour maximum**, forcé par une garde persistante en base (`ingestion_state`, clé `jblanked:calendar`) — pas un TTL, un vrai plafond dur côté code | Le calendrier de la semaine ne change pas d'heure en heure | ❓ page pricing/tarifs non accessible aujourd'hui (404) ; le repo mentionne déjà "QUOTA_EXCEEDED possible" sur le tier gratuit — peu importe le vrai chiffre puisque le code plafonne déjà à 1/jour | La garde 1/jour EST la protection, indépendamment du vrai quota JBlanked |
| Finnhub (news Gold) | `FINNHUB_API_KEY` | Panneau `/news` (pas un KPI F2-F13) | 3 appels REST (`general`, `forex`, `company-news GLD`) toutes les 60s, **seulement quand le panneau News est ouvert** — rien en arrière-plan sinon | Les news arrivent en continu, imprévisible | 📖 couramment documenté ailleurs à **60 appels/minute** pour le tier gratuit, pas re-vérifié en direct aujourd'hui (page pricing n'a pas rendu le détail via récupération automatique) | 3 appels/minute réels vs 60/minute si ce chiffre est correct — large marge même avec plusieurs onglets ouverts |
| GDELT | aucune | Connectivité seulement (smoke test), pas branché à un pipeline réel | Appel manuel uniquement (`npm run provider:test -- gdelt`) | n/a | ❓ non documenté, "throttling défensif possible" selon le guide | n/a — pas utilisé en continu |

---

## 3. Providers de recherche / IA (pas des données KPI canoniques)

| Provider | Variable(s) env | Utilisé par | Fréquence d'appel actuelle | Quota gratuit connu |
|---|---|---|---|---|
| **Tavily** (recherche web) | `TAVILY_API_KEY` (+ `TAVILY2_API_KEY` fallback si 429) | Night Recap (10 requêtes/run, 1x/jour automatique — voir section 4) + pilote de recherche Global Read (variable selon topic, `DATA_MODE=REAL` + clic manuel uniquement) | Night Recap : 10/jour garanti (plus de bouton manuel). Global Read : dépend de l'usage du bouton | ✅ vérifié aujourd'hui : **1 000 crédits gratuits/mois**, 1 crédit/recherche basique, 2 crédits/recherche "advanced" (utilisée par le pilote Global Read, pas le Night Recap qui reste en "basic"). Limite de rafale : **100 requêtes/minute en dev, 1000 en prod** (largement au-dessus de ce que le projet fait) |
| **Groq** (LLM — Night Recap uniquement) | `GROQ_API_KEY` | Night Recap : génère les paragraphes EN+FR, 2 appels/run, 1x/jour automatique | 2 appels/jour | ✅ vérifié aujourd'hui pour `openai/gpt-oss-20b` et `openai/gpt-oss-120b` (les deux modèles configurés, voir `GROQ_KPI_MODEL`/`GROQ_NIGHT_MODEL` dans `config/env.ts`), tier gratuit : **30 requêtes/minute, 1 000 requêtes/jour, 8 000 tokens/minute, 200 000 tokens/jour**. Voir section 4 — le plafond de 8 000 tokens/MINUTE est le seul serré du projet entier |
| **OpenAI / Anthropic / Gemini** (analyst/challenger/adjudicator IA) | `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GOOGLE_API_KEY` ou `GEMINI_API_KEY` | Analyse KPI à la demande (ouverture drawer) + Global Read, `DATA_MODE=REAL` uniquement | Variable (déclenché par changement de donnée, pas par un scheduler) | Pas de "tier gratuit" fixe universel pour ces trois — facturation à l'usage / crédits d'essai selon TON compte spécifique. Pas un chiffre générique fiable à documenter ici : vérifie plutôt directement sur ton dashboard OpenAI/Anthropic/Google pour ton compte |

---

## 4. Zoom Night Recap — le flux qui vient de changer, et le point d'attention réel

Contexte : le Night Recap a été réécrit aujourd'hui (voir [AI_REPORTS_STATUS.md](AI_REPORTS_STATUS.md)) pour sourcer en 5 langues (EN/FR/ZH/JA/AR, 10 requêtes Tavily) et générer 2 sorties (EN+FR, 2 appels Groq), automatiquement 1x/jour (~9h ET), sans bouton manuel.

**Calcul mensuel (30 jours) :**
- Tavily : 10 requêtes/jour × 30 = **~300 crédits/mois** sur un pool de 1 000/mois → il reste ~700 crédits/mois pour le Global Read (research Tavily "advanced", 2 crédits/requête) si tu l'utilises.
- Groq : 2 requêtes/jour × 30 = **~60 requêtes/mois**, très loin des 1 000/jour et 30/minute — aucun risque sur RPM/RPD.

**Le vrai point d'attention : Groq TPM (tokens/minute) = 8 000.**
Chaque appel Groq envoie tout le tableau de sources déduplitées (jusqu'à ~20 sources, `JSON.stringify` complet — titre, url, publisher, contenu, dates) dans le prompt. Le 2e appel (FR) arrive juste après le 1er (EN), probablement dans la même fenêtre de 60 secondes vu que c'est séquentiel (`for` avec `await`, pas de délai volontaire). Si le contenu combiné des deux appels dépasse 8 000 tokens sur cette même minute, Groq répond 429 (`PROVIDER_LIMIT`) — le code gère déjà cet échec proprement (`recordFailure`, retry dans 60 min via la garde du job), donc ce n'est jamais une donnée inventée ou une valeur silencieusement fausse, mais ça peut faire manquer la fenêtre des 9h certains jours.

**Corrigé (2026-09-15/16) :** `apps/backend/src/intelligence/goldOvernightAnalysis.ts` tronque maintenant le champ `content` de chaque source à 500 caractères avant de le passer au prompt Groq (`truncateForPrompt`, ça ne touche que le prompt — les sources stockées dans le recap gardent leurs métadonnées complètes), et un délai de 65 secondes sépare l'appel EN du FR pour les faire tomber dans deux fenêtres TPM distinctes plutôt que la même minute.

---

## 5. Ce qui n'a AUCUN quota documenté nulle part (ni ici, ni dans le code)

À traiter comme des inconnues opérationnelles, pas comme des garanties :

- BEA (F4 PCE)
- NY Fed Markets API (F3, F8)
- Treasury Fiscal Data (F2, F8, F9)
- CFTC/Socrata (F10)
- Yahoo Finance non officiel (F6) — le plus fragile des cinq, parce qu'en plus de ne pas avoir de quota documenté, ce n'est même pas un endpoint officiellement supporté
- SPDR GLD (F10) — pas une API, un fichier public

Aucun de ces cinq n'a jamais posé de problème réel dans ce projet (cadence d'appel très en dessous de tout seuil raisonnable), mais si tu multiplies les utilisateurs ou les refreshs un jour, ce sont les cinq à surveiller en premier — pas parce qu'ils sont mal utilisés aujourd'hui, mais parce que personne (ni toi ni ce document) ne peut dire à l'avance où est leur vrai plafond.

---

## 6. Où vérifier les vrais chiffres toi-même (au lieu de faire confiance à ce document indéfiniment)

- FRED : https://fred.stlouisfed.org/docs/api/fred/ (dashboard de ta clé pour un usage en temps réel)
- BLS : https://www.bls.gov/developers/api_faqs.htm
- BEA : https://apps.bea.gov/api/signup/ (contacter developers@bea.gov si besoin d'un chiffre précis)
- Finnhub : https://finnhub.io/pricing puis ton dashboard de compte
- Tavily : https://docs.tavily.com (section "API Credits" + "Rate Limits") + ton dashboard
- Groq : https://console.groq.com/docs/rate-limits + ton dashboard (les limites augmentent selon le "tier" atteint par usage/facturation cumulée, pas seulement gratuit vs payant)
- JBlanked : https://www.jblanked.com/news/api/billing/

Ce document devrait être remis à jour si tu changes un TTL dans le code, si tu ajoutes un nouveau provider, ou si tu vérifies un chiffre de quota manquant — sinon il devient obsolète comme n'importe quelle doc figée dans le temps.

---

## 7. Pré-fetch déclenché par le calendrier (implémenté 2026-09-16)

Suite à l'audit ci-dessus, un scheduler complet (node-cron, market-hours guard, calendrier des jours fériés) pour les 12 familles a été jugé disproportionné : l'audit n'a trouvé qu'un seul vrai risque de quota (Groq TPM, corrigé en section 4), tout le reste a une large marge sous le cache TTL paresseux existant — refaire toute l'architecture pour un bénéfice déjà largement couvert n'était pas justifié.

Version allégée retenue : **seul le vrai gain concret** a été implémenté — pré-fetcher F4 (CPI/PPI/PCE) et F5 (Employment Situation) juste après leur publication officielle, au lieu d'attendre le prochain chargement de page paresseux après leur TTL de 6h.

- Heures de publication **vérifiées en direct le 2026-09-16** contre les sources officielles : BLS (`bls.gov/schedule/news_release`) confirme CPI/PPI/Employment Situation à **8:30 AM ET** ; BEA (`bea.gov/news/schedule`) confirme PCE et GDP à **8:30 AM ET**.
- Le mécanisme ne code PAS cette heure en dur : `apps/backend/src/jobs/monthlyReleasePrefetch.ts` lit l'horodatage exact `scheduled_at_utc` déjà ingéré par le calendrier JBlanked (table `macro_events`) pour chaque publication réelle, donc ça reste correct même si une date de publication bouge d'une année sur l'autre.
- Nouvel endpoint interne `POST /api/internal/monthly-release-prefetch/run`, pingé toutes les heures par `.github/workflows/monthly-release-prefetch.yml` (même pattern que les autres workflows, même secret partagé, pas de nouveau secret) — c'est la garde `ingestion_state` par publication (une ligne par `(type, date)`) qui rend chaque ping après le premier un no-op gratuit.
- **GDP est volontairement exclu** : ce projet n'a aucun KPI GDP "actual" canonique câblé (seulement GDPNow, un nowcast) — pré-fetcher une publication GDP n'alimenterait rien.
- Tests unitaires purs : `tests/monthly-release-prefetch.test.ts`.
