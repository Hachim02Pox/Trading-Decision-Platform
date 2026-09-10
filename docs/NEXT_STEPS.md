# Prochaines étapes et statut du projet

> Doc de suivi général — contrairement à `docs/AUTH_SUPABASE.md` (spécifique à l'auth/déploiement), celui-ci suit l'avancement global et la liste des prochaines tâches. Mettre à jour à chaque session qui avance ou ajoute quelque chose.

## Où on en est (2026-09-10)

- **Rebrand "Zenith Terminal"** terminé : nom, mark gyroscope animé (`apps/frontend/src/components/brand/GyroscopeMark.tsx`), nav horizontale avec animation "vivant" au survol, ancien "Gold Terminal"/rail vertical retirés. Voir `DESIGN.md` §0/§12/§22.
- **Base de données** : MySQL local abandonné entièrement, tout (journal, historique KPI, calendrier, audit Lecture Globale) tourne sur Supabase Postgres — même projet que l'auth. TLS vérifié strictement avec le certificat racine Supabase épinglé (pas de `rejectUnauthorized: false`). Voir `docs/AUTH_SUPABASE.md` "Mise à jour 6".
- **Déploiement** : frontend Vercel et backend Railway tous les deux à jour avec le code actuel (déployé manuellement via API/CLI le 2026-09-10, le projet Vercel n'a pas d'auto-déploiement GitHub connecté — voir "Prochaine étape" ci-dessous).
- **Documentation données** : `docs/DONNEES_MARCHE_DECISION.md` documente chaque famille/KPI du cockpit (source, fetch, fraîcheur, formules).

## Prochaines étapes

### 1. TradingView — les dessins (Fibo, tendances, etc.) ne sont pas sauvegardés

**Le problème** : sur `/chart`, le widget TradingView actuel (`TradingViewAdvancedChart.tsx`) ne garde pas les dessins/indicateurs d'une session à l'autre — il faut tout reconfigurer à chaque fois.

**Ce qui est utilisé aujourd'hui** : le **widget gratuit embarqué** (`embed-widget-advanced-chart.js`, dans `apps/frontend/src/lib/tradingViewWidgetConfig.ts`) — un simple `<script>` avec un objet de config JSON. C'est la version "vitrine" de TradingView, pas la librairie complète.

**Recherche faite** :

- La sauvegarde/chargement de dessins vers un serveur (`save_load_adapter`, `charts_storage_url`, `onAutoSaveNeeded`, "Save layout"/"Load layout") est une fonctionnalité de la **[Advanced Charts Library](https://www.tradingview.com/charting-library-docs/latest/saving_loading/)** — une librairie **sous licence**, à télécharger après une demande d'accès approuvée par TradingView (gratuite pour un usage personnel/non-commercial dans beaucoup de cas, mais ce n'est pas automatique — voir [tradingview.com/charting-library-docs](https://www.tradingview.com/charting-library-docs/latest/saving_loading/)). Le widget gratuit actuellement utilisé n'a **aucun** paramètre de config documenté pour ça (vérifié sur [la doc du widget](https://www.tradingview.com/widget-docs/widgets/charts/advanced-chart/)).
- **Comportement rapporté (non confirmé officiellement par TradingView pour le widget gratuit, à tester)** : le widget gratuit est en réalité un iframe pointant directement vers l'application chart de tradingview.com. Si Hachim est connecté sur tradingview.com (compte gratuit) **dans le même navigateur**, il est plausible que ses dessins se sauvegardent automatiquement sur son compte TradingView et se rechargent la prochaine fois — comportement largement rapporté par des utilisateurs de ce widget, mais je n'ai pas pu le tester avec un vrai compte connecté, donc à vérifier concrètement.

**À faire, dans l'ordre** :

1. **[Hachim, 2 minutes, zéro code]** Ouvrir `/chart` sur le terminal, se connecter sur tradingview.com **dans le même navigateur/onglet** (compte gratuit suffit), dessiner un Fibo ou une tendance, recharger la page, vérifier si le dessin est toujours là. Si oui : problème réglé sans rien coder, juste rester connecté à TradingView dans ce navigateur.
2. **Si l'étape 1 ne marche pas** et qu'on veut que ce soit lié au **compte du terminal** (pas au compte TradingView personnel) : demander l'accès à la [Advanced Charts Library](https://www.tradingview.com/advanced-charts/) (formulaire de demande sur leur site, délai d'approbation variable), puis remplacer le widget embarqué actuel par cette librairie et implémenter un `save_load_adapter` qui écrit dans Supabase Postgres (nouvelle table, ex. `chart_layouts`, facile à ajouter maintenant que la persistance est en place). C'est un changement plus lourd : autre librairie, autre API JS, ré-implémentation du composant chart — à scoper comme sa propre tâche, pas un patch rapide.

Ne pas relancer cette recherche à zéro dans une prochaine session — commencer par l'étape 1 ci-dessus.
