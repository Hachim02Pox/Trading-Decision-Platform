# Pinned Brain contract

Source: Hachim02Pox/gold-market-story-brain at `da8eb64959b6c026128bde254c8d1703e419f19c`.

Schemas are byte-identical copies, also exposed in the repository schema directory. Semantic/render tools are ported without behavior changes; `.mjs` import suffixes become local TypeScript imports and `@ts-nocheck` preserves the audited JavaScript source. The API projection remains a separate explicit field allowlist.

The validator enforces the complete canonical schema, economic gate parity, dated sources, clock order, scenario graph, canonical families/questions, learning graph/references and exact Markdown/hash. Ingestion supplies the parent for parent-dependent checks after its lookup. Unknown learning versions keep canonical validation and an explicit unsupported state; their extension is never decoded as 1.0. No stored document is rewritten.

Original source SHA-256 hashes:

- `schema/gold_editorial.schema.json`: `4cdb03150f608ca9927e7b526e7fe2e554f35e4b582e9c983e5dd4282ef3abf3`
- `schema/gold_learning_experience.schema.json`: `d7ed426cdc1453f1c83fc0d52204acce3bdef6c9a1ab52604a0068c1fb399340`
- `tools/editorial.mjs`: `38184da072e6a406c4f657794e0ac3887f45d044fb9a3323cf6c3af2229d00a3`
- `tools/learning-experience.mjs`: `5f7c7110cb4bc9cff1226fd2c99a1b96d9c060a54a84a4b3a208c5ab70c1066a`
- `tools/weekly-cycle.mjs`: `ab00ed0bc8be4aa1ef90f255b97015e6cf9b6d7eb6279012547162b706735eab`
- `tools/family-readout.mjs`: `79145d5e0fdbe856361aa87b4bda8431b9e7773a2337251dc73cfaae527f760e`
- `tools/procedural-audit.mjs`: `0a33bd1e64f0f3d74a9a3b2c5a6ea6abd4d0cbcb6f44e7ce9b8ffe3262cc85b0`
