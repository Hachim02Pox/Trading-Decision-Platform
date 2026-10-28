# Public repository security audit — 2026-10-28

Scope: the public `Hachim02Pox/trading-decision-platform` main branch at
`50632132e5bf0cf66e21febbd3dc04ceabcc8db1`, its reachable Git history,
application security boundaries, dependencies and GitHub workflows/settings.
Changes were made in a separate worktree because the original local main
diverged from public main. The original checkout and its private files were preserved.

## Fixed

- Anonymous research uploads could persist attacker-controlled evidence to disk.
  Uploads now require the existing internal ingestion secret.
- Public snapshot requests no longer trigger paid analysis; on-demand generation
  requires a verified Supabase session. Guests can read cached analysis.
- Local agent CLI execution now requires explicit `ALLOW_TRUSTED_LOCAL_CLI=true`
  and is always disabled in production/Railway/Vercel. A read-only agent sandbox
  alone does not protect local credentials or globally configured MCP tools.
- HTTP requests and news streams are bounded. Incomplete headers/uploads time out;
  local backend listening defaults to loopback. Parser/database errors no longer
  disclose their internal messages to HTTP clients.
- The external HTML proxy rejects untrusted hosts, credentials, custom ports,
  redirects and oversized responses. Response-level CSP sandboxing protects direct
  visits as well as embedded views.
- Login redirects reject URL parser control-character/backslash bypasses.
  Frontend responses set anti-framing and other browser security headers.
- Migration `014_public_api_lockdown.sql` enables RLS and revokes browser-role
  privileges on backend-only tables, sequences and trigger functions. Browser
  access to holders retains the existing own-profile policies. PostgreSQL owner
  access used by the backend is unaffected.
- Workflows have read-only permissions, verified action commit pins, no persisted
  checkout credentials and validation against trigger metadata/header injection.
  CI audits dependencies; Dependabot covers runtime and auxiliary projects.

## GitHub settings verified remotely

Enabled secret scanning, secret-scanning push protection, Dependabot alerts and
automated security updates. Open secret alerts: zero at verification time.
Default workflow token permission is read-only; workflows cannot approve PRs.
No self-hosted runners and no repository webhooks were present. Non-provider
patterns and validity checks remained disabled in GitHub's returned settings;
they are not claimed as enabled.
All six application workflows were manually disabled on GitHub. Only CI was
re-enabled for security verification and given a manual launch option. Scheduled
ingestion/recap workflows remain disabled; they were not silently restarted.

## Secret scan evidence

234 reachable commits, 3,992 Git objects and 2,078 blobs (approximately 970 MB)
were checked for provider-token/private-key/JWT/credential-URL patterns, with
an additional generic assignment scan of text-sized blobs and commit messages.
The pinned reference ZIP was separately decompressed in memory: 80 entries,
2,639,794 bytes, no secret or `.env` entry found. No actual secret was detected.
The backend `.env` was empty, so comparison against real deployment credentials
was impossible. Pattern scanning is not proof that no unknown secret exists.

## Verification and limits

- Runtime dependency audit: zero npm advisories after patched dependency updates.
  The ExcelJS UUID override is checked with an XLSX formatting round-trip.
- All 14 auxiliary video projects also resolved with zero npm advisories after
  aligned Remotion updates and a patched Zod override. Five existing locks were
  updated; nine lockless projects were resolved separately in temporary folders.
  Video rendering was not exercised.
- Full application suite: 415 passed, 4 skipped; backend/frontend/contracts
  typechecks and production build passed. Skips include live DB checks.
- Security module/proxy/redirect/cache-reader coverage: 97.93% lines, 89.33% branches.
- Pinned Brain reference validator and its 62 Node tests passed. This historical
  archive retains its original package lock for provenance. CI updates only the
  installed `fast-uri` tooling dependency to its patched release without saving
  changes to reference files. The tooling audit then reports zero advisories,
  and re-running materialization verifies the original reference bytes remain intact.
- The published frontend responded, but its Supabase project hostname returned
  `ENOTFOUND`. The documented Railway backend returned 404. Current hosting,
  provider-account state and live database policies could not be verified.
- **Migration 014 has not been applied to a live database.** Configure the real
  backend DB credentials, review the migration, run `npm run db:migrate`, then
  `SECURITY_DB_TEST=1 npm test` using the environment-variable syntax for your shell.
  A Git push or frontend deployment does not apply this migration automatically.
- Local Windows firewall profiles were enabled. MySQL was listening on all
  interfaces at 3306/33060 with inbound allow rules; Python/Node also had public
  inbound allow rules. No claim is made about Internet router port forwarding.
  The current process is not Administrator, so no firewall change was possible.
  `scripts/security/windows-firewall.ps1` is read-only by default; an Administrator
  can run it with `-Apply` to block remote MySQL and disable the identified public
  Python/Node allow rules, saving their previous state for rollback.
- Local rate limits ignore forwarded headers. Railway HTTP edge requests use a
  validated `X-Real-IP` only when Railway deployment and public-domain variables
  are present; this assumes there is no direct public/TCP route bypassing its HTTP
  edge. Authenticated routes prefer the verified holder ID. Health and internal
  cron routes have independent availability from the public request quota.
  Distributed/global quotas and provider spending limits still belong in the
  hosting/provider settings. See [Railway's header contract](https://docs.railway.com/networking/public-networking/specs-and-limits).
- Public intelligence reads are strictly cache-only, including missing languages.
  Uncached commentary is unavailable until generated by trusted boot work or the
  separate authenticated analysis workflow; guest requests never generate it.
- No PC-wide malware scan, router audit, credential rotation, or verification of
  private provider dashboards was possible. Making source public does not itself
  grant filesystem access; exposed credentials or reachable vulnerable services
  are the relevant attack paths. A clean scan cannot guarantee total security.
