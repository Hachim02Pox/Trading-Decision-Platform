import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent `next dev`/`next build` from writing AGENTS.md/CLAUDE.md into
  // apps/frontend — this repo already has authoritative root-level
  // CLAUDE.md/AGENTS.md files that must not be shadowed or duplicated.
  agentRules: false,
};

export default nextConfig;
