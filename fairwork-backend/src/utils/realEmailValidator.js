/**
 * Real-world email validation utility.
 * Enforces strict RFC-compliant syntax and disallows known disposable/temporary domains.
 */

const STRICT_EMAIL_RE =
  /^(?!\.)(?!.*\.\.)[a-zA-Z0-9._%+-]+(?<!\.)@(?!\.)(?!.*\.\.)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "tempmail.com",
  "temp-mail.org",
  "10minutemail.com",
  "guerrillamail.com",
  "guerrillamailblock.com",
  "sharklasers.com",
  "trashmail.com",
  "yopmail.com",
  "yopmail.fr",
  "dispostable.com",
  "getairmail.com",
  "throwawaymail.com",
  "fake.com",
  "fake.email",
  "generator.email",
  "nada.ltd",
  "mohmal.com",
  "crazymailing.com",
]);

function validateRealEmail(email) {
  if (!email || typeof email !== "string") {
    return "Email address is required";
  }

  const clean = email.toLowerCase().trim();
  if (!clean) {
    return "Email address is required";
  }

  if (!STRICT_EMAIL_RE.test(clean)) {
    return "Please enter a valid email address (e.g. name@domain.com)";
  }

  const parts = clean.split("@");
  if (parts.length !== 2) {
    return "Invalid email format";
  }

  const domain = parts[1];

  // Disallow disposable / throwaway domains
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return "Please use a real, permanent email address. Disposable email services are not permitted.";
  }

  return null;
}

module.exports = {
  validateRealEmail,
  DISPOSABLE_DOMAINS,
};
