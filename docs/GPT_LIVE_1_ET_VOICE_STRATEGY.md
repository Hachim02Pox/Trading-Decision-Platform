# GPT-Live-1 et stratégie voix pour Zenith Terminal

> État de la recherche : 10 septembre 2026. Ce document est une recommandation produit et technique ; il ne modifie pas le comportement du terminal.

## Décision en une phrase

**Ne pas démarrer une intégration GPT-Live-1 aujourd'hui : il n'est pas publiquement disponible dans l'API.** Construire, si la voix est validée comme besoin réel, une première couche compatible avec l'API Realtime actuelle et avec `GPT-Live-Transcribe`. Cette couche pourra remplacer le modèle de conversation par GPT-Live-1 le jour où OpenAI publiera son identifiant, son contrat API et ses tarifs.

Cette approche donne une fonction utile immédiatement, garde les coûts sous contrôle et évite de bloquer la roadmap sur une liste d'attente.

## Ce que le lien annonce — et ce qu'il n'annonce pas

GPT-Live est la nouvelle génération vocale d'OpenAI : architecture *full-duplex* (écoute et parole simultanées), meilleure gestion des pauses/interruption et délégation d'une recherche ou d'un raisonnement long à un modèle de fond. [Annonce officielle GPT-Live](https://openai.com/index/introducing-gpt-live/)

Mais le lien fourni est précisément un **formulaire pour être notifié lorsque GPT-Live-1 sera disponible dans l'API**, pas une page de mise en route. [Formulaire officiel](https://openai.com/form/gpt-live-1-in-the-api/)

| Sujet | Situation vérifiée au 10/09/2026 |
|---|---|
| GPT-Live-1 dans ChatGPT Voice | Déployé progressivement pour les utilisateurs ChatGPT, selon l'offre. |
| GPT-Live-1 dans l'API | **Pas encore disponible publiquement.** Inscription à une notification seulement. |
| Identifiant de modèle / SDK / limites API GPT-Live-1 | Non publiés officiellement. Ne pas les inventer ni coder contre eux. |
| Prix GPT-Live-1 | Non publié officiellement. |
| Alternative API utilisable maintenant | `gpt-realtime-2.1` / `gpt-realtime` pour conversation audio bidirectionnelle ; `gpt-live-transcribe` pour la transcription live. |

Autrement dit : le nom est très prometteur, mais il ne doit pas devenir une dépendance de production à ce stade. Le bon résultat produit est la **voix utile**, non l'attente d'un nom de modèle.

## Ce qui est disponible maintenant

### 1. Conversation vocale interactive : Realtime API

L'API Realtime accepte et produit de l'audio avec faible latence, via WebRTC, WebSocket ou SIP. Elle sait aussi appeler des fonctions : c'est ce qui permet à une conversation de demander les données **réelles de Zenith** au lieu d'improviser une réponse de marché. [Référence Realtime](https://platform.openai.com/docs/api-reference/realtime?lang=javascript) ; [modèle GPT-Realtime](https://developers.openai.com/api/docs/models/gpt-realtime).

`gpt-realtime-2.1` ajoute raisonnement configurable, appels d'outils, meilleure reconnaissance alphanumérique, gestion du bruit et des interruptions. C'est le candidat conversationnel à évaluer, pas un moteur de calcul financier. [Fiche GPT-Realtime-2.1](https://developers.openai.com/api/docs/models/gpt-realtime-2.1)

### 2. Dictée live : GPT-Live-Transcribe

Pour capter une note orale, une idée de trade ou une question sans exiger une réponse parlée, `gpt-live-transcribe` est beaucoup plus sobre : transcription en streaming, indices de mots-clés et indices de langues. Son tarif publié est **0,017 USD/minute**. [Fiche officielle GPT-Live-Transcribe](https://developers.openai.com/api/docs/models/gpt-live-transcribe)

Ce n'est pas GPT-Live-1 : c'est un excellent premier brique qui partage l'objectif « voix en temps réel » sans risque d'attendre une API non lancée.

## Où la voix peut réellement aider Zenith

Zenith est un terminal personnel de lecture macro décisionnelle de l'or : données avec provenance, familles F2–F13, calendrier, Lecture Globale, actualités et journal. Il ne doit ni donner un ordre ni simuler une certitude de marché. La voix doit renforcer ce contrat, pas le contourner.

## Concrètement : pourquoi cela pourrait vous être utile

La valeur n'est pas « parler à une IA parce que c'est impressionnant ». Dans un terminal comme Zenith, la voix devient intéressante quand elle enlève une friction à un moment où vous pensez plus vite que vous ne tapez, ou quand vous n'êtes pas devant l'écran.

### Pour vous, en tant qu'utilisateur principal du terminal

| Moment | Sans voix | Avec une voix bien conçue | Bénéfice concret |
|---|---|---|---|
| Une intuition, un changement de thèse ou une erreur à noter | Ouvrir Journal, saisir, reformuler ; l'idée peut se perdre entre-temps | Dicter 30 secondes, corriger la transcription, confirmer | Journal plus fidèle et plus régulier ; meilleur matériau pour vos revues. |
| Ouverture du terminal le matin | Parcourir les familles, cartes et dates une à une | « Qu'est-ce qui a vraiment changé depuis ma dernière session ? » puis cartes de preuves | Récupérer le contexte plus vite, sans confondre ancien et nouveau. |
| Vous avez les mains prises / êtes en déplacement | Le terminal est peu pratique ou fermé | Écouter un brief fondé sur les données déjà collectées et poser une question courte | Continuité de lecture, sans prétendre remplacer l'écran pour une décision complexe. |
| Préparation d'un CPI ou FOMC | Chercher calendrier, consensus, contexte et dernière Lecture Globale | « Quels faits dois-je surveiller, et quelles données sont absentes ? » | Une checklist de préparation disciplinée, plutôt qu'un réflexe de trading. |
| Relecture après une session | Relire des notes longues et retrouver le contexte | « Qu'est-ce que j'avais observé quand le DXY a accéléré ? » | Relier vos propres observations aux données du terminal ; apprentissage personnel. |

Le premier gain est donc **la discipline**, pas une prédiction supérieure. Un bon journal pris à chaud, des questions formulées naturellement et des preuves visibles peuvent réduire la mémoire sélective, le FOMO et l'impression trompeuse d'avoir « toujours su ».

### Pour vos futurs utilisateurs

- **Abaisse la barrière d'entrée** : un utilisateur peut demander « pourquoi cette carte est orange ? » au lieu de connaître d'emblée F2, breakevens ou F13.
- **Rend le terminal plus accessible** : utile pour une personne qui préfère écouter, a une contrainte visuelle/motrice, ou alterne entre analyse et tâches hors écran.
- **Transforme le dense en action de lecture** : la valeur d'un terminal est souvent là, mais cachée sous beaucoup de données. Une réponse courte avec trois preuves est plus mémorisable qu'un tableau sans guide.
- **Crée de la rétention de qualité** : le produit devient un rituel — brief du matin, préparation d'événement, capture de note, débrief — et non un site que l'on ouvre seulement par curiosité.
- **Préserve la différenciation de Zenith** : contrairement à un chatbot financier générique, il répond depuis les données, rapports et règles de fraîcheur du compte, avec les sources visibles.

### Là où cela ne vous aidera pas (et où il faut résister)

La voix n'est probablement pas utile pour comparer finement plusieurs graphiques, auditer des séries longues, lire un tableau dense ou valider une décision importante : l'écran reste supérieur. Elle n'améliore pas la qualité d'un feed retardé, ne remplace pas une source payante et ne doit jamais devenir une machine à générer de la conviction.

Si vous n'utilisez pas le Journal, si vous consultez le terminal exclusivement assis devant les graphiques, ou si vous ne voulez pas payer une consommation API additionnelle, rester sur l'interface actuelle est une décision parfaitement rationnelle. C'est pourquoi la dictée du journal, activable à la demande, est le test le plus honnête : elle permet de mesurer un gain avant de construire un assistant vocal complet.

| Cas d'usage | Exemple naturel | Valeur réelle | Première techno | Risque / garde-fou |
|---|---|---|---|---|
| **Journal dicté** — priorité 1 | « Note : j'ai réduit mon exposition après le CPI ; ma thèse était… » | Capturer les observations au moment où elles existent, sans clavier | `gpt-live-transcribe` | Montrer une prévisualisation, puis sauvegarde seulement après clic explicite ; aucune exécution d'ordre. |
| **Recherche vocale de KPI** | « Montre-moi ce qui a changé sur les taux réels depuis hier » | Navigation mains libres et réponse adossée aux KPI actuelles | Realtime + outils de lecture | Réponse cite valeur, période, source, fraîcheur et état `REAL`/`UNAVAILABLE`. |
| **Brief audio du matin / de clôture** | « Résume les trois changements macro qui comptent pour l'or aujourd'hui » | Utile en déplacement ; rend la Lecture Globale plus accessible | Realtime ou génération texte + TTS ultérieurement | Dire « lecture », « scénario », « incertitude » ; jamais Achat/Vente/stop/taille. |
| **Débrief de la Lecture Globale** | « Où les analystes ne sont-ils pas d'accord ? » | Rend le rapport dense interrogeable, sans l'aplatir | Realtime + outils de lecture | Le modèle lit le rapport conservé ; il ne refait pas silencieusement l'analyse. |
| **Préparation d'événement F13** | « Quels catalyseurs USD sont dans les 48 heures et pourquoi cela compte ? » | Transforme le calendrier en checklist parlée | Realtime + calendrier | Ne jamais inventer un événement : absence de source = `INDISPONIBLE`. |
| **Mode concentration** | « Reste silencieux, transcris seulement jusqu'à ce que je dise fin de note » | Réduit la friction sans créer un assistant bavard | Transcription live | Voyant micro, arrêt clair, pas d'enregistrement implicite. |

### L'idée qui différencie vraiment le produit

Créer un **"Voice Evidence Rail"** : à chaque réponse vocale, l'interface affiche en parallèle une petite carte factuelle vérifiable — KPI, date d'observation, date de récupération, source et lien, statut de fraîcheur. La voix devient alors un accès express au terminal, jamais une boîte noire qui parle avec aplomb.

Exemple de réponse attendue : « Le taux réel à 10 ans est affiché comme *à vérifier* ; il a été récupéré à 08:12 et la source est FRED. Je peux ouvrir la carte, mais je ne peux pas conclure à une direction de l'or à partir de cette seule donnée. »

## Architecture recommandée

```text
Navigateur (micro + panneau "Voice Evidence Rail")
        │ WebRTC, audio et événements de session
        ▼
OpenAI Realtime  ── appel de fonction demandé ──► Backend Express Zenith
        ▲                                                  │
        │                    réponses strictement typées   ├─ snapshot/KPI
        └──────────────────────────────────────────────────├─ calendrier F13
                                                           ├─ Lecture Globale mémorisée
                                                           └─ brouillon de journal
```

1. L'utilisateur active volontairement le micro dans le frontend Next.js.
2. Le navigateur établit une session WebRTC. Le backend garde `OPENAI_API_KEY` secret ; il ne doit jamais être livré au navigateur. L'API Realtime documente la création d'un appel WebRTC et les paramètres de session/outils. [Référence officielle](https://platform.openai.com/docs/api-reference/realtime?lang=javascript)
3. Le modèle ne reçoit que des **outils allowlistés, en lecture** : `get_market_snapshot`, `get_kpi_detail`, `get_calendar_window`, `get_global_read_summary`, `search_journal_drafts`.
4. Les fonctions appellent les services existants, puis retournent un JSON limité et typé. Le modèle reformule ; le frontend rend également les preuves retournées.
5. Pour écrire dans le journal, le modèle ne crée qu'un `draft`. L'utilisateur voit le texte et confirme l'enregistrement via le flux déjà sécurisé/authentifié du terminal.

L'API Realtime autorise les outils/fonctions et un contrôle du choix d'outil, mais elle n'offre pas de Structured Outputs : **la validation JSON doit donc rester côté backend**, avant toute lecture ou écriture. [Référence des paramètres Realtime](https://platform.openai.com/docs/api-reference/realtime?lang=javascript)

### Pourquoi WebRTC ici ?

Pour le micro dans un navigateur, WebRTC est le chemin adapté à une conversation audio temps réel. Pour un worker backend ou un test automatisé, WebSocket est plus approprié. SIP ne devient pertinent que si Zenith devient un produit téléphonique — ce qui n'est pas une priorité pour un terminal personnel.

## Ce que je construirais, dans cet ordre

### Phase A — utile, peu chère, sans assistant qui parle (MVP recommandé)

- Bouton « Dicter une note » dans le Journal ; transcription live avec `gpt-live-transcribe`.
- Panneau de prévisualisation éditable, consentement d'enregistrement, indicateur micro actif, raccourci clavier de coupure.
- Stocker le texte final, la langue et l'horodatage ; ne pas stocker l'audio par défaut.
- Mesurer : minutes transcrites, taux de validation vs abandon, corrections effectuées, coût mensuel.

Pourquoi commencer ici : le journal existe déjà, la valeur est directe et le tarif connu. À 10 minutes de dictée par jour ouvré, le coût de transcription serait environ **3,74 USD/mois** (10 × 22 × 0,017), hors taxes et sans autres appels IA.

### Phase B — copilote de navigation factuelle (pilote privé)

- Commande « Demander au terminal » en mode push-to-talk, limitée aux outils lecture.
- 4 à 6 intentions très cadrées : KPI, comparaison, fraîcheur/source, calendrier, explication de carte, résumé d'un rapport déjà généré.
- Cartes de preuves obligatoires et transcription visible de chaque échange.
- Budget par session, durée maximum, limite de tokens de sortie, journal d'audit sans contenu sensible inutile.

Ne commencer cette phase que si la Phase A est utilisée. Elle apporte de la magie, mais coûte plus et doit prouver qu'elle fait gagner du temps à un trader plutôt que de distraire.

### Phase C — briefing oral et conversation continue

- Lecture audio d'un brief produit à partir des données et rapports déjà validés.
- Interruption naturelle, questions de suivi, navigation par la voix.
- Isoler un adaptateur `VoiceSessionProvider` pour que `gpt-realtime-2.1` puisse être remplacé par GPT-Live-1 à sa sortie, sans réécrire UI, outils ni règles métier.

## Coûts : gratuits ou non ?

**Non : l'API n'est pas incluse dans ChatGPT Plus/Pro/Business.** Elle est facturée séparément à l'usage. [Tarification API officielle](https://openai.com/fr-CA/api/pricing/)

| Brique | Prix API publié | Lecture pratique |
|---|---:|---|
| `gpt-live-transcribe` | **0,017 USD/minute** | Très adapté à une dictée maîtrisée. |
| `gpt-realtime-2.1`, audio entrant | **32 USD / 1 M tokens audio** | Conversation audio payante ; le coût réel dépend des minutes, de la parole et du contexte. |
| `gpt-realtime-2.1`, audio sortant | **64 USD / 1 M tokens audio** | C'est souvent la partie à surveiller si l'assistant parle beaucoup. |
| `gpt-realtime-2.1`, texte | 4 USD / 1 M tokens entrants ; 24 USD / 1 M sortants | Les outils et le contexte textuel comptent aussi. |
| GPT-Live-1 | **Inconnu / indisponible** | Aucun budget sérieux ne peut être annoncé avant la publication officielle. |

Les tarifs Realtime ci-dessus viennent de la [fiche officielle du modèle](https://developers.openai.com/api/docs/models/gpt-realtime-2.1). Le modèle Realtime public n'est pas pris en charge en palier gratuit et les limites dépendent du niveau d'usage du compte. [Limites publiées](https://developers.openai.com/api/docs/models/gpt-realtime)

Règle de budget simple : lancer la Phase B avec un plafond mensuel dur (par exemple 15–30 USD), un alerting à 50/80/100 %, et afficher le coût de session dans les logs internes. Ne pas deviner une conversion tokens-audio/minute : elle peut varier ; laisser les relevés API des deux premières semaines produire le vrai coût/minute du produit.

## Sécurité, confidentialité et conformité produit

- **Clé jamais dans le navigateur** : elle reste dans l'environnement Railway/backend. Une session voix est créée/relayée par le backend et liée au titulaire authentifié.
- **Autorisation avant toute nouvelle route** : le terminal contient déjà des routes de journal non protégées dans le backend ; ajouter de la voix est l'occasion de ne pas élargir cette surface. Les routes de session et toute écriture doivent exiger `requireHolder`, vérifier l'origine, limiter le débit et imposer des limites de taille/durée.
- **Lecture seule par défaut** : aucune fonction voix ne doit passer d'ordre, envoyer un message, changer un paramètre ou écrire sans confirmation UI explicite.
- **Séparer faits et narration** : les fonctions retournent les données canoniques ; le modèle ne calcule pas de chiffres de marché de tête et ne crée pas de causalité fictive.
- **Audio et consentement** : micro désactivé par défaut, voyant pendant la capture, bouton stop toujours visible, politique de conservation explicite. Ne conserver l'audio que si une raison produit claire l'exige.
- **Rétention** : vérifier la configuration de rétention du projet OpenAI avant un pilote. L'API expose des contrôles de rétention au niveau organisation/projet ; la politique adéquate dépend du compte et du contrat. [Référence de contrôle de rétention](https://developers.openai.com/api/reference/python/resources/admin/subresources/organization/subresources/projects/subresources/data_retention/methods/retrieve)
- **Politique de trading** : chaque réponse doit rappeler sa nature informative lorsque nécessaire. La voix n'autorise jamais une conclusion Achat/Vente, niveau, stop ou taille qui serait interdite au reste de Zenith.

## Limites à assumer explicitement

- GPT-Live-1 est une annonce produit ChatGPT aujourd'hui, pas une dépendance API livrable.
- Une voix naturelle n'améliore pas la qualité des données : les états `UNAVAILABLE`, les retards de fournisseur et la fraîcheur demeurent visibles et verbalisés.
- Realtime sait appeler des outils, mais une réponse très fluide peut sembler plus certaine qu'elle ne l'est : d'où les cartes de preuves, la source et la date toujours à l'écran.
- Le contexte d'une longue conversation doit être borné. Le modèle Realtime a une fenêtre de contexte ; les mécanismes de troncature et de limite de sortie ont une incidence à la fois sur le coût et la continuité. [Référence Realtime](https://developers.openai.com/api/reference/cli/resources/realtime/subresources/calls/methods/accept)
- L'accent, le bruit et le mélange français/anglais financier demandent un test avec le vocabulaire réel : DXY, breakevens, FOMC, CPI, GLD, etc. Ne pas déployer après une simple démo générique.

## Critères de décision avant de passer en production

Passer de pilote à production seulement si, sur des sessions réelles :

1. la dictée réduit nettement le temps de saisie sans dégrader la qualité du journal ;
2. au moins 95 % des réponses factuelles affichent une preuve valide ou disent clairement `INDISPONIBLE` ;
3. zéro action d'écriture est faite sans confirmation explicite ;
4. le coût observé par utilisateur actif reste sous le plafond choisi ;
5. les tests couvrent permissions micro, absence de clé côté client, auth/rate limiting, validation d'outil, échec OpenAI, données indisponibles et interruption réseau ;
6. une revue sécurité précède l'exposition publique.

## Recommandation finale

La meilleure première version pour Zenith n'est pas « un ChatGPT qui parle ». C'est un **journal dicté, sourcé et contrôlable**, suivi d'un **copilote vocal qui ne répond qu'avec des preuves visibles du terminal**. Cela met la voix au service du rythme de travail d'un trader et des règles de vérité déjà fortes du produit.

Quand GPT-Live-1 arrivera réellement dans l'API, réévaluer son contrat, ses langues, ses outils, ses limites, son prix et ses garanties de rétention. Si l'adaptateur voix et les outils restent indépendants du modèle, le changement sera alors une migration ciblée plutôt qu'une reconstruction.
