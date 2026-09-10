import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent `next dev`/`next build` from writing AGENTS.md/CLAUDE.md into
  // apps/frontend — this repo already has authoritative root-level
  // CLAUDE.md/AGENTS.md files that must not be shadowed or duplicated.
  agentRules: false,
  // Dev-only floating "N" build-activity indicator — not part of this
  // product's brand, never shown in production builds anyway, but
  // distracting/confusable with a logo during local dev. Off entirely.
  devIndicators: false,
};

export default nextConfig;
