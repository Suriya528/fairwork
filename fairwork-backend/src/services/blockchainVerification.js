const { createPublicClient, http } = require("viem");
const { sepolia } = require("viem/chains");

const ESCROW_ABI = [
  {
    type: "function",
    name: "getEscrowParties",
    stateMutability: "view",
    inputs: [{ type: "string", name: "projectId" }],
    outputs: [
      { type: "address", name: "client" },
      { type: "address", name: "freelancer" },
      { type: "bool", name: "isFunded" },
      { type: "bool", name: "isDisputed" },
      { type: "bool", name: "isCompleted" },
    ],
  },
];

function getClient() {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  if (!rpcUrl) return null;
  try {
    return createPublicClient({ chain: sepolia, transport: http(rpcUrl) });
  } catch {
    return null;
  }
}

/**
 * Verifies that a transaction succeeded on-chain via Sepolia RPC.
 * If RPC is not configured, returns verified: true with a warning.
 */
async function verifyTransactionReceipt(txnHash) {
  if (!txnHash || typeof txnHash !== "string" || !txnHash.startsWith("0x")) {
    return { verified: false, error: "Valid transaction hash (0x...) is required." };
  }
  const client = getClient();
  if (!client) {
    return { verified: true, warning: "RPC client not configured; proceeding without receipt check." };
  }
  try {
    const receipt = await client.waitForTransactionReceipt({ hash: txnHash });
    if (receipt.status !== "success") {
      return { verified: false, error: "Transaction reverted or failed on-chain." };
    }
    return { verified: true, receipt };
  } catch (err) {
    return { verified: false, error: err.message || "Failed to fetch transaction receipt on-chain." };
  }
}

/**
 * Verifies that an escrow is funded on-chain by querying getEscrowParties.
 */
async function verifyOnChainEscrowFunded(projectId) {
  const client = getClient();
  const escrowAddress = process.env.ESCROW_CONTRACT_ADDRESS || process.env.ESCROW_ADDRESS;
  if (!client || !escrowAddress) {
    return { verified: true, warning: "Escrow contract or RPC not configured; skipping on-chain state check." };
  }
  try {
    const parties = await client.readContract({
      address: escrowAddress,
      abi: ESCROW_ABI,
      functionName: "getEscrowParties",
      args: [projectId],
    });
    // parties[2] is isFunded
    if (!parties || !parties[2]) {
      return { verified: false, error: "Smart contract reports escrow is not funded on-chain." };
    }
    return { verified: true, parties };
  } catch (err) {
    return { verified: false, error: err.message || "Failed to query smart contract escrow state." };
  }
}

module.exports = {
  verifyTransactionReceipt,
  verifyOnChainEscrowFunded,
};
