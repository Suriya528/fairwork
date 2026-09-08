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

  const reputation = await viem.deployContract("ReputationContract");
  console.log("ReputationContract deployed to:", reputation.address);

  const dispute = await viem.deployContract("DisputeContract", [escrow.address, arbitratorAddress]);
  console.log("DisputeContract deployed to:", dispute.address);

  // Link DisputeContract to EscrowContract
  await escrow.write.setDisputeContract([dispute.address]);
  console.log("DisputeContract successfully linked to EscrowContract.");

  console.log("\n--- Copy these to your backend .env ---");
  console.log(`CANONICAL_ESCROW_ADDRESS=${escrow.address}`);
  console.log(`REPUTATION_CONTRACT_ADDRESS=${reputation.address}`);
  console.log(`DISPUTE_CONTRACT_ADDRESS=${dispute.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });