/**
 * Offline Mock Provider for FairWork AI Assistant
 */

const { balanceMilestones } = require("./budgetBalancer")

class FallbackProvider {
  name = "FallbackProvider"

  async *chatStream(userQuery, pageContext, abortSignal = null) {
    const q = (userQuery || "").toLowerCase()
    let responseText = ""

    if (q.includes("escrow") || q.includes("fund")) {
      responseText =
        "FairWork Escrow protects both client and freelancer funds. When a client deposits funds, they are locked safely inside the deployed Sepolia EscrowContract.sol smart contract until milestones are reviewed and approved. Once approved, payment is released directly to the freelancer's verified wallet address."
    } else if (q.includes("gas") || q.includes("fee")) {
      responseText =
        "FairWork operates on the Ethereum Sepolia Testnet. Small amounts of Sepolia ETH are required to cover gas fees when creating contracts, funding escrows, or releasing milestone payments. You can get free Sepolia ETH from public Sepolia faucets."
    } else if (q.includes("dispute") || q.includes("refund")) {
      responseText =
        "If a disagreement arises regarding milestone deliverables, either party can initiate a dispute. The assigned arbiter reviews submitted work deliverables and evidence before issuing an on-chain resolution via DisputeContract.sol."
    } else {
      responseText =
        "Hello! I am your FairWork Ask AI assistant. I can assist you with project milestone planning, Web3 escrow guidance, proposal drafting, and platform navigation. How can I help you today?"
    }

    const words = responseText.split(" ")
    for (const word of words) {
      if (abortSignal?.aborted) break
      yield word + " "
      await new Promise((r) => setTimeout(r, 40))
    }
  }

  async generateProjectScope(prompt, budget = 1000) {
    const numBudget = Number(budget) || 1000
    const rawMilestones = [
      { title: "Requirements & System Architecture", amount: Math.round(numBudget * 0.25) },
      { title: "Core Features & API Integration", amount: Math.round(numBudget * 0.5) },
      { title: "QA Testing & Production Deployment", amount: Math.round(numBudget * 0.25) },
    ]

    const balanced = balanceMilestones(rawMilestones, numBudget)

    return {
      title: `AI-Generated Scope: ${prompt.slice(0, 40)}`,
      category: "Web Development",
      description: `Comprehensive project execution plan for: ${prompt}. Includes setup, backend integration, frontend design, testing, and production deployment on FairWork.`,
      budget: numBudget,
      milestones: balanced,
    }
  }

  async generateProposal(projectTitle, projectDescription) {
    return `Dear Client,

I am excited to submit my proposal for "${projectTitle || "your project"}". With extensive experience in modern web development and Web3 integration, I can deliver your project efficiently with high quality.

Key Highlights of My Approach:
- Clean, modular architecture adhering to best practices
- Regular milestone delivery with clear progress updates
- Full transparency backed by FairWork Web3 Escrow protection

I am ready to start immediately and look forward to discussing the milestones with you.

Best regards,
Assigned Freelancer`
  }
}

module.exports = FallbackProvider
