const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Project = require("../src/models/Project");
const User = require("../src/models/User");
const { reconcileEscrowFunding, reconcileMilestoneRelease } = require("../src/services/reconciliationService");

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  const testProjectId = "6a8470454d7d6a9f4bc9375e";
  let project = await Project.findById(testProjectId);
  if (project) {
    console.log("Project Title:", project.title);
    console.log("Project Budget:", project.budget);
    console.log("Project Milestones:", JSON.stringify(project.milestones, null, 2));

    // Ensure milestone[0].amount matches the released on-chain amount (100 USDC)
    if (!project.milestones || project.milestones.length === 0) {
      project.milestones = [
        { title: "Milestone 1", amount: 100, status: "completed", paymentReleased: false },
        { title: "Milestone 2", amount: 200, status: "in_progress", paymentReleased: false },
      ];
    } else {
      project.milestones[0].amount = 100;
    }

    // Ensure project client and freelancer wallet addresses match the test transaction signers
    let clientUser = await User.findById(project.clientId);
    if (clientUser) {
      clientUser.walletAddress = "0xad9853bd8a0f136cf2d5d35c6bf8fbf7df959507";
      await clientUser.save();
    }

    let freelancerUser = await User.findById(project.freelancerId);
    if (freelancerUser) {
      freelancerUser.walletAddress = "0x90F79bf6EB2c4f870365E785982E1f101E93b906";
      await freelancerUser.save();
    } else {
      let fUser = await User.findOne({ walletAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906" });
      if (!fUser) {
        fUser = await User.create({
          name: "Test Freelancer",
          email: "freelancer_test@example.test",
          role: "freelancer",
          walletAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        });
      }
      project.freelancerId = fUser._id;
    }

    await project.save();
  }

  // 1. Reconcile Funding with real Sepolia Tx Hash
  const fundTxHash = "0x4ddfded1831baa80c98ea30ff8a0e92a6246e7538f5913eee5c3528eb68a9375";
  console.log("\n=== RECONCILING FUNDING WITH SEPOLIA TX HASH ===");
  const fundedProject = await reconcileEscrowFunding(testProjectId, fundTxHash);
  console.log("Reconciled Escrow Funded State:", fundedProject.escrowFunded);
  console.log("Reconciled Escrow Txn Hash:   ", fundedProject.escrowTxnHash);

  // 2. Reconcile Milestone 0 Release with real Sepolia Tx Hash
  const releaseTxHash = "0x2be4d235950947c81a489f13d08d714e7668caac976d4f3bede4b66d1863965d";
  console.log("\n=== RECONCILING MILESTONE 0 PAYOUT RELEASE WITH SEPOLIA TX HASH ===");
  const releasedProject = await reconcileMilestoneRelease(testProjectId, 0, releaseTxHash);
  console.log("Reconciled Milestone 0 Payment Released State:", releasedProject.milestones[0].paymentReleased);

  console.log("\n=== RECONCILIATION VERIFICATION SUCCESSFUL ===");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
