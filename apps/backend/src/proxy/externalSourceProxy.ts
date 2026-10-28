// Server-side proxy for the handful of external sources that have no
// official embed widget, so the frontend's ExternalSourceModal can show
// them in-page instead of opening a new browser tab (user-explicit request,
// 2026-09: "je ne veux pas ouvrir dans un nouvel onglet... peu importe la
// façon"). The frontend loads GET /api/external-proxy/:key in a sandboxed
// iframe (no allow-top-navigation) — that sandbox, not this file, is what
// guarantees the terminal page itself can never be navigated away, even if
// the proxied page tries a frame-busting script.
//
// SAFETY (initial page): the client sends only a `key`, never a URL.
// PROXY_TARGETS below is the entire, fixed set of INITIAL pages this endpoint
// will ever fetch by key — no way to turn that route into an open SSRF proxy.
//
// SAFETY (in-page navigation, e.g. TradingView's "Full chart" link): a click
// inside the proxied page points at a DIFFERENT url on the same site, which
// this proxy was never asked to fetch by key. User-explicit follow-up
// (2026-09): that click should load inline, not in a new tab. GET
// /api/external-proxy/link?url=... exists for exactly this — but since its
// url IS client/page-supplied, it is only ever fetched when its hostname is
// one of ALLOWED_PROXY_HOSTS (the same sites already proxied above); anything
// else (including any attempt at an internal/local address) is refused
// before any network call is made. Exact public website hosts are allowed,
// with any path permitted so the source site's own navigation works.
// A single fixed URL per key cannot support this navigation. Redirects are
// refused, and response size and time are bounded independently.
//
// CME's FedWatch tool (f3-path-6m / f3-repricing in externalSourceLinks.ts)
// is deliberately in neither PROXY_TARGETS nor ALLOWED_PROXY_HOSTS: CME's
// Terms of Use explicitly ban scripted/automated access, and a proxy fetch is
// exactly that — see real/f3Fed.ts for the standing rule. Those two stay
// "open externally" only, permanently, regardless of any future request to
// add more proxy targets.
import { loadAppConfig } from "../config/env";

const PROXY_TARGETS: Record<string, string> = {
  "f7-move": "https://www.tradingview.com/symbols/TVC-MOVE/",
  "f12-gold-demand-trends": "https://www.gold.org/goldhub/research/gold-demand-trends",
  "f5-ism-services": "https://tradingeconomics.com/united-states/non-manufacturing-pmi",
  "f5-ism-manufacturing": "https://tradingeconomics.com/united-states/business-confidence",
};

// Only the known public website hosts, never arbitrary tenant subdomains.
const ALLOWED_PROXY_HOSTS = ["tradingview.com", "www.tradingview.com", "gold.org", "www.gold.org", "tradingeconomics.com", "www.tradingeconomics.com"];

function isAllowedProxyHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return ALLOWED_PROXY_HOSTS.includes(lower);
}

const PROXY_TIMEOUT_MS = 10_000;
const PROXY_MAX_BYTES = 2 * 1024 * 1024;
const PROXY_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/**
 * Fetches an allowlisted page (by fixed key) server-side and returns rewritten
 * HTML ready to render inside the modal's sandboxed iframe. Returns null when
 * `key` isn't in PROXY_TARGETS or the fetch fails.
 */
export async function fetchProxiedSourceHtml(key: string): Promise<string | null> {
  if (!Object.prototype.hasOwnProperty.call(PROXY_TARGETS, key)) return null;
  const targetUrl = PROXY_TARGETS[key];
  if (!targetUrl) return null;
  return fetchAndRewrite(targetUrl);
}

/**
 * Fetches a client-supplied url server-side, but ONLY when its hostname is
 * one of ALLOWED_PROXY_HOSTS — used for in-page navigation (e.g. "Full
 * chart") that the injected link-intercept script below routes here instead
 * of opening a new tab. Returns null (refusing the fetch entirely) for any
 * non-https scheme or disallowed hostname, and on fetch failure.
 */
export async function fetchProxiedLinkHtml(targetUrl: string): Promise<string | null> {
  // URL parsing strips some control characters, so reject them first.
  if (/[\u0000-\u0020\u007f]/.test(targetUrl)) return null;
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" || !isAllowedProxyHost(parsed.hostname) ||
      parsed.username || parsed.password || (parsed.port && parsed.port !== "443")) return null;
  return fetchAndRewrite(parsed.toString());
}

async function fetchAndRewrite(targetUrl: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);
  try {
    const response = await fetch(targetUrl, {
      headers: { "User-Agent": PROXY_USER_AGENT, Accept: "text/html" },
      redirect: "error", // A trusted host must never redirect into a private network.
      signal: controller.signal,
    });
    if (!response.ok || !response.body) { await response.body?.cancel(); return null; }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let bytes = 0;
    let html = "";
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > PROXY_MAX_BYTES) { await reader.cancel(); return null; }
        html += decoder.decode(value, { stream: true });
      }
      html += decoder.decode();
    } finally { reader.releaseLock(); }
    if (!html) return null;
    return injectLinkInterceptScript(injectBaseTag(html, new URL(targetUrl).origin));
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function injectBaseTag(html: string, origin: string): string {
  const baseTag = `<base href="${origin}/">`;
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (match) => `${match}${baseTag}`);
  }
  return `${baseTag}${html}`;
}

// A click on any link inside a proxied page (e.g. TradingView's "Full
// chart", "Community", "Technicals" tabs) points at a DIFFERENT page on the
// source site. This script decides, client-side inside the sandboxed iframe,
// what happens next: a link on one of ALLOWED_PROXY_HOSTS navigates the
// SAME iframe to /api/external-proxy/link?url=... (so it loads inline,
// proxied the same way, per user request — no new tab for legitimate
// deeper navigation on a site we already trust); anything else (external
// domains — social share links, a sign-up page on a different host, etc.,
// which this proxy has no business fetching) opens in a real new tab
// instead (allow-popups is set on the iframe's sandbox for exactly this),
// rather than resolving to this proxy's own "not available" 404 page.
// Absolute, not relative: the injected <base> tag above points at the
// PROXIED SITE's origin, so a relative path here would resolve there, not
// to our own backend.
function buildLinkInterceptScript(backendBaseUrl: string): string {
  const allowedHostsJson = JSON.stringify(ALLOWED_PROXY_HOSTS);
  const linkProxyBase = `${backendBaseUrl}/api/external-proxy/link?url=`;
  return `<script>(function(){
var ALLOWED=${allowedHostsJson};
function isAllowed(hostname){return ALLOWED.indexOf(hostname.toLowerCase())!==-1;}
document.addEventListener("click",function(e){
var a=e.target&&e.target.closest?e.target.closest("a[href]"):null;
if(!a)return;
var href=a.getAttribute("href")||"";
if(href.indexOf("javascript:")===0||href.indexOf("#")===0)return;
e.preventDefault();
var url;
try{url=new URL(a.href);}catch(err){return;}
if(url.protocol==="https:"&&isAllowed(url.hostname)&&!url.username&&!url.password&&(!url.port||url.port==="443")){
window.location.href="${linkProxyBase}"+encodeURIComponent(a.href);
}else{
window.open(a.href,"_blank","noopener,noreferrer");
}
},true);
})();</script>`;
}

function injectLinkInterceptScript(html: string): string {
  const backendBaseUrl = `http://localhost:${loadAppConfig().port}`;
  const script = buildLinkInterceptScript(backendBaseUrl);
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${script}</body>`);
  }
  return `${html}${script}`;
}
