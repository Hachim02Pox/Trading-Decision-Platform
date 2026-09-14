import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createGroqLlmProvider } from "../apps/backend/src/intelligence/cloud/groqLlmProvider";
import { createTavilySearchProvider } from "../apps/backend/src/intelligence/cloud/tavilySearchProvider";

const args = process.argv.slice(2);
const date = args.includes("--date")
  ? args[args.indexOf("--date") + 1]
  : new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Use --date YYYY-MM-DD");
const root = resolve(__dirname, "../night-recaps", date);

async function main() {
  const search = createTavilySearchProvider();
  const llm = createGroqLlmProvider("night");
  if (!search || !llm)
    throw new Error("GROQ_API_KEY and TAVILY_API_KEY must both be configured.");
  const queries = [
    "overnight gold XAUUSD Asia session",
    "Japan China overnight markets monetary policy",
    "global overnight macro geopolitical news gold",
  ];
  let providerLimited = false;
  const all = (
    await Promise.all(
      queries.map((query) =>
        search.search(query, 3).catch((error) => {
          providerLimited ||=
            error instanceof Error && error.message.includes("432");
          console.warn(
            `search partial: ${error instanceof Error ? error.message : "unknown"}`,
          );
          return [];
        }),
      ),
    )
  ).flat();
  const unique = [...new Map(all.map((item) => [item.url, item])).values()];
  await mkdir(root, { recursive: true });
  await writeFile(join(root, "sources.json"), JSON.stringify(unique, null, 2));
  if (unique.length === 0) {
    await writeFile(
      join(root, "night_recap.json"),
      JSON.stringify(
        {
          status: "PARTIAL",
          reason: providerLimited ? "PROVIDER_LIMIT" : "NO_SEARCH_RESULTS",
          as_of: new Date().toISOString(),
          sources: [],
        },
        null,
        2,
      ),
    );
    console.log(join(root, "night_recap.json"));
    return;
  }
  const prompt = `Produce ONLY JSON in French. This is a non-decision Night Recap, never BUY/SELL, a price target, Market Story, or scenario tree. Separate reported attribution from known facts. Include headline, price_action, japan, china, asia, europe_if_relevant, global_macro, geopolitics, important_events, reported_attributions, uncertainties, watch_next, sources. Input articles: ${JSON.stringify(unique)}`;
  const recap = await llm.completeJson(prompt);
  await writeFile(
    join(root, "night_recap.json"),
    JSON.stringify(
      {
        status: providerLimited ? "PARTIAL" : "OK",
        as_of: new Date().toISOString(),
        window_end: new Date().toISOString(),
        provider: llm.id,
        model: llm.model,
        recap,
      },
      null,
      2,
    ),
  );
  console.log(join(root, "night_recap.json"));
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
