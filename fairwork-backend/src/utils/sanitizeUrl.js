/**
 * Sanitizes a URL to prevent javascript:, data:, or credential-embedded URLs.
 * Returns null for invalid/dangerous URLs (backend rejects at validation).
 */
function sanitizeUrl(raw) {
  if (!raw || typeof raw !== "string") return null;
  try {
    const parsed = new URL(raw.trim());
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    if (parsed.username || parsed.password) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

module.exports = { sanitizeUrl };
