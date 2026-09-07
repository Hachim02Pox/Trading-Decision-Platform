// Cost-conscious model tier selection for the real-intelligence PILOT
// (docs/KPI_INTELLIGENCE_ARCHITECTURE.md — "Real intelligence pilot"
// section). This is explicitly a cost-conscious pilot, not a quality
// benchmark: every id below is that provider's smallest/cheapest
// currently-available tier suitable for structured JSON output, verified
// live against each provider's real account (models.list()) at the time
// this pilot was activated — not guessed from training-data recall of
// possibly-retired model names.
//
// Model choice here is a later benchmarking decision to revisit, not
// locked — swapping an id below is a values-only change; nothing else in
// the real-intelligence pipeline needs to change to pick a different tier.
export const OPENAI_PILOT_MODEL = "gpt-5-nano";
export const ANTHROPIC_PILOT_MODEL = "claude-haiku-4-5-20251001";
export const GEMINI_PILOT_MODEL = "gemini-2.5-flash";
