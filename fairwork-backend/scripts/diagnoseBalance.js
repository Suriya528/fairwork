const dotenv = require("dotenv");
dotenv.config();

async function main() {
  const { createPublicClient, http, formatUnits } = await import("viem");
  const { sepolia } = await import("viem/chains");

  const rpcUrl = process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
  console.log("Connecting via RPC:", rpcUrl);

  const client = createPublicClient({ chain: sepolia, transport: http("https://ethereum-sepolia-rpc.publicnode.com") });

  const escrowAddress = "0x250e5a4ac771010d4ee5bad959557f4cdaca3a03";
  const tokenAddress = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // Circle USDC Sepolia

  const ERC20_ABI = [
    { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
    { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
    { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
    { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address", name: "owner" }], outputs: [{ type: "uint256" }] },
  ];

  console.log("=== SEPOLIA TOKEN BALANCE DIAGNOSTICS ===");
  console.log("Configured Escrow Address:    ", escrowAddress);
  console.log("Configured Token Address:     ", tokenAddress);

  try {
    const symbol = await client.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: "symbol" });
    const name = await client.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: "name" });
    const decimals = await client.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: "decimals" });

    console.log(`\nOn-Chain Token Metadata:`);
    console.log(`  Token Name:                 ${name}`);
    console.log(`  Token Symbol:               ${symbol}`);
    console.log(`  Token Decimals:             ${decimals}`);
  } catch (err) {
    console.error("\nError querying token contract metadata:", err.message);
  }
}

main().catch(console.error);
