const { isValidEthAddress } = require("../services/reconciliationService");

/**
 * Fail-fast Startup Validator for FairWork Backend
 * Enforces production & staging configuration invariants.
 */
function validateStartupConfig(env = process.env) {
  const isProdOrStaging = ["production", "staging"].includes(env.NODE_ENV);
  const errors = [];

  if (!env.NODE_ENV) errors.push("NODE_ENV is missing");
  if (!env.MONGO_URI && isProdOrStaging) errors.push("MONGO_URI is missing");

  // JWT security & strength requirements
  if (!env.JWT_SECRET) {
    errors.push("JWT_SECRET is missing");
  } else if (isProdOrStaging && env.JWT_SECRET.length < 32) {
    errors.push("JWT_SECRET must satisfy minimum strength requirement (at least 32 characters)");
  }

  if (!env.JWT_ISSUER) errors.push("JWT_ISSUER must be non-empty");
  if (!env.JWT_AUDIENCE) errors.push("JWT_AUDIENCE must be non-empty");

  // Client URL & CORS Origins
  if (isProdOrStaging && !env.CLIENT_URL) errors.push("CLIENT_URL is missing in staging/production");

  // Redis URL
  if (isProdOrStaging && !env.REDIS_URL) errors.push("REDIS_URL is missing in staging/production");

  // Chain & EVM Configuration
  if (env.CHAIN_ID && isNaN(Number(env.CHAIN_ID))) {
    errors.push("CHAIN_ID must be numeric");
  }

  if (env.ESCROW_CONTRACT_ADDRESS && !isValidEthAddress(env.ESCROW_CONTRACT_ADDRESS)) {
    errors.push(`ESCROW_CONTRACT_ADDRESS is invalid EVM address: ${env.ESCROW_CONTRACT_ADDRESS}`);
  }

  if (env.TOKEN_CONTRACT_ADDRESS && !isValidEthAddress(env.TOKEN_CONTRACT_ADDRESS)) {
    errors.push(`TOKEN_CONTRACT_ADDRESS is invalid EVM address: ${env.TOKEN_CONTRACT_ADDRESS}`);
  }

  if (isProdOrStaging && !env.EXPECTED_ESCROW_BYTECODE_HASH) {
    errors.push("EXPECTED_ESCROW_BYTECODE_HASH is missing in staging/production");
  }

  if (errors.length > 0) {
    const errorMsg = `FATAL_STARTUP_CONFIG_ERROR:\n- ${errors.join("\n- ")}`;
    if (isProdOrStaging) {
      throw new Error(errorMsg);
    } else {
      console.warn(`[CONFIG_WARN] ${errorMsg}`);
    }
  }

  return true;
}

module.exports = { validateStartupConfig };
