import { network } from "hardhat";

async function main() {
  console.log("=== DEPLOYING CONTROLLED SEPOLIA TEST ERC-20 & ESCROW CONTRACT ===");

  const { viem } = await network.create();
  const [deployer] = await viem.getWalletClients();

  console.log("Deployer Wallet Address:", deployer.account.address);

  const publicClient = await viem.getPublicClient();
  const ethBalance = await publicClient.getBalance({ address: deployer.account.address });
  console.log("Deployer Sepolia ETH Balance:", (Number(ethBalance) / 1e18).toFixed(4), "ETH");

  // 1. Deploy Controlled Test ERC-20 Token (6 decimals)
  console.log("\n1. Deploying MockERC20 (FairWork Test Token, FWUSDC)...");
  const token = await viem.deployContract("MockERC20");
  console.log("-> Deployed Token Address:", token.address);

  // 2. Deploy Identical EscrowContract
  console.log("\n2. Deploying EscrowContract...");
  const escrow = await viem.deployContract("EscrowContract");
  console.log("-> Deployed EscrowContract Address:", escrow.address);

  // 3. Deploy DisputeContract
  console.log("\n3. Deploying DisputeContract...");
  const dispute = await viem.deployContract("DisputeContract", [escrow.address, deployer.account.address]);
  console.log("-> Deployed DisputeContract Address:", dispute.address);

  // 4. Mint Test Tokens to Deployer and Client Wallets
  const mintAmount = 100000n * 10n ** 6n; // 100,000 FWUSDC (6 decimals)
  console.log(`\n4. Minting ${mintAmount / 10n ** 6n} FWUSDC tokens to deployer (${deployer.account.address})...`);
  const mintTx1 = await token.write.mint([deployer.account.address, mintAmount]);
  await publicClient.waitForTransactionReceipt({ hash: mintTx1 });
  console.log("-> Mint Tx1 Confirmed:", mintTx1);

  const testClientWallet = "0xd87e3827aa59006ffda2a3447153e3dd02609905";
  console.log(`\nMinting ${mintAmount / 10n ** 6n} FWUSDC tokens to client wallet (${testClientWallet})...`);
  const mintTx2 = await token.write.mint([testClientWallet, mintAmount]);
  await publicClient.waitForTransactionReceipt({ hash: mintTx2 });
  console.log("-> Mint Tx2 Confirmed:", mintTx2);

  const deployerTokenBal = await token.read.balanceOf([deployer.account.address]);
  const clientTokenBal = await token.read.balanceOf([testClientWallet]);

  console.log("\n=== VERIFIED ON-CHAIN TOKEN BALANCES ===");
  console.log(`Deployer (${deployer.account.address}): ${(Number(deployerTokenBal) / 1e6).toLocaleString()} FWUSDC`);
  console.log(`Client (${testClientWallet}):   ${(Number(clientTokenBal) / 1e6).toLocaleString()} FWUSDC`);

  console.log("\n==================================================");
  console.log("COPY TO FRONTEND AND BACKEND .env FILES:");
  console.log("==================================================");
  console.log(`VITE_ESCROW_CONTRACT_ADDRESS=${escrow.address}`);
  console.log(`VITE_ESCROW_ADDRESS=${escrow.address}`);
  console.log(`VITE_DISPUTE_CONTRACT_ADDRESS=${dispute.address}`);
  console.log(`VITE_DISPUTE_ADDRESS=${dispute.address}`);
  console.log(`VITE_USDC_ADDRESS=${token.address}`);
  console.log(`VITE_TOKEN_ADDRESS=${token.address}`);
  console.log("==================================================");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
