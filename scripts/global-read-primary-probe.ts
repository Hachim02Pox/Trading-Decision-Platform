import { getMarketSnapshot } from "../apps/backend/src/cache/snapshotCache";
import { canonicalFacts } from "../apps/backend/src/intelligence/globalRead/snapshot";
import { verifyPrimaryFacts } from "../apps/backend/src/intelligence/globalRead/primaryData";
import { closePool } from "../apps/backend/src/db/pool";

async function main() {
  const started = performance.now();
  const snapshot = await getMarketSnapshot("EN");
  const facts = canonicalFacts(snapshot.families);
  const verificationStarted = performance.now();
  const admissions = await verifyPrimaryFacts(facts, facts.map((fact) => fact.ref));
  console.log(JSON.stringify({
    facts: facts.length,
    statuses: Object.fromEntries([...new Set(admissions.map((item) => item.status))].map((status) => [status, admissions.filter((item) => item.status === status).length])),
    admittedRefs: admissions.filter((item) => item.selected !== null).map((item) => item.ref),
    snapshotMs: Math.round(verificationStarted - started),
    verificationMs: Math.round(performance.now() - verificationStarted),
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Global Read primary probe failed");
  process.exitCode = 1;
}).finally(closePool);
