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

    if (q.includes("escrow") || q.includes("fund") || q.includes("payment")) {
      responseText =
        "FairWork Smart Contract Escrow protects both clients and freelancers. Client funds are locked in EscrowContract.sol (0x7d51b87db4df857cdd76ad63a9ace7b5c5599385) on Sepolia using USDC. Upon milestone review and approval, USDC is released directly to the freelancer's verified Web3 wallet address.";
    } else if (q.includes("gas") || q.includes("fee") || q.includes("sepolia")) {
      responseText =
        "FairWork operates on the Ethereum Sepolia Testnet settling in USDC. Small amounts of Sepolia ETH are required for transaction gas when funding escrows, signing contracts, or releasing milestone payments. Sepolia ETH can be obtained from free public testnet faucets.";
    } else if (q.includes("dispute") || q.includes("refund")) {
      responseText =
        "If a deliverable disagreement occurs, either party can open a dispute. The dispute is arbitrated on-chain via DisputeContract.sol (0x8ddbfe20695a1ddf8488ab80b443574c28024962), ensuring fair resolution based on submitted evidence.";
    } else if (q.includes("oauth") || q.includes("verify") || q.includes("email") || q.includes("login")) {
      responseText =
        "FairWork enforces Google & GitHub OAuth 2.0 with PKCE security and verified email assertion. Local email signups start as Unverified and must be verified in Settings before funding escrows, posting projects, submitting proposals, or sending chat messages.";
    } else {
      responseText =
        "Hello! I am FairWork Ask AI, your expert assistant for the FairWork Web3 Freelance Marketplace. I can assist you with project scope generation, USDC escrow workflows, proposal drafting, EIP-712 wallet verification, and platform navigation. How can I assist you today?";
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
