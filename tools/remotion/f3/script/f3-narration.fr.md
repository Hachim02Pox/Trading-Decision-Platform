# F3 — Fed & anticipations de marché (v3, redo 2026-09-17b)
## Narration française — pauses naturelles, faits terminal corrigés

Chaque bloc `## SCENE` ci-dessous est lu comme un fichier audio indépendant par
edge-tts, puis synchronisé image par image dans Remotion. Les points de
suspension et virgules marquent des pauses naturelles voulues — ne pas les
retirer en nettoyant le texte.

IMPORTANT — correction factuelle vs la v2 : le terminal n'affiche PAS de
"trajectoire complète à 6 mois" dans un tiroir de détail. Les KPI f3-path-6m
et f3-repricing sont UNAVAILABLE (pas de source gratuite) et pointent vers un
lien externe CME FedWatch (voir apps/frontend/src/content/externalSourceLinks.ts).
Ce qui EST réel et affiché directement sur la façade F3 (F3FedFace.tsx) : la
fourchette cible (lower–upper), le scénario le plus probable ("Next"), sa
probabilité, et une flèche probabilité-précédente → probabilité-actuelle
quand la donnée est fraîche. La scène terminal-usage ci-dessous reflète ça.

## SCENE 01 — id: intro
La banque centrale américaine, la Fed, décide aujourd'hui du taux d'intérêt d'aujourd'hui. Mais les marchés, eux, essaient de deviner ce qu'elle va décider, dans plusieurs mois. F3, c'est la lecture de ces prévisions de marché sur la Fed, pas seulement la décision du jour.

## SCENE 02 — id: probability
Le marché donne un pourcentage de chance à chaque scénario possible. Par exemple... 25 % de chance que rien ne change. 60 % de chance d'une petite baisse. 15 % de chance d'une grosse baisse. Le scénario le plus probable, c'est la petite baisse, à 60 %. Mais attention. Il reste 40 % de chances que ce scénario-là ne se réalise pas. Une probabilité, même élevée, n'est jamais une certitude.

## SCENE 03 — id: trap-example
Voici un piège classique. Imaginons... la Fed ne change rien à son taux. La plupart des gens pensent alors que rien ne s'est passé. Mais si, dans son discours, la Fed dit qu'elle prévoit moins de baisses dans le futur qu'avant, le marché va quand même ajuster ses attentes à la hausse. Et ça, c'est mauvais pour l'or. À l'inverse, si la Fed laisse entendre plus de baisses à venir, même sans rien changer aujourd'hui, c'est bon pour l'or. Ce n'est jamais la décision du jour qui compte le plus. C'est le changement, dans ce que le marché attendait avant.

## SCENE 04 — id: terminal-usage
Dans le terminal, F3 affiche la fourchette actuelle de la Fed, le scénario le plus probable pour la prochaine réunion, et sa probabilité, avec une flèche qui montre si elle a changé depuis la dernière lecture. Pour aller plus loin, un lien renvoie vers CME FedWatch, la référence externe gratuite qui suit ça en direct.

## SCENE 05 — id: recap
Pour résumer. Une probabilité de marché n'est jamais une promesse. La décision du jour compte moins que le changement dans les attentes. Et pour l'or, c'est toujours cette différence entre ce qui était prévu, et ce qui se passe vraiment, qui fait bouger les prix.
