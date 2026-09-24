# F9 — Storyboard vidéo pédagogique (v4, refonte complète 2026-09-23)

Même pipeline que F5-F8 : voix Henri phrase par phrase, animations calées sur les mots exacts, tout
le chapitre Knowledge F9 couvert. Source : `script/f9-narration.fr.md`. 1920×1080, 30 fps, ~6 min 26
(11 scènes). L'ancienne version v3 est archivée dans `_old-v3/`.
Accessoires propres à F9 : `src/scenes/props9.tsx` (marteau d'adjudication, échelle des maturités,
pile de rendement avec prime de terme, bordereau).

| # | Scène | Couvre (chapitre F9) |
|---|---|---|
| 01 | `intro` | « Trop de dette, l'or va monter » : la phrase à décortiquer |
| 02 | `issuance` | Emprunt net vs émissions brutes (recettes, dépenses, remboursements, solde du TGA) |
| 03 | `duration` | Titres courts vs longs, risque de durée, demande qui ne suit pas |
| 04 | `auctions` | L'adjudication : taux haut vs taux de marché juste avant, ratio de couverture, enchérisseurs indirects / directs / teneurs de marché |
| 05 | `tail-example` | 10 ans : marché 4,280 %, adjudication 4,305 % → écart de 2,5 pb |
| 06 | `term-premium` | Taux long = taux courts attendus + prime de terme (estimée par un modèle, jamais observée) |
| 07 | `gold-transmission` | Deux scénarios : taux réels ↑ + dollar ferme (défavorable) vs confiance dans la dette qui s'effrite + dollar ↓ (réaction différente) |
| 08 | `mistakes` | 3 pièges : déficit ≠ émissions brutes ≠ adjudication ratée ; prime estimée ≠ prix ; un seul chiffre |
| 09 | `terminal-usage` | Façade F9 (voir faits ci-dessous) |
| 10 | `glossary-flash` | Écart de fin d'adjudication, ratio de couverture, prime de terme |
| 11 | `recap` | Séparer emprunt net / brut / durées ; décomposer le mouvement des taux avant de relier à l'or |

## Faits du terminal vérifiés dans le code

- Famille événementielle : la façade affiche les « Prochains événements » (Next 2Y / 5Y / 10Y / 20Y / 30Y /
  TIPS Auction, « dans X j »), pas de chiffres.
- Détail : Net Marketable Borrowing, Borrowing Est. Revision vs Prior (QRA du Trésor), High Yield,
  Bid-to-Cover, Indirect Bidder Share (dernière adjudication 10 ans terminée). Pas d'écart de fin
  d'adjudication ni de prime de terme affichés. Tout Contextuel.

## Rendu

`python tools/remotion/render_after.py f8 f9 f9-tresor-budget` (enchaîné après F8), →
`apps/frontend/public/videos/f9-tresor-budget.mp4`.
