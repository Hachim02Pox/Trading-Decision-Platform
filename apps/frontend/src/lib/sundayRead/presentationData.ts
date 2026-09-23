/**
 * Published reports may contain optional fields as objects while a newer
 * producer is progressively migrating them to arrays. Rendering must retain
 * the report instead of assuming the newer shape and throwing in the browser.
 */
export function arrayOrEmpty<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}
