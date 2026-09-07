import { lookup } from "node:dns/promises";
import { isIPv4 } from "node:net";
import { request } from "node:https";
import { createHash } from "node:crypto";
import type { GlobalReadDecision, GlobalReadWebCandidate } from "@gold-terminal/contracts/dist/globalRead";

const HOSTS = new Set(["www.federalreserve.gov", "www.bls.gov", "www.bea.gov", "home.treasury.gov", "www.cftc.gov", "publicreporting.cftc.gov", "www.spdrgoldshares.com", "api.spdrgoldshares.com", "www.cmegroup.com"]);
const MAX_BYTES = 2_000_000;
const DNS_TIMEOUT_MS = 3_000;

async function lookupWithTimeout(hostname: string) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      lookup(hostname, { all: true, family: 4 }),
      new Promise<never>((_resolve, reject) => { timer = setTimeout(() => reject(new Error("DNS_TIMEOUT")), DNS_TIMEOUT_MS); }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function validateEvidenceUrl(raw: string): URL {
  if (raw.length > 2048) throw new Error("URL_TOO_LONG");
  const url = new URL(raw);
  if (url.protocol !== "https:" || url.username || url.password || url.port || !HOSTS.has(url.hostname)) throw new Error("URL_NOT_ALLOWED");
  return url;
}

export function isPublicIpv4(address: string): boolean {
  if (!isIPv4(address)) return false;
  const [a, b, c] = address.split(".").map(Number);
  return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 168 || b === 0)) ||
    (a === 100 && b >= 64 && b <= 127) || (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113));
}

/** Reject redirects entirely; pin the validated DNS result to prevent rebinding between check and connect. */
export async function fetchEvidencePage(raw: string): Promise<string> {
  const url = validateEvidenceUrl(raw);
  const addresses = await lookupWithTimeout(url.hostname);
  if (!addresses.length || addresses.some((a) => !isPublicIpv4(a.address))) throw new Error("DNS_NOT_PUBLIC");
  return new Promise((resolve, reject) => {
    const req = request(url, { method: "GET", agent: false, servername: url.hostname,
      headers: { "User-Agent": "GoldTerminal-Evidence/2.0", "Accept-Encoding": "identity" },
      lookup: (_host, _options, callback) => callback(null, addresses, undefined),
    }, (res) => {
      if (res.statusCode !== 200) { res.destroy(); reject(new Error("HTTP_OR_REDIRECT_REJECTED")); return; }
      const type = res.headers["content-type"] ?? "";
      if (!/^(text\/(html|plain|calendar)|application\/(json|xml|rss\+xml))/i.test(type) ||
        (res.headers["content-encoding"] && res.headers["content-encoding"] !== "identity") || Number(res.headers["content-length"] ?? 0) > MAX_BYTES) {
        res.destroy(); reject(new Error("CONTENT_TYPE_OR_SIZE_REJECTED")); return;
      }
      const chunks: Buffer[] = [];
      let size = 0;
      res.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > MAX_BYTES) { res.destroy(new Error("RESPONSE_TOO_LARGE")); return; }
        chunks.push(chunk);
      });
      res.on("error", reject);
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    });
    const timer = setTimeout(() => req.destroy(new Error("FETCH_TIMEOUT")), 10_000);
    req.on("close", () => clearTimeout(timer));
    req.on("error", reject);
    req.end();
  });
}

function plain(value: string): string {
  return value.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/\s+/g, " ").trim();
}
export function matchSourceQuote(body: string, quote: string): boolean {
  return quote.trim().length >= 12 && quote.length <= 1200 && plain(body).includes(plain(quote));
}

export async function verifyWebCandidates(candidates: readonly GlobalReadWebCandidate[]): Promise<GlobalReadDecision["audit"]["web"]> {
  return Promise.all(candidates.slice(0, 8).map(async (candidate) => {
    try {
      const page = await fetchEvidencePage(candidate.url);
      const match = matchSourceQuote(page, candidate.quote);
      return { candidate, status: match ? "QUOTE_MATCH" as const : "FETCHED" as const, resolvedSourceType: "OFFICIAL_HOST",
        contentHash: createHash("sha256").update(page).digest("hex"),
        reason: match ? "Exact quote found. Publication vintage, latestness and causal inference are NOT certified; context only." : "Fetched official page does not contain the quoted text; inadmissible." };
    } catch {
      return { candidate, status: "REJECTED" as const, resolvedSourceType: "UNVERIFIED", contentHash: null,
        reason: "Source fetch failed security, transport or content policy. No fallback to model prose." };
    }
  }));
}
