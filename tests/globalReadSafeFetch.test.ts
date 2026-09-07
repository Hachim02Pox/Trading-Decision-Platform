import assert from "node:assert/strict";
import { test } from "node:test";
import { validateEvidenceUrl, isPublicIpv4, matchSourceQuote } from "../apps/backend/src/intelligence/globalRead/safeFetch";

test("URL policy excludes SSRF, credentials, ports, subdomain spoofing and unknown sources", () => {
  for (const url of ["http://www.bls.gov", "https://127.0.0.1", "https://169.254.169.254/latest/meta-data", "https://www.bls.gov.evil.test", "file:///etc/passwd", "https://user:pass@www.bls.gov", "https://www.bls.gov:8080/", "https://localhost"])
    assert.throws(() => validateEvidenceUrl(url));
  assert.equal(validateEvidenceUrl("https://www.bls.gov/news.release/cpi.nr0.htm").hostname, "www.bls.gov");
});
test("DNS pinning only permits routable IPv4 addresses", () => {
  for (const ip of ["127.0.0.1", "10.0.0.1", "172.31.2.4", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1", "::1", "198.18.0.1"])
    assert.equal(isPublicIpv4(ip), false, ip);
  assert.equal(isPublicIpv4("8.8.8.8"), true);
});
test("source quote matching is not semantic or data verification", () => {
  assert.equal(matchSourceQuote("<p>Policy remains restrictive.</p>", "Policy remains restrictive."), true);
  assert.equal(matchSourceQuote("<script>policy is easy now</script><p>Policy remains restrictive.</p>", "policy is easy now"), false);
  assert.equal(matchSourceQuote("<p>Policy remains restrictive.</p>", "The Fed cut rates."), false);
});
