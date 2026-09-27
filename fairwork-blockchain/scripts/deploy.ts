import { network } from "hardhat";

async function main() {
  console.log("Deploying FairWork contracts...");

  const { viem } = await network.create();
  const [deployer] = await viem.getWalletClients();
  const deployerAddress = deployer.account.address;
  const arbitratorAddress = (process.env.ARBITRATOR_ADDRESS || deployerAddress) as `0x${string}`;
  console.log("Deployer Address:", deployerAddress);
  console.log("Configured Arbitrator Address:", arbitratorAddress);

  const escrow = await viem.deployContract("EscrowContract");
  console.log("EscrowContract deployed to:", escrow.address);

  // ReputationContract requires escrow address for access control
  const reputation = await viem.deployContract("ReputationContract", [escrow.address]);
  console.log("ReputationContract deployed to:", reputation.address);

  // DisputeContract: Ownable (deployer=owner), settable arbitrator
  const dispute = await viem.deployContract("DisputeContract", [escrow.address, arbitratorAddress]);
  console.log("DisputeContract deployed to:", dispute.address);

  // Link DisputeContract to EscrowContract
  await escrow.write.setDisputeContract([dispute.address]);
  console.log("DisputeContract successfully linked to EscrowContract.");

  // Optional: Transfer ownership to multi-sig governance or TimelockController
  const governanceAddress = process.env.GOVERNANCE_MULTISIG_ADDRESS as `0x${string}` | undefined;
  if (governanceAddress) {
    console.log(`\nTransferring contract ownership to Governance Multi-Sig: ${governanceAddress}`);
    await escrow.write.transferOwnership([governanceAddress]);
    await dispute.write.transferOwnership([governanceAddress]);
    console.log("Ownership transferred to Governance Multi-Sig successfully.");
  }

  const publicClient = await viem.getPublicClient();
  const chainId = await publicClient.getChainId();

  const NATIVE_USDC: Record<number, string> = {
    1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Ethereum Mainnet (Circle USDC)
    8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base Mainnet (Circle native USDC)
    42161: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // Arbitrum One (Circle native USDC)
    137: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", // Polygon PoS (Circle native USDC)
    11155111: "0xf21bdf6737a3009359f9ec1fa515e6d74702f575", // Sepolia Test mUSDC
  };
  const tokenAddress = process.env.CANONICAL_TOKEN_ADDRESS || NATIVE_USDC[chainId] || "0x0000000000000000000000000000000000000000";

  console.log("\n=======================================================");
  console.log("=== FairWork Real-Money Environment Variables ===");
  console.log("=======================================================");
  console.log(`CHAIN_ID=${chainId}`);
  console.log(`CANONICAL_ESCROW_ADDRESS=${escrow.address}`);
  console.log(`CANONICAL_TOKEN_ADDRESS=${tokenAddress}`);
  console.log(`REPUTATION_CONTRACT_ADDRESS=${reputation.address}`);
  console.log(`DISPUTE_CONTRACT_ADDRESS=${dispute.address}`);
  if (governanceAddress) {
    console.log(`GOVERNANCE_MULTISIG_ADDRESS=${governanceAddress}`);
  }
  console.log("\n--- Frontend (.env) ---");
  console.log(`VITE_CHAIN_ID=${chainId}`);
  console.log(`VITE_ESCROW_CONTRACT_ADDRESS=${escrow.address}`);
  console.log(`VITE_USDC_ADDRESS=${tokenAddress}`);
  console.log(`VITE_DISPUTE_CONTRACT_ADDRESS=${dispute.address}`);
  console.log(`VITE_REPUTATION_ADDRESS=${reputation.address}`);
  console.log("=======================================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });