import { network } from "hardhat";

async function main() {
  console.log("=== CHECKING SEPOLIA TESTNET STATUS ===");
  const { viem } = await network.create();
  const [deployer] = await viem.getWalletClients();
  const publicClient = await viem.getPublicClient();

  const deployerAddress = deployer.account.address;
  console.log("Deployer Address:", deployerAddress);

  const balance = await publicClient.getBalance({ address: deployerAddress });
  console.log("Deployer Sepolia ETH Balance:", (Number(balance) / 1e18).toFixed(5), "ETH");

  const escrowAddress = (process.env.CANONICAL_ESCROW_ADDRESS || process.env.ESCROW_ADDRESS || "0x7d51b87db4df857cdd76ad63a9ace7b5c5599385") as `0x${string}`;
  const usdcAddress = (process.env.CANONICAL_TOKEN_ADDRESS || process.env.USDC_ADDRESS || "0xf21bdf6737a3009359f9ec1fa515e6d74702f575") as `0x${string}`;

  console.log("\nChecking Escrow bytecode at:", escrowAddress);
  const escrowBytecode = await publicClient.getBytecode({ address: escrowAddress });
  console.log("Escrow contract deployed?", Boolean(escrowBytecode && escrowBytecode !== "0x"));

  console.log("\nChecking Test USDC bytecode at:", usdcAddress);
  const tokenBytecode = await publicClient.getBytecode({ address: usdcAddress });
  console.log("USDC contract deployed?", Boolean(tokenBytecode && tokenBytecode !== "0x"));

  const blockNumber = await publicClient.getBlockNumber();
  console.log("\nCurrent Sepolia Block Number:", blockNumber.toString());
  console.log("=== SEPOLIA CHECK COMPLETE ===");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Sepolia check error:", err);
    process.exit(1);
  });
