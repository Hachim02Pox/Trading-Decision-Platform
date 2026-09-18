# F2 — Taux : le moteur du coût d'opportunité (v3, redo 2026-09-17b)
## Narration française — Hachim comme personnage de l'exemple, pauses naturelles

Chaque bloc `## SCENE` ci-dessous est lu comme un fichier audio indépendant par
edge-tts, puis synchronisé image par image dans Remotion. Les points de
suspension et virgules marquent des pauses naturelles voulues — ne pas les
retirer en nettoyant le texte.

## SCENE 01 — id: intro
Pourquoi les taux d'intérêt font bouger le prix de l'or ? Imaginons... Hachim a 1000 dollars. Il a deux choix. Il peut les mettre à la banque, et toucher un intérêt garanti, chaque année. Ou il peut acheter de l'or, qui ne lui donne jamais rien, mais qui protège sa valeur dans le temps. Quand la banque paie beaucoup pour son argent, l'or devient moins intéressant, pour Hachim, en comparaison. Quand elle paie peu, l'or redevient attirant. Et en dézoomant... c'est exactement ce calcul que les grandes institutions font, à bien plus grande échelle, chaque jour. C'est ça, le moteur de F2.

## SCENE 02 — id: real-rate
Sauf qu'il y a un piège. Le taux affiché par la banque, ce n'est pas le vrai gain. Si la banque paie 4 % par année, mais que les prix augmentent de 3 % à cause de l'inflation, le vrai gain, lui, n'est que de 1 %. Et c'est ce 1 %, le vrai gain, qui compte pour l'or. Un taux affiché élevé, avec une inflation élevée, peut laisser un tout petit vrai gain. Un taux affiché plus bas, mais avec une inflation encore plus basse, peut au final payer davantage, en vrai. C'est le vrai gain qui décide, jamais le chiffre affiché tout seul.

## SCENE 03 — id: trap-example
Voici l'erreur que presque tout le monde fait. Voir le taux affiché baisser, et dire tout de suite : l'or va monter. Exemple. Le taux affiché passe de 4,20 % à 4,00 %. Cas un : l'inflation attendue reste pareille. Le vrai gain baisse aussi, et l'or devient plus attirant. Logique. Cas deux : l'inflation attendue baisse encore plus que le taux affiché. Le vrai gain, lui, peut en fait augmenter, et l'or devient moins attirant, même si le taux affiché a baissé. Même mouvement, deux résultats opposés. La seule façon de savoir : toujours comparer le taux affiché à l'inflation attendue, jamais l'un sans l'autre.

## SCENE 04 — id: terminal-usage
Dans le terminal, F2 montre le taux à 2 ans, le taux à 10 ans, et l'écart entre les deux. Pour savoir si c'est vraiment bon ou mauvais pour l'or, ouvre le détail. C'est là que tu vois le vrai gain à 10 ans, une fois l'inflation attendue retirée. C'est ce chiffre-là qui a le lien le plus direct avec l'or. Le reste, c'est du contexte.

## SCENE 05 — id: recap
Pour résumer. L'or n'offre jamais de rendement, donc il devient plus ou moins attirant selon ce que rapporte l'argent ailleurs, une fois l'inflation retirée. Ne réagis jamais à un taux affiché tout seul. Demande toujours ce qu'il donne, une fois l'inflation attendue soustraite. C'est ce calcul, exactement, qu'il faut refaire à chaque fois qu'un taux bouge.
