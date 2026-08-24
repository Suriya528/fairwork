const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { createPublicClient, http } = require("viem");
const { sepolia } = require("viem/chains");

/**
 * Validates contract deployment integrity, bytecode hashes, ABI checksums,
 * chainId matching, and verifies non-proxy code deployment.
 */
async function verifyAtStartup(config = {}) {
  const isProd = (config.nodeEnv || process.env.NODE_ENV) === "production";

  const chainId = config.chainId || parseInt(process.env.CHAIN_ID || "11155111", 10);
  const escrowAddress = config.escrowAddress || process.env.CANONICAL_ESCROW_ADDRESS || process.env.ESCROW_ADDRESS;
  const tokenAddress = config.tokenAddress || process.env.CANONICAL_TOKEN_ADDRESS || process.env.USDC_ADDRESS;
  const expectedTokenDecimals = config.tokenDecimals || parseInt(process.env.TOKEN_DECIMALS || "6", 10);
  const rpcUrl = config.rpcUrl || process.env.SEPOLIA_RPC_URL || process.env.RPC_URL || "https://rpc.sepolia.org";

  if (!escrowAddress) {
    if (isProd) throw new Error("FATAL_STARTUP_ESCROW_ADDRESS_REQUIRED");
    console.warn("WARNING: Escrow address unconfigured; skipping live contract verification.");
    return { status: "SKIPPED_DEV" };
  }

  // 1. Verify ABI SHA-256 Checksum
  const abiPath = path.join(__dirname, "../abi/EscrowContract.abi.json");
  const shaPath = path.join(__dirname, "../abi/EscrowContract.abi.sha256");

  if (fs.existsSync(abiPath) && fs.existsSync(shaPath)) {
    const abiRaw = fs.readFileSync(abiPath, "utf-8");
    const expectedSha = fs.readFileSync(shaPath, "utf-8").trim();
    const actualSha = crypto.createHash("sha256").update(abiRaw).digest("hex");

    if (actualSha !== expectedSha) {
      throw new Error(`FATAL_STARTUP_ABI_CHECKSUM_MISMATCH: expected ${expectedSha}, got ${actualSha}`);
    }
  }

  // 2. Query chain and contract via RPC
  try {
    const client = createPublicClient({ chain: sepolia, transport: http(rpcUrl) });
    const netChainId = await client.getChainId();

    if (netChainId !== chainId) {
      throw new Error(`FATAL_STARTUP_CHAIN_ID_MISMATCH: expected ${chainId}, RPC returned ${netChainId}`);
    }

    const code = await client.getCode({ address: escrowAddress });
    if (!code || code === "0x") {
      throw new Error(`FATAL_STARTUP_NO_CODE_AT_ESCROW_ADDRESS: ${escrowAddress}`);
    }

    // Non-proxy check (reject EIP-1167 minimal proxies)
    if (code.toLowerCase().startsWith("0x363d3d373d3d3d363d73")) {
      throw new Error(`FATAL_STARTUP_CONTRACT_IS_EIP1167_PROXY: ${escrowAddress}`);
    }

    // Bytecode hash verification if configured
    const expectedBytecodeHash = process.env.EXPECTED_ESCROW_BYTECODE_HASH;
    if (expectedBytecodeHash) {
      const actualBytecodeHash = crypto.createHash("sha256").update(code).digest("hex");
      const cleanExpected = expectedBytecodeHash.replace(/^0x/i, "").toLowerCase();
      if (actualBytecodeHash.toLowerCase() !== cleanExpected) {
        throw new Error(`FATAL_STARTUP_BYTECODE_HASH_MISMATCH: expected ${cleanExpected}, got ${actualBytecodeHash}`);
      }
    }

    return {
      status: "VERIFIED",
      chainId,
      escrowAddress: escrowAddress.toLowerCase(),
      tokenAddress: tokenAddress ? tokenAddress.toLowerCase() : null,
      tokenDecimals: expectedTokenDecimals,
      nonProxyVerified: true,
    };
  } catch (err) {
    if (isProd) throw err;
    console.warn(`WARNING: Live contract startup verification failed in non-prod mode: ${err.message}`);
    return { status: "FAILED_NON_PROD", error: err.message };
  }
}

module.exports = {
  verifyAtStartup,
};
