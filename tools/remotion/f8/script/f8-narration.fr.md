# F8 — Liquidité et financement (v4, 2026-09-23)
## Narration française — couvre l'intégralité du chapitre Knowledge F8

Pipeline F5. Aucun terme anglais lu : "reverse repo" → "prises en pension inversées",
"repo" → "pension", "Treasury General Account" → "compte du Trésor à la Fed". Sigles gardés et
lus comme tels : TGA, SOFR, EFFR, IORB.

## SCENE 01 — id: intro
On parle souvent de la liquidité comme d'un robinet. La Fed ouvre, l'argent coule, les actifs montent. [pause] En réalité, c'est plutôt une plomberie. Des réservoirs, des tuyaux, des vannes, et des pressions qui changent tous les jours. [pause] F8 regarde cette plomberie : les réserves des banques, le compte du Trésor, et les taux de financement au jour le jour. Et surtout, pourquoi aucun de ces chiffres n'est, à lui seul, un signal pour l'or.

## SCENE 02 — id: reserves
Commençons par les réserves bancaires. Ce sont les dépôts que les banques éligibles détiennent à la Réserve fédérale. Pour la Fed, c'est une dette. Pour la banque, c'est un actif. [pause] En simplifiant beaucoup, les réserves dépendent des actifs de la Fed, moins ses autres dettes. Les billets en circulation. Le compte du Trésor. Et les prises en pension inversées au jour le jour. [pause] C'est une lecture comptable, pas un modèle complet de cause à effet. Et la répartition compte. Des réserves abondantes au total ne garantissent pas que chaque banque, chaque type de garantie, ou chaque marché de financement soit à l'aise.

## SCENE 03 — id: tga-example
Exemple. Imaginons que les actifs de la Fed ne bougent pas, et que toutes ses dettes restent identiques... sauf le compte du Trésor, qui grimpe de 120 milliards de dollars. [pause] Que s'est-il passé ? Au moment des impôts, ou du règlement de nouvelles dettes, l'argent du Trésor quitte les dépôts bancaires pour rejoindre son compte à la Fed. [pause] Dans cette simplification, les réserves bancaires baissent donc d'environ 120 milliards. [pause] Le sens comptable est clair. Mais l'effet sur le prix des actifs, lui, ne l'est pas. Les autres dettes de la Fed, ses opérations, les anticipations, et le positionnement peuvent tout compenser.

## SCENE 04 — id: tga
Zoom sur le compte du Trésor, qu'on appelle le TGA. C'est le compte courant du Trésor américain, à la Fed. [pause] Les impôts et l'argent des émissions de dette le remplissent. Les dépenses publiques le vident. Quand le TGA se reconstitue, il peut retirer des réserves du système. Quand il se vide, il peut en ajouter. Toutes choses égales par ailleurs. [pause] Le rythme, la source du financement, et le lien avec les fonds monétaires et les prises en pension inversées décident de ce que les banques ressentent vraiment. [pause] Et pour l'or ? Un TGA plus haut ou plus bas n'est ni haussier, ni baissier en soi. Il compte seulement s'il change les conditions de financement, l'appétit pour le risque, les taux, ou le dollar.

## SCENE 05 — id: funding-rates
Passons aux taux au jour le jour. Ils montrent comment l'argent et les garanties s'échangent chaque nuit. [pause] Le SOFR, c'est un large taux de financement garanti, basé sur les opérations de pension adossées aux obligations d'État. L'EFFR résume les prêts entre banques au jour le jour, sans garantie. Et l'IORB, c'est le taux que la Fed paie sur les réserves. [pause] En comparant ces taux, on obtient des écarts, en points de base. SOFR moins IORB. EFFR moins IORB. Ce sont des outils de diagnostic. [pause] Mais attention. Les fins de trimestre, la rareté de certaines garanties, ou les dates de règlement peuvent créer des mouvements temporaires.

## SCENE 06 — id: spread-example
Exemple. Le SOFR est fixé à 5,37 pourcent. L'IORB est à 5,40 pourcent. [pause] SOFR moins IORB : moins 0,03 point de pourcentage. Soit moins 3 points de base. Rien d'anormal. [pause] Maintenant, un jour, l'écart saute à plus 12 points de base. Imaginons que Hachim voie ce chiffre et pense tout de suite à une crise de financement. [pause] Avant de conclure, il faut vérifier le calendrier. Une date de règlement ? Une fin de trimestre ? Un seul jour ne fait pas un stress persistant. [pause] Un écart de financement est un prix relatif de diagnostic. Pas une relation directe avec l'or.

## SCENE 07 — id: regimes
Comment lire F8, alors ? D'abord, regarde ensemble les variations des réserves et du TGA. Ensuite, examine les écarts de financement. [pause] Une pression qui dure, confirmée par le crédit ou la volatilité dans F7, n'a rien à voir avec un mouvement d'un jour lié au calendrier. [pause] Et pour l'or, exige un pont observé. Les taux réels. Le dollar. Les conditions de risque. Ou un désendettement forcé. Sans ce pont, F8 reste du contexte.

## SCENE 08 — id: mistakes
Les pièges à éviter. [pause] Piège un. Confondre le bilan de la Fed avec une liquidité immédiatement utilisable sur les marchés. [pause] Piège deux. Croire que toute baisse des réserves est un resserrement de même ampleur. [pause] Et piège trois. Voir un signal pour l'or dans un seul chiffre de plomberie, sans le relier aux taux, au dollar ou au risque.

## SCENE 09 — id: terminal-usage
Dans le terminal, maintenant. La façade de F8 met en avant deux variations. Celle des réserves sur une semaine. Et celle du TGA sur une journée. [pause] Juste en dessous, une ligne discrète : financement normal, ou anormal. Le terminal la calcule à partir de l'écart entre le SOFR et l'IORB. Tant que cet écart reste dans une zone de plus ou moins 5 points de base, c'est normal. Au-delà, c'est anormal. C'est un choix de présentation, pas un seuil financier officiel. [pause] En ouvrant le détail, tu trouves le niveau des réserves, le niveau du TGA, et les deux écarts : SOFR moins IORB, et EFFR moins IORB. Tout est contextuel. [pause] Les sources sont officielles. Les réserves viennent de la base de la Fed de Saint-Louis, avec le niveau du mercredi, pas une moyenne. Le TGA vient du relevé quotidien du Trésor lui-même. Et l'EFFR vient de la Fed de New York. [pause] Ensuite, le réflexe. F7 pour le stress. F9 pour les émissions de dette. F2 et F6 pour les taux et le dollar. Et l'or, seulement si le pont est là.

## SCENE 10 — id: glossary-flash
Le vocabulaire de F8, en rafale. [pause] Réserves. Les soldes des banques éligibles à la Réserve fédérale. [pause] TGA. Le compte courant du Trésor américain à la Fed. [pause] SOFR. Un large taux garanti au jour le jour, basé sur les pensions adossées aux obligations d'État. [pause] Et IORB. Le taux que la Fed paie sur les soldes de réserve.

## SCENE 11 — id: recap
Pour résumer F8. La liquidité est un système de bilans, pas un chiffre unique. [pause] Une pression de financement temporaire n'est pas une rareté persistante. [pause] Et F8 agit sur l'or indirectement, sous conditions, à travers les autres marchés. Alors ne devine jamais. Vérifie le pont.
