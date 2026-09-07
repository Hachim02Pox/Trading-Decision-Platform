// Milestone 2A — defensive credential-redaction utility. Practical rule
// enforced across this codebase: raw config/provider-credential objects are
// never logged anywhere. `redactSensitive` exists as a backstop for any
// future HTTP client logging (e.g. request/response debug logs) that might
// otherwise accidentally print a header or body containing a credential.

const SENSITIVE_KEY_PATTERN = /api[_-]?key|password|token|authorization|cookie|session/i;

const REDACTED_PLACEHOLDER = "[REDACTED]";

/**
 * Returns a deep copy of `obj` with the value of every key whose name
 * matches a known-sensitive pattern (apiKey, password, token, authorization,
 * cookie, session — case-insensitive, with common separators) replaced by a
 * fixed placeholder. Non-object values are returned unchanged. Arrays are
 * walked element-by-element. This is a defensive utility, not a substitute
 * for simply never logging a raw credential/config object in the first
 * place.
 */
export function redactSensitive<T>(obj: T): T {
  return redactValue(obj) as T;
}

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item));
  }

  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        result[key] = REDACTED_PLACEHOLDER;
      } else {
        result[key] = redactValue(val);
      }
    }
    return result;
  }

  return value;
}
