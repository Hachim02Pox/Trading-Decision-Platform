import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  createFixtureFinalRead,
  SUNDAY_JOBS,
  type EvidenceDocument,
  type FinalRead,
  type SundayJob,
  validateEvidenceDocument,
  validateFinalRead,
} from "./schema";
import { normalizeSources } from "./provenance";

// This module is also loaded by the backend workspace, whose cwd is apps/backend.
// Anchor paths to the repository rather than the invoking npm workspace.
const PROJECT_ROOT = resolve(__dirname, "../../../../");
export const ROOT = resolve(PROJECT_ROOT, "gold-sunday-read");
const specs = [
  "GOLD_SUNDAY_READ_COLLECTION_EVIDENCE_SPEC.md",
  "GOLD_MACRO_REASONING_MANUAL_SUNDAY.md",
  "GOLD_SUNDAY_READ_OUTPUT_SPEC.md",
];
const dateId = (input?: string) =>
  (input ?? new Date().toISOString().slice(0, 10)).replace(/[^0-9-]/g, "");
export const runDir = (date?: string) => join(ROOT, "runs", dateId(date));
const json = async <T>(file: string): Promise<T> =>
  JSON.parse(await readFile(file, "utf8")) as T;
const save = async (file: string, value: unknown) => {
  await mkdir(resolve(file, ".."), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};
export async function loadFinalRead(date?: string): Promise<FinalRead | null> {
  const file = join(runDir(date), "final", "sunday_read.json");
  return existsSync(file) ? json<FinalRead>(file) : null;
}
export async function setupFixture(date?: string) {
  const dir = runDir(date);
  const read = createFixtureFinalRead();
  read.meta.run_id = `fixture-${dateId(date)}`;
  read.meta.week_of = dateId(date);
  await save(join(dir, "final", "sunday_read.json"), read);
  for (const job of SUNDAY_JOBS) {
    const document: EvidenceDocument = {
      job,
      status: "PARTIAL",
      evidence: read.evidence.map((item) => ({
        ...item,
        family: job,
        id: `${job}-fixture`,
      })),
      sources: read.sources,
    };
    await save(join(dir, "evidence", `${job}.json`), document);
    await writeFile(
      join(dir, "evidence", `${job}.md`),
      `# ${job}\n\nDEMO / FIXTURE ONLY.\n\n${document.evidence[0]?.statement}\n`,
      "utf8",
    );
  }
  await save(join(dir, "manifest.json"), {
    run_id: read.meta.run_id,
    started_at: read.meta.generated_at,
    data_mode: "FIXTURE",
    status: "PARTIAL",
    jobs: Object.fromEntries(
      SUNDAY_JOBS.map((job) => [
        job,
        {
          status: "PARTIAL",
          provider: "fixture",
          output_path: `evidence/${job}.json`,
        },
      ]),
    ),
  });
  return dir;
}
function extractContent(raw: Record<string, unknown>): string {
  const choice = Array.isArray(raw.choices)
    ? (raw.choices[0] as Record<string, unknown>)
    : undefined;
  const message = choice?.message as Record<string, unknown> | undefined;
  const content = message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content))
    return content
      .map((part) =>
        isRecord(part) && typeof part.text === "string" ? part.text : "",
      )
      .join("\n");
  return "";
}
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
export function evidencePrompt(job: SundayJob, date: string) {
  if (job === "family_1_fed") {
    return `You are Family 1 — Fed & Rate Pricing for a Gold Sunday Read ending ${date}. This is collection only: do NOT write a Gold market story, directional Gold conclusion, trading advice, or Gold target. Return only independently sourced, dated evidence.\n\nResearch these required areas using the last available trading session and approximately five trading sessions — never a naive calendar 24-hour comparison:\n1. NEXT FOMC PRICING: identify the actual next FOMC meeting date, its current market-implied outcome/probabilities when available, the change since the prior available session, the approximately five-session dynamic, and material repricings around named events. State dovish/hawkish/stable only when the evidence supports it. Never invent FedWatch or use pricing for the wrong meeting.\n2. US 2-YEAR TREASURY YIELD: current level, direction, approximately five-session dynamic, and any reversal/stabilization. Explicitly label it as a yield, never a bond price.\n3. RECENT MATERIAL FED COMMUNICATION: preserve what a Fed official actually said, the date, and distinguish it from a reported market reaction or repricing.\n4. NEXT FOMC CATALYSTS: facts/events still capable of changing expectations.\n\nFor every material fact preserve AS-OF / measurement window, source URL and source metadata when available. Article attribution must be REPORTED_LINK, never proven causality. Do not treat syndicated copies as independent confirmation. Missing facts must be UNKNOWN or PARTIAL; never fabricate a metric or URL.\n\nReturn ONLY valid JSON in exactly this shape: {"evidence":[{"id":"...","family":"family_1_fed","owner":"research","statement":"...","value":null,"unit":null,"as_of":null,"measurement_window":null,"status":"ANSWERED|PARTIAL|UNKNOWN","type":"EVENT_FACT|STATE|REPORTED_LINK","epistemic_status":"OBSERVED|DECLARED|PUBLISHED|ESTIMATED|INFERRED|CALCULATED|QUALITATIVE|UNKNOWN","change_status":"...","source_refs":["s1"],"reported_link_type":"REACTION_TO_EVENT|ANTICIPATION_AHEAD_OF_EVENT|OTHER|UNCLEAR","notes":"..."}],"sources":[{"source_id":"s1","title":"...","publisher":null,"author":null,"published_at":null,"url":"https://...","ultimate_origin":null,"syndication_notes":null,"retrieved_at":"${new Date().toISOString()}","provider":"puter/perplexity"}]}.`;
  }
  return `You are research job ${job} for a Gold Sunday Read ending ${date}. Collect only this independent evidence area; do NOT write a final gold market story, directional conclusion, or trading advice. Follow the local Collection Evidence Spec: facts missing from sources must be UNKNOWN, reported attribution is REPORTED_LINK rather than causal proof, retain AS-OF dates and source URLs. Return ONLY JSON: {"evidence":[{"id":"...","family":"${job}","owner":"research","statement":"...","value":null,"unit":null,"as_of":null,"measurement_window":null,"status":"ANSWERED|PARTIAL|UNKNOWN","type":"EVENT_FACT|STATE|REPORTED_LINK","epistemic_status":"OBSERVED|DECLARED|PUBLISHED|ESTIMATED|INFERRED|CALCULATED|QUALITATIVE|UNKNOWN","change_status":"...","source_refs":["s1"],"reported_link_type":"REACTION_TO_EVENT|ANTICIPATION_AHEAD_OF_EVENT|OTHER|UNCLEAR","notes":"..."}],"sources":[{"source_id":"s1","title":"...","publisher":null,"author":null,"published_at":null,"url":"https://...","ultimate_origin":null,"syndication_notes":null,"retrieved_at":"${new Date().toISOString()}","provider":"puter/perplexity"}]}.`;
}

export async function saveBrowserEvidence(
  date: string,
  content: string,
  raw: unknown,
) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Invalid run date.");
  if (content.length > 1_000_000)
    throw new Error("Research response exceeds the local safety limit.");
  const payload = JSON.parse(
    content.replace(/^```json\s*|\s*```$/g, ""),
  ) as Record<string, unknown>;
  const document: EvidenceDocument = {
    job: "family_1_fed",
    status: "SUCCEEDED",
    evidence: Array.isArray(payload.evidence)
      ? (payload.evidence as EvidenceDocument["evidence"])
      : [],
    sources: normalizeSources(
      Array.isArray(payload.sources)
        ? (payload.sources as EvidenceDocument["sources"])
        : [],
    ),
    provider_metadata: {
      model: "perplexity/sonar-deep-research",
      transport: "puter.js/browser",
    },
  };
  const errors = validateEvidenceDocument(document);
  if (errors.length) throw new Error(errors.join(" "));
  const dir = runDir(date);
  await mkdir(join(dir, "raw"), { recursive: true });
  await save(join(dir, "raw", "family_1_fed.browser.json"), raw);
  await save(join(dir, "evidence", "family_1_fed.json"), document);
  await writeFile(
    join(dir, "evidence", "family_1_fed.md"),
    `# family_1_fed\n\n${document.evidence.map((item) => `- ${item.statement}`).join("\n")}\n`,
    "utf8",
  );
  return {
    source_count: document.sources.length,
    evidence_count: document.evidence.length,
  };
}
export async function research(date?: string, selected?: SundayJob) {
  const id = dateId(date);
  const dir = runDir(id);
  await mkdir(join(dir, "raw"), { recursive: true });
  const token = process.env.PUTER_AUTH_TOKEN;
  if (!token)
    throw new Error(
      "PUTER_AUTH_TOKEN is not configured. Create a Puter auth token in its dashboard; no Perplexity API key is required. Use sunday:fixture for an end-to-end test.",
    );
  const jobs = selected ? [selected] : [...SUNDAY_JOBS];
  const manifest = existsSync(join(dir, "manifest.json"))
    ? await json<Record<string, unknown>>(join(dir, "manifest.json"))
    : {
        run_id: id,
        started_at: new Date().toISOString(),
        data_mode: "REAL",
        jobs: {},
      };
  const jobStates = isRecord(manifest.jobs) ? manifest.jobs : {};
  for (const job of jobs) {
    const started = Date.now();
    try {
      const response = await fetch(
        process.env.PUTER_BASE_URL ||
          "https://api.puter.com/puterai/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model:
              process.env.PERPLEXITY_RESEARCH_MODEL ||
              "perplexity/sonar-deep-research",
            messages: [{ role: "user", content: evidencePrompt(job, id) }],
          }),
        },
      );
      const rawText = await response.text();
      if (!response.ok)
        throw new Error(`Puter request failed (${response.status}).`);
      const raw = JSON.parse(rawText) as Record<string, unknown>;
      await writeFile(
        join(dir, "raw", `${job}.json`),
        `${JSON.stringify(raw, null, 2)}\n`,
      );
      const content = extractContent(raw);
      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(
          content.replace(/^```json\s*|\s*```$/g, ""),
        ) as Record<string, unknown>;
      } catch {
        throw new Error(
          "Provider returned non-JSON evidence; raw response was preserved.",
        );
      }
      const document: EvidenceDocument = {
        job,
        status: "SUCCEEDED",
        evidence: Array.isArray(payload.evidence)
          ? (payload.evidence as EvidenceDocument["evidence"])
          : [],
        sources: normalizeSources(
          Array.isArray(payload.sources)
            ? (payload.sources as EvidenceDocument["sources"])
            : [],
        ),
        provider_metadata: {
          model:
            process.env.PERPLEXITY_RESEARCH_MODEL ||
            "perplexity/sonar-deep-research",
          response_id: raw.id ?? null,
        },
      };
      const errors = validateEvidenceDocument(document);
      if (errors.length) throw new Error(errors.join(" "));
      await save(join(dir, "evidence", `${job}.json`), document);
      await writeFile(
        join(dir, "evidence", `${job}.md`),
        `# ${job}\n\n${document.evidence.map((item) => `- ${item.statement}`).join("\n")}\n`,
        "utf8",
      );
      jobStates[job] = {
        status: "SUCCEEDED",
        provider: "puter/perplexity",
        duration_ms: Date.now() - started,
        output_path: `evidence/${job}.json`,
        source_count: document.sources.length,
      };
    } catch (error) {
      jobStates[job] = {
        status: "FAILED",
        provider: "puter/perplexity",
        duration_ms: Date.now() - started,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
  await save(join(dir, "manifest.json"), {
    ...manifest,
    updated_at: new Date().toISOString(),
    jobs: jobStates,
  });
  return dir;
}
export async function bundle(date?: string) {
  const dir = runDir(date);
  const docs: EvidenceDocument[] = [];
  for (const job of SUNDAY_JOBS) {
    const file = join(dir, "evidence", `${job}.json`);
    if (existsSync(file)) docs.push(await json<EvidenceDocument>(file));
  }
  const evidence = docs.flatMap((doc) => doc.evidence);
  const sources = normalizeSources(docs.flatMap((doc) => doc.sources));
  const reasoning = join(dir, "reasoning");
  await save(join(reasoning, "evidence_bundle.json"), {
    evidence,
    sources,
    documents: docs.map((doc) => ({ job: doc.job, status: doc.status })),
  });
  await writeFile(
    join(reasoning, "evidence_bundle.md"),
    `# Evidence bundle\n\n${evidence.map((item) => `- [${item.family}] ${item.statement} (${item.status})`).join("\n")}\n`,
    "utf8",
  );
  await save(join(reasoning, "final_output.schema.json"), {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "Gold Sunday Read",
    type: "object",
    required: [
      "meta",
      "executive_narrative",
      "contexts",
      "priced_in",
      "scenario_tree",
      "scenario_explanations",
      "asymmetry",
      "catalysts",
      "invalidations",
      "contradictions",
      "anomalies",
      "unknowns",
      "weekly_timeline",
      "evidence",
      "sources",
    ],
  });
  await writeFile(
    join(reasoning, "ASTRA_PROMPT.md"),
    `# Gold Sunday Read — Astra task\n\nRead ../../../../docs/GOLD_MACRO_REASONING_MANUAL_SUNDAY.md, ../../../../docs/GOLD_SUNDAY_READ_OUTPUT_SPEC.md, and evidence_bundle.json. Produce only JSON matching final_output.schema.json. Preserve evidence/source IDs. Never invent facts, causality, citations, numeric scores, or probabilities. Use MIXED, UNKNOWN and NO_EDGE when warranted. Build one consolidated scenario tree with a shared trunk where evidence allows; every BULLISH/BEARISH terminal must follow an ASYMMETRY_GATE. Include narrative, horizons, priced-in vs surprise, catalysts, invalidations, contradictions, anomalies, unknowns, timeline, evidence and sources.\n`,
    "utf8",
  );
  await writeFile(
    join(reasoning, "README_RUN_ASTRA.md"),
    `# Manual Astra workflow\n\n1. Give Astra the files in this directory plus the two specs in docs/.\n2. Save its JSON-only response as ../final/sunday_read.json.\n3. Run: npm run sunday:validate -- --date ${dateId(date)}\n4. Open /sunday-read?date=${dateId(date)}.\n\nOptional local command: configure ASTRA_CLI_CMD yourself; this project deliberately does not assume a CLI name or execute shell templates.\n`,
    "utf8",
  );
  return reasoning;
}
export async function validate(date?: string) {
  const file = join(runDir(date), "final", "sunday_read.json");
  if (!existsSync(file)) return ["Final file not found: " + file];
  return validateFinalRead(await json<unknown>(file));
}
export async function doctor() {
  return {
    specs: specs.map((name) => ({
      name,
      exists: existsSync(resolve(PROJECT_ROOT, "docs", name)),
    })),
    puter_token: Boolean(process.env.PUTER_AUTH_TOKEN),
    base_url:
      process.env.PUTER_BASE_URL ||
      "https://api.puter.com/puterai/openai/v1/chat/completions",
    model:
      process.env.PERPLEXITY_RESEARCH_MODEL || "perplexity/sonar-deep-research",
    writable_root: ROOT,
    astra_cli_configured: Boolean(process.env.ASTRA_CLI_CMD),
  };
}
