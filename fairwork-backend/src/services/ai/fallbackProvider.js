/**
 * Offline Mock Provider for FairWork AI Assistant
 * Hardened with accurate FairWork Web3 Freelance Marketplace knowledge.
 */

const { balanceMilestones } = require("./budgetBalancer");

class FallbackProvider {
  name = "FallbackProvider";

  async *chatStream(userQuery, pageContext, abortSignal = null) {
    const q = (userQuery || "").toLowerCase();
    let responseText = "";

    if (q.includes("not release") || q.includes("payment") || q.includes("release") || q.includes("escrow") || q.includes("fund")) {
      responseText =
        "Payments on FairWork are secured in the Sepolia USDC Escrow contract (0xc0d1b74a30a82d6fb846e446758a8c2ff391376c). Payment is released once: 1) The freelancer submits the deliverable for the milestone, and 2) The client reviews and clicks 'Approve Milestone & Release Payment'. Once approved, USDC transfers directly into the freelancer's wallet. If a payment is not releasing, ensure the deliverable is submitted and the client wallet is connected with sufficient gas to approve.";
    } else if (q.includes("contract") || q.includes("agreement") || q.includes("generate")) {
      responseText =
        "FairWork freelance contracts are legally structured agreements tied to your project milestones and budget. Contracts are generated automatically when a client accepts a freelancer's proposal. To view or generate your contract, open the project's 'Contract' tab and click 'Generate Contract'. Both client and freelancer can digitally sign the agreement directly on FairWork.";
    } else if (q.includes("profile") || q.includes("hire") || q.includes("applicant") || q.includes("freelancer")) {
      responseText =
        "Before approving a proposal, clients can inspect the applicant's complete profile by clicking 'View Profile' on any proposal in the Applications tab. The profile displays their join date, reputation score, star ratings, verified GitHub account link and identity badge, bio, hourly rate, skills, and past completed projects. If satisfied, the client can click 'Hire Freelancer' to accept their proposal.";
    } else if (q.includes("faucet") || q.includes("balance") || q.includes("usdc") || q.includes("token")) {
      responseText =
        "FairWork uses USDC on Ethereum Sepolia Testnet (0xf21bdf6737a3009359f9ec1fa515e6d74702f575). Clients must have enough USDC in their connected Web3 wallet to post projects and fund escrows. You can mint 1,000 free testnet USDC with 1 click using the 'Mint Testnet USDC' faucet in your Wallet tab.";
    } else if (q.includes("gas") || q.includes("fee") || q.includes("sepolia") || q.includes("eth")) {
      responseText =
        "FairWork operates on Ethereum Sepolia Testnet settling in USDC. Small amounts of Sepolia ETH are required for transaction gas when funding escrows or releasing milestone payments. Sepolia ETH can be obtained from free public testnet faucets.";
    } else if (q.includes("dispute") || q.includes("refund") || q.includes("arbitrat")) {
      responseText =
        "If a deliverable disagreement occurs, either party can open a dispute. The dispute is arbitrated on-chain via DisputeContract.sol (0x0423025a6a8c4bbbe1f9ecf0cb5d4542ac5b7193), ensuring fair resolution based on submitted evidence.";
    } else if (q.includes("oauth") || q.includes("verify") || q.includes("email") || q.includes("login") || q.includes("sign")) {
      responseText =
        "FairWork enforces Google & GitHub OAuth 2.0 with PKCE security and verified email assertion. Real-world email signups are automatically verified, giving you full access to create projects, submit proposals, fund escrows, and chat in the workroom.";
    } else {
      responseText =
        "Hello! I am FairWork Ask AI, your expert assistant for the FairWork Web3 Freelance Marketplace. I can assist you with project scopes, milestone payments, contract agreements, freelancer profile inspection, and Web3 wallet escrow. How can I help you today?";
    }

    const words = responseText.split(" ");
    for (const word of words) {
      if (abortSignal?.aborted) break;
      yield word + " ";
      await new Promise((r) => setTimeout(r, 30));
    }
  }

  async generateProjectScope(prompt, budget = 1000) {
    const numBudget = Number(budget) || 1000;
    const rawMilestones = [
      { title: "Requirements & System Architecture", amount: Math.round(numBudget * 0.25) },
      { title: "Core Features & Smart Contract Integration", amount: Math.round(numBudget * 0.5) },
      { title: "QA Testing & Production Deployment", amount: Math.round(numBudget * 0.25) },
    ];

    const balanced = balanceMilestones(rawMilestones, numBudget);

    return {
      title: `AI Scope: ${prompt.slice(0, 40)}`,
      category: "Web Development",
      description: `Execution plan for: ${prompt}. Includes architecture design, smart contract escrow integration, testing, and deployment on FairWork.`,
      budget: numBudget,
      milestones: balanced,
    };
  }

  async generateProposal(projectTitle, projectDescription) {
    return `Dear Client,

I am writing to submit my technical proposal for "${projectTitle || "your project"}". With deep expertise in full-stack web development and Web3 integration, I can deliver your project with high quality.

Key Highlights:
- Modular, secure code architecture adhering to modern standards
- Transparent milestone execution with Web3 USDC Escrow protection on FairWork
- Timely deliverable submissions and active communication

I am ready to begin immediately and look forward to collaborating with you.

Best regards,
Verified Freelancer`;
  }
}

module.exports = FallbackProvider;
