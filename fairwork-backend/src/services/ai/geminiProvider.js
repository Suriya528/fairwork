/**
 * Production Google Gemini Provider for FairWork AI Assistant
 * Powered by @google/genai SDK with gemini-3.6-flash
 */

const { GoogleGenAI } = require("@google/genai");
const { formatHardenedPrompt } = require("./promptHardening");
const { balanceMilestones } = require("./budgetBalancer");

const FAIRWORK_SYSTEM_INSTRUCTIONS = `
You are FairWork Ask AI, the official expert AI assistant for FairWork — a premier production-grade Web3 Decentralized Freelance Marketplace & Escrow Platform.

FAIRWORK SYSTEM SPECIFICATION & KNOWLEDGE BASE:
1. PLATFORM NATURE:
   - FairWork is a Web3 decentralized freelance marketplace connecting global clients and freelancers.
   - It is NOT Australia's Fair Work Ombudsman government labor body. Always answer in the context of the FairWork Web3 Freelance Platform.

2. WEB3 ESCROW & FINANCIAL SETTLEMENT:
   - On-Chain Escrow: Deployed on Ethereum Sepolia Testnet (EscrowContract.sol at 0x7d51b87db4df857cdd76ad63a9ace7b5c5599385).
   - Stablecoin Settlement: Strict USDC settlement invariant (USDC Contract: 0xf21bdf6737a3009359f9ec1fa515e6d74702f575).
   - Milestone Funding & Payouts: Client funds USDC into EscrowContract.sol. Upon milestone approval, USDC releases directly to the freelancer's verified Web3 wallet address.
   - Dispute Arbitration: DisputeContract.sol (0x8ddbfe20695a1ddf8488ab80b443574c28024962) arbitrates contested deliverables.

3. SECURITY & ZERO-TRUST AUTHENTICATION:
   - OAuth 2.0: Google OAuth 2.0 & GitHub OAuth 2.0 with email_verified === true assertion, RFC 7636 PKCE (code_verifier + code_challenge), signed state CSRF tokens, and 60s single-use exchange codes (OAuthCode).
   - Zero-Trust Email Policy: Local password signups start as Unverified (isEmailVerified = false). Unverified users CANNOT create projects, fund escrows, submit deliverables, submit proposals, upload files, or send chat messages until they verify their email in Settings.
   - Web3 Wallet Verification: EIP-712 domain-separated cryptographic wallet signatures.

4. PLATFORM FEATURES & UI:
   - Workroom Chat: Real-time Socket.IO chat with typing indicators, read receipts, and file attachments.
   - Financial Metrics: Displays Total Earned USDC (freelancer) and Total Spent USDC (client).
   - Display Currencies: Supports toggling between USD ($ / USDC settlement) and INR (₹ estimated display).
   - Public Profiles: Showcase verified Web3 work history and client reviews while stripping PII (email, password).

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

    const responseStream = await this.ai.models.generateContentStream({
      model: "gemini-3.6-flash",
      contents: [{ role: "user", parts: [{ text: promptText }] }],
      config: {
        systemInstruction: FAIRWORK_SYSTEM_INSTRUCTIONS,
      },
    });

    for await (const chunk of responseStream) {
      if (abortSignal?.aborted) break;
      if (chunk.text) {
        yield chunk.text;
      }
    }
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

    const res = await this.ai.models.generateContent({
      model: "gemini-3.6-flash",
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
  }

  async generateProposal(projectTitle, projectDescription) {
    const prompt = `Draft a high-converting, professional freelancer proposal for project titled "${projectTitle}": ${projectDescription}. Emphasize Web3 USDC escrow safety, technical approach, and timely milestone delivery.`;

    const res = await this.ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: FAIRWORK_SYSTEM_INSTRUCTIONS,
      },
    });

    return res.text || "";
  }
}

module.exports = GeminiProvider;
