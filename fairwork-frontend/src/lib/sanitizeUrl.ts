/**
 * Sanitizes a URL to prevent javascript:, data:, or credential-embedded URLs.
 * Returns "#" for invalid/dangerous URLs (safe href attribute).
 */
export function sanitizeUrl(raw: string | undefined | null): string {
  if (!raw || typeof raw !== "string") return "#";
  try {
    const parsed = new URL(raw.trim());
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "#";
    if (parsed.username || parsed.password) return "#";
    return parsed.href;
  } catch {
    return "#";
  }
}
