import { network } from "hardhat";

async function main() {
  const { viem } = await network.create();
  const [deployer] = await viem.getWalletClients();
  const publicClient = await viem.getPublicClient();

  const tokenAddress = "0xf21bdf6737a3009359f9ec1fa515e6d74702f575" as `0x${string}`;
  const escrowAddress = "0x7d51b87db4df857cdd76ad63a9ace7b5c5599385" as `0x${string}`;

  console.log("=== SEPOLIA TESTING STATUS ===");
  console.log("Deployer Address:", deployer.account.address);

  const ethBalance = await publicClient.getBalance({ address: deployer.account.address });
  console.log("ETH Balance:", (Number(ethBalance) / 1e18).toFixed(4), "ETH");

  const tokenContract = await viem.getContractAt("MockERC20", tokenAddress);
  const decimals = await tokenContract.read.decimals();
  const symbol = await tokenContract.read.symbol();
  const deployerTokens = await tokenContract.read.balanceOf([deployer.account.address]);
  console.log(`Test Token: ${symbol} (${tokenAddress})`);
  console.log(`Deployer ${symbol} Balance:`, (Number(deployerTokens) / 10 ** decimals).toLocaleString(), symbol);

  console.log("\nEscrow Contract:", escrowAddress);
}

main().catch(console.error);
