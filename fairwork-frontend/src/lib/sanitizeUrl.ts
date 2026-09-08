/**
 * Sanitizes a URL to prevent javascript:, data:, or credential-embedded URLs.
 * Allows safe https:, http:, or root-relative paths (e.g. /uploads/...).
 * Returns "#" for invalid/dangerous URLs (safe href attribute).
 */
export function sanitizeUrl(raw: string | undefined | null): string {
  if (!raw || typeof raw !== "string") return "#";
  const trimmed = raw.trim();

  // Allow safe root-relative URLs, but forbid protocol-relative (//)
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.includes("\\")) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "#";
    if (parsed.username || parsed.password) return "#";
    return parsed.href;
  } catch {
    return "#";
  }
}
