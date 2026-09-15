// Short-read length constraint (Patch 11). "About one sentence, max ~2
// visual lines" in a mini-KPI cell. The validator (validateInterpretation.ts)
// enforces this at runtime; mock fixture authors must also respect it by
// hand.
export const MAX_SHORT_READ_CHARS = 140;

// Structural concurrency placeholder (Patch 10). The exact value and model
// choice are a later benchmarking decision, not locked now — this constant
// only exists so a future real implementation doesn't fire dozens of
// simultaneous LLM calls by default.
export const MAX_CONCURRENT_LLM_CALLS = 2;
