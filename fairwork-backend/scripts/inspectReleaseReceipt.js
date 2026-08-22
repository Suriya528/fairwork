const dotenv = require("dotenv");
dotenv.config();

async function main() {
  const { createPublicClient, http, decodeEventLog } = await import("viem");
  const { sepolia } = await import("viem/chains");

  const client = createPublicClient({ chain: sepolia, transport: http(process.env.SEPOLIA_RPC_URL) });
  const txHash = "0x2be4d235950947c81a489f13d08d714e7668caac976d4f3bede4b66d1863965d";

  const receipt = await client.getTransactionReceipt({ hash: txHash });
  console.log("Tx Status:", receipt.status);
  console.log("Tx To:    ", receipt.to);
  console.log("Logs Count:", receipt.logs.length);

  const ESCROW_ABI = [
    {
      type: "event",
      name: "MilestoneReleased",
      inputs: [
        { type: "string", name: "projectId", indexed: true },
        { type: "uint256", name: "milestoneIndex", indexed: false },
        { type: "address", name: "freelancer", indexed: true },
        { type: "uint256", name: "amount", indexed: false },
      ],
    },
  ];

  for (let i = 0; i < receipt.logs.length; i++) {
    const l = receipt.logs[i];
    console.log(`Log [${i}] Address: ${l.address}`);
    try {
      const decoded = decodeEventLog({ abi: ESCROW_ABI, data: l.data, topics: l.topics });
      console.log(`Log [${i}] Decoded Event:`, decoded.eventName, decoded.args);
    } catch (err) {
      console.log(`Log [${i}] Decode Error:`, err.message);
    }
  }
}

main().catch(console.error);
