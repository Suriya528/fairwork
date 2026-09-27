import { network } from "hardhat";

async function main() {
  console.log("=== CHECKING ALL SEPOLIA CONTRACTS ===");
  const { viem } = await network.create();
  const publicClient = await viem.getPublicClient();

  const contracts = {
    Escrow: "0x7d51b87db4df857cdd76ad63a9ace7b5c5599385" as `0x${string}`,
    TestUSDC: "0xf21bdf6737a3009359f9ec1fa515e6d74702f575" as `0x${string}`,
    Dispute: "0x8ddbfe20695a1ddf8488ab80b443574c28024962" as `0x${string}`,
    Reputation: "0x53b26eda403333c10f7a78c6e85b5a1f920b7ad3" as `0x${string}`,
  };

  for (const [name, addr] of Object.entries(contracts)) {
    const code = await publicClient.getBytecode({ address: addr });
    const isLive = Boolean(code && code !== "0x");
    console.log(`${name} (${addr}): ${isLive ? "LIVE & ACTIVE ✓" : "NOT DEPLOYED ✗"}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
