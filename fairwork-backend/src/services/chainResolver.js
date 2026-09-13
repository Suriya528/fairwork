const { mainnet, sepolia, base, polygon, arbitrum, optimism, hardhat } = require("viem/chains");

const SUPPORTED_CHAINS = {
  1: mainnet,
  10: optimism,
  137: polygon,
  8453: base,
  42161: arbitrum,
  11155111: sepolia,
  31337: hardhat,
};

/**
 * Resolves a viem chain definition dynamically from CHAIN_ID or config.
 * Supports Ethereum Mainnet, L2s (Arbitrum, Base, Optimism, Polygon), Sepolia testnet, and Hardhat.
 * Falls back to a well-formed custom EVM chain definition for other EVM-compatible chains.
 */
function resolveViemChain(chainId) {
  const parsedId = Number(chainId || process.env.CHAIN_ID || 11155111);
  if (SUPPORTED_CHAINS[parsedId]) {
    return SUPPORTED_CHAINS[parsedId];
  }
  return {
    id: parsedId,
    name: `EVM-${parsedId}`,
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: {
      default: { http: [process.env.RPC_URL || process.env.SEPOLIA_RPC_URL || ""] },
    },
  };
}

/**
 * Resolves the primary EVM RPC endpoint with backward-compatible fallback.
 */
function getRpcUrl(overrideUrl = null) {
  return overrideUrl || process.env.RPC_URL || process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org";
}

module.exports = {
  resolveViemChain,
  getRpcUrl,
  SUPPORTED_CHAINS,
};
