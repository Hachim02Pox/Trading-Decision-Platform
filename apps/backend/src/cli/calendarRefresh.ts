import { runF13CalendarIngestion } from "../jobs/f13CalendarIngestion";

async function main(): Promise<void> {
  const result = await runF13CalendarIngestion({ force: true });
  console.log(`CALENDAR_REFRESH: ${result.ran ? "RAN" : "SKIPPED"}`);
  console.log(`RESULT: ${result.reason}`);
  process.exitCode = result.ran && result.upserted > 0 ? 0 : 1;
}

main().catch((error) => {
  console.error("CALENDAR_REFRESH: FAILED");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
