import { network } from "hardhat";

async function main() {
  console.log("=== EXECUTING REAL ON-CHAIN SEPOLIA ESCROW TRANSACTION FLOW ===");

  const { viem } = await network.create();
  const [deployer] = await viem.getWalletClients();
  const publicClient = await viem.getPublicClient();

  const tokenAddress = "0xf21bdf6737a3009359f9ec1fa515e6d74702f575";
  const escrowAddress = "0x7d51b87db4df857cdd76ad63a9ace7b5c5599385";
  const testProjectId = "6a8470454d7d6a9f4bc9375e"; // Valid 24-character MongoDB ObjectId
  const freelancerWallet = "0x90F79bf6EB2c4f870365E785982E1f101E93b906";
  const milestoneAmounts = [100n * 10n ** 6n, 200n * 10n ** 6n]; // $100 and $200 (6 decimals)
  const totalFunding = 300n * 10n ** 6n;

  console.log("Deployer / Client Wallet:", deployer.account.address);
  console.log("Test Project ID:         ", testProjectId);
  console.log("Token Address:           ", tokenAddress);
  console.log("Escrow Contract Address: ", escrowAddress);

  // 1. Create Escrow on-chain
  console.log("\n1. Calling createEscrow on EscrowContract...");
  const createTx = await deployer.writeContract({
    address: escrowAddress as `0x${string}`,
    abi: [
      {
        type: "function",
        name: "createEscrow",
        stateMutability: "nonpayable",
        inputs: [
          { type: "string", name: "projectId" },
          { type: "address", name: "freelancer" },
          { type: "address", name: "token" },
          { type: "uint256[]", name: "milestoneAmounts" },
        ],
        outputs: [],
      },
    ],
    functionName: "createEscrow",
    args: [testProjectId, freelancerWallet as `0x${string}`, tokenAddress as `0x${string}`, milestoneAmounts],
  });
  console.log("-> Sent createEscrow Tx:", createTx);
  const createReceipt = await publicClient.waitForTransactionReceipt({ hash: createTx });
  console.log("-> CreateEscrow Receipt Status:", createReceipt.status, "| Block Number:", createReceipt.blockNumber.toString());

  // 2. Approve Token Allowance
  console.log("\n2. Calling approve on Token Contract...");
  const approveTx = await deployer.writeContract({
    address: tokenAddress as `0x${string}`,
    abi: [
      {
        type: "function",
        name: "approve",
        stateMutability: "nonpayable",
        inputs: [
          { type: "address", name: "spender" },
          { type: "uint256", name: "amount" },
        ],
        outputs: [{ type: "bool" }],
      },
    ],
    functionName: "approve",
    args: [escrowAddress as `0x${string}`, totalFunding],
  });
  console.log("-> Sent approve Tx:", approveTx);
  const approveReceipt = await publicClient.waitForTransactionReceipt({ hash: approveTx });
  console.log("-> Approve Receipt Status:", approveReceipt.status, "| Block Number:", approveReceipt.blockNumber.toString());

  // 3. Fund Escrow on-chain
  console.log("\n3. Calling fund on EscrowContract...");
  const fundTx = await deployer.writeContract({
    address: escrowAddress as `0x${string}`,
    abi: [
      {
        type: "function",
        name: "fund",
        stateMutability: "nonpayable",
        inputs: [{ type: "string", name: "projectId" }],
        outputs: [],
      },
    ],
    functionName: "fund",
    args: [testProjectId],
  });
  console.log("-> Sent fund Tx:", fundTx);
  const fundReceipt = await publicClient.waitForTransactionReceipt({ hash: fundTx });
  console.log("-> Fund Receipt Status:", fundReceipt.status, "| Block Number:", fundReceipt.blockNumber.toString());

  // 4. Release Milestone 0 on-chain
  console.log("\n4. Calling releaseMilestone(0) on EscrowContract...");
  const releaseTx = await deployer.writeContract({
    address: escrowAddress as `0x${string}`,
    abi: [
      {
        type: "function",
        name: "releaseMilestone",
        stateMutability: "nonpayable",
        inputs: [
          { type: "string", name: "projectId" },
          { type: "uint256", name: "index" },
        ],
        outputs: [],
      },
    ],
    functionName: "releaseMilestone",
    args: [testProjectId, 0n],
  });
  console.log("-> Sent releaseMilestone Tx:", releaseTx);
  const releaseReceipt = await publicClient.waitForTransactionReceipt({ hash: releaseTx });
  console.log("-> Release Receipt Status:", releaseReceipt.status, "| Block Number:", releaseReceipt.blockNumber.toString());

  // 5. Query Escrow Parties state on-chain
  const parties = await publicClient.readContract({
    address: escrowAddress as `0x${string}`,
    abi: [
      {
        type: "function",
        name: "getEscrowParties",
        stateMutability: "view",
        inputs: [{ type: "string", name: "projectId" }],
        outputs: [
          { type: "address", name: "client" },
          { type: "address", name: "freelancer" },
          { type: "bool", name: "isFunded" },
          { type: "bool", name: "isDisputed" },
          { type: "bool", name: "isCompleted" },
        ],
      },
    ],
    functionName: "getEscrowParties",
    args: [testProjectId],
  });

  console.log("\n==================================================");
  console.log("REAL SEPOLIA ON-CHAIN TRANSACTION EVIDENCE LOG:");
  console.log("==================================================");
  console.log("Project ID:              ", testProjectId);
  console.log("Client Public Wallet:    ", deployer.account.address);
  console.log("Freelancer Wallet:       ", freelancerWallet);
  console.log("Chain ID:                ", 11155111, "(Sepolia)");
  console.log("Escrow Contract:         ", escrowAddress);
  console.log("Token Contract:          ", tokenAddress);
  console.log("Funding Tx Hash:         ", fundTx);
  console.log("Funding Block Number:    ", fundReceipt.blockNumber.toString());
  console.log("Release Tx Hash:         ", releaseTx);
  console.log("Release Block Number:    ", releaseReceipt.blockNumber.toString());
  console.log("On-Chain isFunded:       ", parties[2]);
  console.log("On-Chain isCompleted:    ", parties[4]);
  console.log("==================================================");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
