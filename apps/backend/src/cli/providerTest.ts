import { findProvider, PROVIDER_REGISTRY } from "../providers/registry";
import type { SmokeTestResult } from "../providers/types";

// Milestone 2A — `npm run provider:test -- <id>` smoke-test CLI. Prints in
// a fixed, safe format — NEVER the raw key/token anywhere. See
// docs/PROVIDER_SETUP.md for the full command list and what a PASS looks
// like for each provider.

function printUsageAndExit(): never {
  const ids = PROVIDER_REGISTRY.map((p) => p.id).join(", ");
  console.log(`Usage: npm run provider:test -- <providerId>\nKnown provider ids: ${ids}`);
  process.exit(1);
}

function printResult(displayName: string, configured: boolean, result: SmokeTestResult): void {
  console.log(`PROVIDER: ${displayName}`);
  console.log(`CONFIGURED: ${configured ? "YES" : "NO"}`);
  console.log(`AUTH: ${result.auth}`);
  console.log(`REQUEST: ${result.request}`);
  for (const capability of result.capabilities) {
    console.log(`CAPABILITY: ${capability.label} — ${capability.result}`);
  }
  console.log(`SAMPLE VALUE: ${result.sampleValue ?? "(none)"}`);
  console.log(`LATENCY: ${result.latencyMs !== null ? `${result.latencyMs}ms` : "N/A"}`);
  console.log(`RESULT: ${result.result}`);
  if (result.result !== "PASS" && result.safeReason) {
    console.log(`SAFE REASON: ${result.safeReason}`);
  }
}

async function main(): Promise<void> {
  const providerId = process.argv[2];
  if (!providerId) printUsageAndExit();

  const provider = findProvider(providerId);
  if (!provider) {
    console.log(`Unknown provider id "${providerId}".`);
    printUsageAndExit();
  }

  const configured = provider.isConfigured();
  try {
    const result = await provider.runSmokeTest();
    printResult(provider.displayName, configured, result);
    process.exit(result.result === "PASS" || result.result === "NOT_CONFIGURED" ? 0 : 1);
  } catch (err) {
    // A provider adapter throwing is itself a bug (every adapter should
    // try/catch internally) — but the CLI must never crash uninformatively
    // or print a stack trace that could contain request internals.
    console.log(`PROVIDER: ${provider.displayName}`);
    console.log(`CONFIGURED: ${configured ? "YES" : "NO"}`);
    console.log("AUTH: FAIL");
    console.log("REQUEST: FAIL");
    console.log("CAPABILITY: N/A");
    console.log("SAMPLE VALUE: (none)");
    console.log("LATENCY: N/A");
    console.log("RESULT: FAIL");
    console.log("SAFE REASON: unexpected adapter error");
    process.exit(1);
  }
}

main();
