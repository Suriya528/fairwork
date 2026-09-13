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

  console.log("\n--- Copy these to your backend .env ---");
  console.log(`CANONICAL_ESCROW_ADDRESS=${escrow.address}`);
  console.log(`REPUTATION_CONTRACT_ADDRESS=${reputation.address}`);
  console.log(`DISPUTE_CONTRACT_ADDRESS=${dispute.address}`);
  if (governanceAddress) {
    console.log(`GOVERNANCE_MULTISIG_ADDRESS=${governanceAddress}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });