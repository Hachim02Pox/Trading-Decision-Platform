# Gold editorial v6 integration

> Superseded integration status: the pinned Brain learning contract, complete validation, public projection and Control seal checks are now implemented. See [HT Terminal integration and verification](HT_MARKET_STORY_LEARNING_INTEGRATION.md). The historical review below describes the earlier implementation; it is not the current implementation status. Live enriched ingestion remains unverified.

> État après revue de df1a180 : intégration partielle. Le validateur ne vérifie pas encore le schéma et toutes les règles Brain ; les reçus Control ne conditionnent pas la publication ; la projection API et le lecteur restent incomplets. La CI du commit est en échec. Voir [la revue et la consigne de clôture](GOLD_V6_DF1A180_REVIEW_AND_NEXT_STEPS.md) avant tout refresh ou reprise du dispatcher. Les descriptions ci-dessous indiquent l’intention de la première implémentation, pas une preuve de conformité complète.

The market-state ingestion path accepts v6 only when the root discriminator is
`document_type: GOLD_MARKET_STATE`, `format_version: "6.0"`, and
`frontend_eligible: true`. Legacy V1–V5 documents retain their separate
validator and reader path; v6 documents are never coerced into that shape.

The backend stores the original v6 JSON audit payload but the public reader
uses an explicit allow-list projection. It never renders audit references,
source URLs, raw JSON, or technical identifiers. The v6 reader supports the
full Sunday and intermediate views, including the six judgments, the decision
panel, evolution review, scenario graph, family questions and chronology.

`NEXT_GOLD_RECAP.json` defaults to stable ID
`1vjvIgPV7umsbaCiuUdyxu6R980zg_dsU`; a Railway value must be updated
explicitly because it overrides this default. V6 canonical seals use the exact
recursive serializer from Brain. Transport hashes remain raw-byte SHA-256.

Ingestion revalidates a previously rejected byte-identical document after a
validator upgrade and processes candidates parent-first inside one Drive poll.
The Drive client reads Output plus scoped Control receipts and exact archived
handoff snapshots. Backend identity grants and a real sealed-run end-to-end
refresh remain operational verification steps; missing seals fail closed.
