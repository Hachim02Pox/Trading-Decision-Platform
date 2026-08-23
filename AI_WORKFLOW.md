# AI WORKFLOW — trading-decision-platform

## Source of truth
- Never invent business rules, market definitions, formulas, providers, or UI semantics.
- Existing product specifications and locked decisions are authoritative.
- If a requirement is ambiguous or not yet locked, stop and ask rather than silently deciding.
- Do not silently replace one data source, methodology, convention, or fallback with another.

## Before changing code
1. Read the relevant project documentation.
2. Inspect the existing implementation and patterns.
3. Check `git status`.
4. Preserve unrelated user and agent changes.
5. For non-trivial work, state the plan before implementation.

## UI / frontend
- `DESIGN.md` is the authoritative visual design system.
- `DESIGN_REFERENCE_LINEAR.md` is inspiration only, never the product specification.
- Use installed design skills when relevant.
- Never replace the financial-terminal design with a generic SaaS dashboard.
- Never use decorative color where color has semantic meaning.
- For visual work, use browser inspection / Playwright when useful.
- Audit substantial UI work against the installed web-design-guidelines skill.

## Engineering
- Prefer existing project patterns over introducing new abstractions.
- Keep changes scoped to the requested task.
- Do not over-engineer.
- Never hardcode secrets.
- Validate external data.
- Make failure, stale-data, unavailable-data, and fallback behavior explicit.
- Run the relevant tests / type checks / lint / build checks after modifications.
- Never claim success when verification failed.

## Claude Code + Codex collaboration
- Do not have Claude Code and Codex edit the same files concurrently.
- One agent implements; the other may review afterward.
- Before editing, inspect git status and existing diffs.
- Never overwrite another agent's uncommitted work.
- Reviews should identify concrete issues rather than rewriting working code for style preference.
- For important architectural decisions, present trade-offs before making irreversible changes.
- Commit boundaries should remain small and understandable.

## Business logic
- Business/domain logic comes before provider convenience.
- A provider must adapt to the canonical requirement; never redefine the requirement because an API exposes something differently.
- Facts, deterministic calculations, estimates/models, and AI interpretations must remain distinguishable.
- No hidden fallback.
- No invented market causality.
- No directional BUY/SELL conclusion unless explicitly required by the product specification.

## Documentation
- Keep persistent agent instruction files concise.
- Put detailed specifications in dedicated docs rather than bloating AGENTS.md or CLAUDE.md.
- Update documentation when an implementation changes an agreed contract.
