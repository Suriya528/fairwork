const mongoose = require("mongoose");

/**
 * Safe Decimal128 serializer using pure string arithmetic.
 * NEVER converts to IEEE-754 floating point.
 */
function serializeDecimal128(value, scale = 2) {
  if (value == null) return null;

  const raw = value.toString();

  // Reject scientific notation
  if (/e/i.test(raw)) {
    throw new Error("DECIMAL_SCIENTIFIC_NOT_ALLOWED");
  }

  const negative = raw.startsWith("-");
  const abs = negative ? raw.slice(1) : raw;
  const [whole, fraction = ""] = abs.split(".");

  if (fraction.length > scale) {
    throw new Error("DECIMAL_SCALE_VIOLATION: " + raw + " exceeds scale " + scale);
  }

  return (negative ? "-" : "") + whole + "." + fraction.padEnd(scale, "0");
}

/**
 * Validates a business money amount.
 * @param {string|number} amount - The amount to validate
 * @param {string} currency - ISO 4217 currency code
 * @returns {{ valid: boolean, error?: string, decimal128?: mongoose.Types.Decimal128 }}
 */
function validateBusinessAmount(amount, currency = "USD") {
  if (amount == null) return { valid: false, error: "Amount is required" };

  const str = String(amount).trim();
  if (!/^\d+(\.\d+)?$/.test(str)) {
    return { valid: false, error: "Amount must be a positive decimal number" };
  }

  const [whole, fraction = ""] = str.split(".");
  const maxScale = ["USD", "INR"].includes(currency) ? 2 : 6;
  if (fraction.length > maxScale) {
    return { valid: false, error: `Amount exceeds maximum ${maxScale} decimal places for ${currency}` };
  }

  const numericCheck = parseFloat(str);
  if (numericCheck <= 0) {
    return { valid: false, error: "Amount must be greater than zero" };
  }
  if (numericCheck > 1_000_000_000) {
    return { valid: false, error: "Amount exceeds platform ceiling" };
  }

  try {
    const decimal128 = mongoose.Types.Decimal128.fromString(whole + "." + fraction.padEnd(maxScale, "0"));
    return { valid: true, decimal128 };
  } catch (err) {
    return { valid: false, error: "Invalid decimal format" };
  }
}

/**
 * Validates a token base unit string (exact integer, no decimals).
 */
function validateTokenUnits(units) {
  if (!units || typeof units !== "string") {
    return { valid: false, error: "Token units must be a non-empty string" };
  }
  if (!/^[1-9][0-9]*$/.test(units) && units !== "0") {
    return { valid: false, error: "Token units must be a non-negative integer string" };
  }
  return { valid: true };
}

module.exports = {
  serializeDecimal128,
  validateBusinessAmount,
  validateTokenUnits,
};
