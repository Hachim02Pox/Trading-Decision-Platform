# F4 — Inflation (v1)
## Narration française — pauses naturelles, faits terminal vérifiés

Chaque bloc `## SCENE` ci-dessous est lu comme un fichier audio indépendant par
edge-tts, puis synchronisé image par image dans Remotion. Les points de
suspension et virgules marquent des pauses naturelles voulues — ne pas les
retirer en nettoyant le texte.

Source de contenu : `apps/frontend/src/content/knowledge/chaptersF4F6.ts`
(chapitre `familyId: "F4"`), vulgarisé pour un public non technique.

Faits terminal vérifiés avant d'écrire la scène 04 (voir
`apps/backend/src/real/f4Inflation.ts` et
`apps/frontend/src/components/market/FamilyModule.tsx` — détails dans le
storyboard) : F4 n'a pas de façade dédiée (pas de F4Face.tsx), elle passe par
le rendu générique `DefaultContent`. Les 4 KPI cockpit réels sont Core CPI
MoM, Core CPI YoY, Core PCE MoM, Core PCE YoY (CPI/PPI via BLS, PCE via BEA —
tous marqués REAL, aucun lien externe requis contrairement à F3). Les KPI
CPI global, PPI, et la tendance 3 mois annualisée sont en visibilité "deep"
(dans le tiroir de la famille). Chaque case cliquée ouvre un détail avec le
chiffre attendu par les économistes, le chiffre précédent, et si le résultat
est au-dessus, en dessous, ou pile dans la ligne. Toutes les règles
mécaniques F4 sont en mode CONTEXTUAL (jamais de badge coloré
"favorable"/"défavorable" pour l'or) — confirmé dans
`apps/backend/src/intelligence/mechanical/rules.ts`.

## SCENE 01 — id: intro
L'inflation, c'est simplement la vitesse à laquelle les prix montent... pas leur niveau. Un chiffre qui ralentit ne veut pas dire que les prix baissent, juste qu'ils montent moins vite. Et voici le vrai piège pour l'or. Une inflation qui fait peur peut pousser les gens vers l'or, comme valeur refuge. Mais une inflation trop forte peut aussi pousser la banque centrale à réagir plus fort, et ça, c'est plutôt mauvais pour l'or. Le même chiffre... deux histoires opposées. F4, c'est la famille qui te donne les bons chiffres, pour comprendre laquelle des deux domine.

## SCENE 02 — id: headline-vs-core
Le terminal suit plusieurs indices de prix américains. Le CPI, c'est l'indice global, construit sur ce que les ménages paient vraiment de leur poche. Mais il bouge beaucoup, à cause de deux catégories très instables... l'alimentation, et l'énergie. Alors le terminal met en avant le Core CPI, qui retire ces deux catégories, pour voir la tendance de fond, plus stable. Il y a aussi le PCE, une mesure un peu plus large, calculée différemment, celle que la banque centrale utilise pour son propre objectif d'inflation. Maintenant, une autre distinction essentielle. Imaginons... Hachim fait ses courses chaque mois. Ce mois-ci, son panier coûte 0,3 % de plus que le mois dernier. Ça, c'est le rythme mensuel. Mais si on compare à il y a un an, ses courses coûtent environ 3 % de plus. Ça, c'est le rythme annuel. Les deux chiffres viennent du même indice, mais ils ne répondent pas à la même question.

## SCENE 03 — id: trap-example
Voici un piège classique avec ces chiffres. Le rythme mensuel accélère... mais le rythme annuel, lui, baisse. Ça a l'air contradictoire. Ce n'est pas le cas. Exemple. Ce mois-ci, le Core CPI grimpe de 0,35 %, après seulement 0,20 % le mois précédent. Le rythme récent est donc plus fort. Mais sur un an, le chiffre passe de 3,2 % à 3,1 %. Pourquoi ? Parce qu'un vieux mois très fort, à 0,45 %, sort de la fenêtre des douze derniers mois, et se fait remplacer par ce 0,35 % plus faible. Le chiffre annuel baisse... même si l'inflation vient d'accélérer. C'est ce qu'on appelle un effet de base. La bonne réaction, ce n'est jamais de lire un seul chiffre isolé. C'est de comparer plusieurs fenêtres, avant de conclure quoi que ce soit.

## SCENE 04 — id: terminal-usage
Dans le terminal, F4 affiche d'abord les chiffres Core, les plus surveillés... Core CPI mensuel et annuel, Core PCE mensuel et annuel. Clique sur un chiffre, et tu vois ce que les économistes attendaient, le chiffre du mois précédent, et si le résultat est au-dessus, en dessous, ou pile dans la ligne. Pour aller plus loin, le tiroir de la famille donne aussi le CPI global, le PPI, les prix côté producteurs, et la tendance sur trois mois annualisée. Une chose à savoir. F4 n'affiche jamais de badge coloré favorable ou défavorable pour l'or. Toujours neutre, contextuel. Parce que ce chiffre peut jouer dans les deux sens. À toi de vérifier ensuite comment les taux, le dollar, et les attentes de la banque centrale ont vraiment réagi.

## SCENE 05 — id: recap
Pour résumer. L'inflation est un rythme, pas un niveau... ralentir, ce n'est jamais baisser. Le Core, sans alimentation ni énergie, montre la tendance de fond, mais un effet de base peut faire mentir le chiffre annuel tout seul. Et surtout, un chiffre d'inflation n'a jamais de sens fixe pour l'or. Toujours vérifier comment les taux, le dollar, et les attentes de la banque centrale ont vraiment bougé, avant de conclure.
