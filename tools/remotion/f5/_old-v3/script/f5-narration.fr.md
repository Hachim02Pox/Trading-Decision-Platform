# F5 — Emploi & Croissance (v1)
## Narration française — pauses naturelles, faits terminal vérifiés

Chaque bloc `## SCENE` ci-dessous est lu comme un fichier audio indépendant par
edge-tts, puis synchronisé image par image dans Remotion. Les points de
suspension et virgules marquent des pauses naturelles voulues — ne pas les
retirer en nettoyant le texte.

FAITS TERMINAL VÉRIFIÉS (source : apps/backend/src/real/f5Employment.ts,
apps/backend/src/real/blsMonthly.ts, apps/frontend/src/components/market/
FamilyModule.tsx, apps/backend/src/mock/fixtures.ts, apps/backend/src/
intelligence/mechanical/rules.ts, apps/frontend/src/content/
externalSourceLinks.ts) :
- F5 n'a PAS de façade dédiée comme F3 (F3FedFace) ou F2 — elle passe par le
  rendu générique `DefaultContent` (tuiles de KPI cliquables + tiroir de
  détail), comme la majorité des familles.
- Visibles directement sur la carte (visibility: "cockpit") : le taux de
  chômage (f5-unemployment), le dernier chiffre d'emplois créés avec sa
  comparaison au consensus (f5-payrolls-latest), et l'estimation de
  croissance en continu GDPNow (f5-gdpnow).
- Dans le tiroir de détail (visibility: "deep"/"event") : moyenne sur 3 mois
  des emplois créés (f5-payrolls-3m), inscriptions hebdomadaires au chômage
  initiales et continues (f5-claims-initial/continuing, moyenne 4 semaines
  f5-claims-4w), salaires horaires moyens (f5-ahe-mom), révision nette sur
  2 mois (f5-payrolls-revision-2m, qui reste UNAVAILABLE tant que l'historique
  interne n'a pas au moins deux lectures du même mois).
- Les indices d'enquête auprès des entreprises (ISM services/manufacturing)
  sont UNAVAILABLE en interne (NO_SOURCE, pas de source gratuite) et
  pointent vers un lien externe (tradingeconomics.com) — même schéma que le
  lien CME FedWatch de F3.
- Dans `rules.ts`, chaque KPI F5 est marqué `mode: "CONTEXTUAL"` avec
  `supportiveDirection: null` — F5 n'affiche jamais d'étiquette "favorable"/
  "défavorable" pour l'or toute seule, contrairement à d'autres familles.

## SCENE 01 — id: intro
F5, c'est le thermomètre de l'économie américaine... combien de personnes travaillent, combien de nouveaux emplois sont créés chaque mois, est-ce que l'activité économique accélère ou ralentit. Contrairement à F3, qui parle directement des taux de la banque centrale, F5 ne dit jamais tout seul si c'est bon ou mauvais pour l'or. Il donne juste la température... et c'est cette température qui, ensuite, influence les décisions de la Fed.

## SCENE 02 — id: key-numbers
Deux chiffres reviennent tout le temps. D'abord, le taux de chômage... c'est simplement le nombre de personnes sans emploi, divisé par le nombre de personnes qui cherchent activement du travail. Si plus de gens se mettent à chercher un emploi, même sans le trouver tout de suite, ce taux peut monter... sans que ce soit forcément une mauvaise nouvelle. Ensuite, il y a le nombre d'emplois créés dans le mois, estimé auprès des entreprises. Attention... ce chiffre compte des emplois, pas des personnes. Quelqu'un qui a deux emplois est compté deux fois.

## SCENE 03 — id: revisions-matter
Voici un piège classique. Imaginons... Hachim lit que 190 000 emplois ont été créés le mois dernier, alors que les économistes en attendaient 170 000. Une bonne surprise, à première vue. Mais au même moment, les deux mois précédents sont révisés en baisse... de 35 000 et 25 000 emplois en moins. Au total, 60 000 emplois de moins que ce qu'on pensait. Donc ce chiffre du mois, tout seul, ne raconte pas toute l'histoire. Il faut toujours regarder la tendance sur plusieurs mois... pas juste le dernier titre.

## SCENE 04 — id: terminal-usage
Dans le terminal, la carte F5 affiche directement trois chiffres... le taux de chômage, le dernier nombre d'emplois créés avec sa comparaison aux attentes, et une estimation de croissance mise à jour en continu, appelée GDPNow. En cliquant sur la carte, un tiroir s'ouvre avec plus de détails... la moyenne sur trois mois, les inscriptions hebdomadaires au chômage, les salaires, et la révision des deux derniers mois. Pour les enquêtes auprès des entreprises, le terminal n'a pas encore de source directe gratuite... un lien renvoie donc vers un site externe. Et contrairement à d'autres familles, F5 n'affiche jamais d'étiquette favorable ou défavorable pour l'or toute seule... il faut toujours vérifier ensuite la réaction de la Fed, des taux, et du dollar.

## SCENE 05 — id: recap
Pour résumer. F5, c'est l'emploi et la croissance, le thermomètre de l'économie américaine. Un seul chiffre ne fait jamais une tendance... il faut regarder les révisions et la moyenne sur plusieurs mois. Et F5 ne dit jamais, à lui seul, si c'est bon ou mauvais pour l'or... c'est toujours la réaction de la Fed, des taux et du dollar qui tranche.
