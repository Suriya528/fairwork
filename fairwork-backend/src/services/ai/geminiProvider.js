/**
 * Production Google Gemini Provider for FairWork AI Assistant
 * Powered by @google/genai SDK with multi-model fallback
 */

const { GoogleGenAI } = require("@google/genai");
const { formatHardenedPrompt } = require("./promptHardening");
const { balanceMilestones } = require("./budgetBalancer");

const GEMINI_MODELS = [
  "gemini-flash-lite-latest",
  "gemini-2.5-flash-lite",
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
];

const FAIRWORK_SYSTEM_INSTRUCTIONS = `
You are FairWork Ask AI, the official expert AI assistant for FairWork — a premier production-grade Web3 Decentralized Freelance Marketplace & Escrow Platform.

FAIRWORK SYSTEM SPECIFICATION & KNOWLEDGE BASE:
1. PLATFORM NATURE:
   - FairWork is a Web3 decentralized freelance marketplace connecting global clients and freelancers.
   - It is NOT Australia's Fair Work Ombudsman government labor body. Always answer in the context of the FairWork Web3 Freelance Platform.

2. WEB3 ESCROW & FINANCIAL SETTLEMENT:
   - On-Chain Escrow: Deployed on Ethereum Sepolia Testnet (EscrowContract.sol at 0xc0d1b74a30a82d6fb846e446758a8c2ff391376c).
   - Stablecoin Settlement: Strict USDC settlement invariant (USDC Contract: 0xf21bdf6737a3009359f9ec1fa515e6d74702f575).
   - Milestone Funding & Payouts: Client funds USDC into EscrowContract.sol. When the freelancer delivers the work, the client reviews and clicks "Approve Milestone & Release Payment", releasing USDC directly to the freelancer's verified Web3 wallet address.
   - Dispute Arbitration: DisputeContract.sol (0x0423025a6a8c4bbbe1f9ecf0cb5d4542ac5b7193) arbitrates contested deliverables.
   - Testnet USDC Faucet: Users can mint 1,000 free testnet USDC directly inside the Wallet tab via the built-in Sepolia Faucet.

3. LEGAL AGREEMENTS & CONTRACTS:
   - Legal Agreements are auto-generated when a client accepts a freelancer's proposal.
   - Both parties can view, review, and digitally sign the agreement in the project's "Contract" tab.
   - If not yet generated, either party can click "Generate Contract" in the Contract tab once a freelancer has been hired.

4. FREELANCER HIRING & PROFILE INSPECTION:
   - When a client posts a project and receives proposals, the client can click "View Profile" on any proposal card.
   - The profile inspection modal displays the freelancer's join date, verified GitHub account link and identity badge, reputation score, star ratings, hourly rate, skills, bio, portfolio items, and completed work history.
   - The client can directly hire the freelancer from the profile modal or proposal card.

5. SECURITY & ZERO-TRUST AUTHENTICATION:
   - OAuth 2.0: Google & GitHub OAuth 2.0 with PKCE and verified email assertion.
   - Real-World Email Verification: Local password signups require real-world email addresses. Real emails are automatically verified.
   - Web3 Wallet Verification: EIP-712 domain-separated cryptographic wallet signatures.

TONE & STYLE:
- Senior, helpful, concise, professional, and architecturally precise.
`;

class GeminiProvider {
  name = "GeminiProvider";

  constructor(apiKey) {
    this.apiKey = apiKey;
    this.ai = new GoogleGenAI({ apiKey });
  }

  async *chatStream(userQuery, pageContext, abortSignal = null) {
    const promptText = formatHardenedPrompt({
      systemInstructions: FAIRWORK_SYSTEM_INSTRUCTIONS,
      pageContext,
      userQuery,
    });

    let lastError = null;
    for (const model of GEMINI_MODELS) {
      if (abortSignal?.aborted) return;
      try {
        const responseStream = await this.ai.models.generateContentStream({
          model,
          contents: [{ role: "user", parts: [{ text: promptText }] }],
          config: {
            systemInstruction: FAIRWORK_SYSTEM_INSTRUCTIONS,
          },
        });

        for await (const chunk of responseStream) {
          if (abortSignal?.aborted) return;
          if (chunk.text) {
            yield chunk.text;
          }
        }
        return; // Stream succeeded
      } catch (err) {
        lastError = err;
        console.warn(`[GeminiProvider] model ${model} stream error: ${err.message}. Trying next model...`);
      }
    }
    if (lastError) throw lastError;
  }

  async generateProjectScope(promptText, budget = 1000) {
    const numBudget = Number(budget) || 1000;
    const prompt = `Generate JSON project scope for "${promptText}" with budget $${numBudget} USDC.
Return ONLY valid JSON:
{
  "title": "Descriptive Project Title",
  "category": "Web Development",
  "description": "Comprehensive technical description",
  "milestones": [
    { "title": "Milestone 1 Title", "amount": ${Math.round(numBudget * 0.3)} },
    { "title": "Milestone 2 Title", "amount": ${Math.round(numBudget * 0.4)} },
    { "title": "Milestone 3 Title", "amount": ${Math.round(numBudget * 0.3)} }
  ]
}`;

    for (const model of GEMINI_MODELS) {
      try {
        const res = await this.ai.models.generateContent({
          model,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            systemInstruction: FAIRWORK_SYSTEM_INSTRUCTIONS,
          },
        });

        const text = res.text || "{}";
        const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
        let parsed = {};
        try {
          parsed = JSON.parse(cleanJson);
        } catch {
          parsed = {};
        }

        return {
          title: parsed.title || `Scope: ${promptText.slice(0, 40)}`,
          category: parsed.category || "Web Development",
          description: parsed.description || promptText,
          budget: numBudget,
          milestones: balanceMilestones(parsed.milestones, numBudget),
        };
      } catch (err) {
        console.warn(`[GeminiProvider] model ${model} project scope error: ${err.message}`);
      }
    }
    throw new Error("All Gemini models failed for project scope.");
  }

  async generateProposal(projectTitle, projectDescription) {
    const prompt = `Draft a high-converting, professional freelancer proposal for project titled "${projectTitle}": ${projectDescription}. Emphasize Web3 USDC escrow safety, technical approach, and timely milestone delivery.`;

    for (const model of GEMINI_MODELS) {
      try {
        const res = await this.ai.models.generateContent({
          model,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            systemInstruction: FAIRWORK_SYSTEM_INSTRUCTIONS,
          },
        });

        if (res.text) return res.text;
      } catch (err) {
        console.warn(`[GeminiProvider] model ${model} proposal error: ${err.message}`);
      }
    }
    throw new Error("All Gemini models failed for proposal drafting.");
  }
}

module.exports = GeminiProvider;
