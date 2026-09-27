import { network } from "hardhat";

async function main() {
  const targetAddress = process.env.MINT_TO_ADDRESS as `0x${string}`;
  const amountStr = process.env.MINT_AMOUNT || "5000";

  if (!targetAddress) {
    console.log("Usage: Set MINT_TO_ADDRESS in your environment or CLI, e.g.:");
    console.log("$env:MINT_TO_ADDRESS='0xYourMetaMaskAddress'; npx hardhat run scripts/mintTokensToUser.ts --network sepolia");
    process.exit(1);
  }

  const { viem } = await network.create();
  const [deployer] = await viem.getWalletClients();
  const publicClient = await viem.getPublicClient();

  const tokenAddress = "0xf21bdf6737a3009359f9ec1fa515e6d74702f575" as `0x${string}`;
  const tokenContract = await viem.getContractAt("MockERC20", tokenAddress);

  const decimals = await tokenContract.read.decimals();
  const rawAmount = BigInt(amountStr) * 10n ** BigInt(decimals);

  console.log(`Minting ${amountStr} mUSDC to ${targetAddress}...`);
  const txHash = await tokenContract.write.mint([targetAddress, rawAmount]);
  console.log("Waiting for block confirmation, Tx:", txHash);

  await publicClient.waitForTransactionReceipt({ hash: txHash });
  const newBal = await tokenContract.read.balanceOf([targetAddress]);
  console.log(`Success! New balance of ${targetAddress}:`, (Number(newBal) / 10 ** decimals).toLocaleString(), "mUSDC");
}

main().catch(console.error);
