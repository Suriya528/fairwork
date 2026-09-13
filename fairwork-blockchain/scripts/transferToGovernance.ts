import { network } from "hardhat";

async function main() {
  const escrowAddress = process.env.CANONICAL_ESCROW_ADDRESS as `0x${string}`;
  const disputeAddress = process.env.DISPUTE_CONTRACT_ADDRESS as `0x${string}`;
  const governanceAddress = process.env.GOVERNANCE_MULTISIG_ADDRESS as `0x${string}`;

  if (!escrowAddress || !disputeAddress || !governanceAddress) {
    throw new Error(
      "Missing required env vars: CANONICAL_ESCROW_ADDRESS, DISPUTE_CONTRACT_ADDRESS, and GOVERNANCE_MULTISIG_ADDRESS are required."
    );
  }

  console.log("=== FairWork Contract Governance Ownership Migration ===");
  console.log("Target Multi-Sig / Timelock Address:", governanceAddress);

  const { viem } = await network.create();
  const [deployer] = await viem.getWalletClients();
  console.log("Acting Deployer Address:", deployer.account.address);

  const escrow = await viem.getContractAt("EscrowContract", escrowAddress);
  const dispute = await viem.getContractAt("DisputeContract", disputeAddress);

  console.log("1. Transferring EscrowContract ownership...");
  await escrow.write.transferOwnership([governanceAddress]);
  console.log("EscrowContract ownership transferred.");

  console.log("2. Transferring DisputeContract ownership...");
  await dispute.write.transferOwnership([governanceAddress]);
  console.log("DisputeContract ownership transferred.");

  console.log("\nGovernance migration completed successfully. All administrative functions now require multi-sig approval.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Governance migration failed:", err);
    process.exit(1);
  });
