import { network } from "hardhat";

async function main() {
  console.log("Deploying FairWork contracts...");

  const { viem } = await network.create();

  const escrow = await viem.deployContract("EscrowContract");
  console.log("EscrowContract deployed to:", escrow.address);

  const reputation = await viem.deployContract("ReputationContract");
  console.log("ReputationContract deployed to:", reputation.address);

  const dispute = await viem.deployContract("DisputeContract");
  console.log("DisputeContract deployed to:", dispute.address);

  console.log("\n--- Copy these to your backend .env ---");
  console.log(`ESCROW_CONTRACT_ADDRESS=${escrow.address}`);
  console.log(`REPUTATION_CONTRACT_ADDRESS=${reputation.address}`);
  console.log(`DISPUTE_CONTRACT_ADDRESS=${dispute.address}`);
}

main().catch(console.error);