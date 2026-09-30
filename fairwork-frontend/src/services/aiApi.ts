/**
 * Production Frontend API Service for FairWork AI Assistant
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

export interface GeneratedMilestone {
  title: string
  amount: number
  dueDate?: string
}

export interface GeneratedProjectScope {
  title: string
  category: string
  description: string
  budget: number
  milestones: GeneratedMilestone[]
}

function getFallbackResponse(query: string): string {
  const q = (query || "").toLowerCase()
  if (q.includes("not release") || q.includes("payment") || q.includes("release") || q.includes("escrow") || q.includes("fund")) {
    return "Payments on FairWork are secured in the Sepolia USDC Escrow contract (0xc0d1b74a30a82d6fb846e446758a8c2ff391376c). Payment is released once: 1) The freelancer submits the deliverable for the milestone, and 2) The client reviews and clicks 'Approve Milestone & Release Payment'. Once approved, USDC transfers directly into the freelancer's wallet. If a payment is not releasing, ensure the deliverable is submitted and the client wallet is connected with sufficient gas to approve."
  }
  if (q.includes("contract") || q.includes("agreement") || q.includes("generate")) {
    return "FairWork freelance contracts are legally structured agreements tied to your project milestones and budget. Contracts are generated automatically when a client accepts a freelancer's proposal. To view or generate your contract, open the project's 'Contract' tab and click 'Generate Contract'. Both client and freelancer can digitally sign the agreement directly on FairWork."
  }
  if (q.includes("profile") || q.includes("hire") || q.includes("applicant") || q.includes("freelancer")) {
    return "Before approving a proposal, clients can inspect the applicant's complete profile by clicking 'View Profile' on any proposal in the Applications tab. The profile displays their join date, reputation score, star ratings, verified GitHub account link and identity badge, bio, hourly rate, skills, and past completed projects. If satisfied, the client can click 'Hire Freelancer' to accept their proposal."
  }
  if (q.includes("faucet") || q.includes("balance") || q.includes("usdc") || q.includes("token")) {
    return "FairWork uses USDC on Ethereum Sepolia Testnet (0xf21bdf6737a3009359f9ec1fa515e6d74702f575). Clients must have enough USDC in their connected Web3 wallet to post projects and fund escrows. You can mint 1,000 free testnet USDC with 1 click using the 'Mint Testnet USDC' faucet in your Wallet tab."
  }
  if (q.includes("gas") || q.includes("fee") || q.includes("sepolia") || q.includes("eth")) {
    return "FairWork operates on Ethereum Sepolia Testnet settling in USDC. Small amounts of Sepolia ETH are required for transaction gas when funding escrows or releasing milestone payments. Sepolia ETH can be obtained from free public testnet faucets."
  }
  if (q.includes("dispute") || q.includes("refund") || q.includes("arbitrat")) {
    return "If a deliverable disagreement occurs, either party can open a dispute. The dispute is arbitrated on-chain via DisputeContract.sol (0x0423025a6a8c4bbbe1f9ecf0cb5d4542ac5b7193), ensuring fair resolution based on submitted evidence."
  }
  if (q.includes("oauth") || q.includes("verify") || q.includes("email") || q.includes("login") || q.includes("sign")) {
    return "FairWork enforces Google & GitHub OAuth 2.0 with PKCE security and verified email assertion. Real-world email signups are automatically verified, giving you full access to create projects, submit proposals, fund escrows, and chat in the workroom."
  }
  return "Hello! I am FairWork Ask AI, your expert assistant for the FairWork Web3 Freelance Marketplace. I can assist you with project scopes, milestone payments, contract agreements, freelancer profile inspection, and Web3 wallet escrow. How can I help you today?"
}

/**
 * Consumes SSE readable stream via POST request for AI Co-Pilot chat with AbortSignal support.
 */
export async function streamAiChat(
  token: string,
  userQuery: string,
  context: unknown,
  onToken: (token: string) => void,
  onError: (err: string) => void,
  onComplete: () => void,
  signal?: AbortSignal,
) {
  let tokensEmitted = 0

  try {
    const response = await fetch(`${API_URL}/ai/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      signal,
      body: JSON.stringify({
        q: userQuery,
        context,
      }),
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      throw new Error(errData.message || `HTTP error ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error("ReadableStream not supported")

    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      if (signal?.aborted) {
        try {
          reader.cancel()
        } catch {
          // Reader lock already released
        }
        break
      }

      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith(": ping")) continue // Ignore 15s keep-alive comment pings
        if (trimmed.startsWith("event: error")) {
          onError("Stream interrupted by server.")
          return
        }
        if (trimmed.startsWith("data: ")) {
          const dataContent = trimmed.replace("data: ", "")
          if (dataContent === "[DONE]") {
            onComplete()
            return
          }
          try {
            const parsed = JSON.parse(dataContent)
            if (parsed.error || parsed.message) onError(parsed.error || parsed.message)
            else if (parsed.token) {
              tokensEmitted++
              onToken(parsed.token)
            }
          } catch {
            // Ignore parse errors on chunk boundaries
          }
        }
      }
    }
    if (!signal?.aborted) onComplete()
  } catch (err) {
    if (signal?.aborted || (err instanceof DOMException && err.name === "AbortError")) {
      // Aborted intentionally by user / drawer close
      return
    }

    // Graceful offline fallback: if network failed before any token arrived, stream accurate local knowledge
    if (tokensEmitted === 0) {
      const fallbackText = getFallbackResponse(userQuery)
      const words = fallbackText.split(" ")
      for (const word of words) {
        if (signal?.aborted) return
        onToken(word + " ")
        await new Promise((r) => setTimeout(r, 20))
      }
      onComplete()
      return
    }

    onError(err instanceof Error ? err.message : "Failed to connect to AI Co-Pilot.")
  }
}

/**
 * Generate AI Project Scope & Balanced Milestones
 */
export async function generateAiProjectScope(
  prompt: string,
  budget: number,
  token: string,
): Promise<GeneratedProjectScope> {
  const response = await fetch(`${API_URL}/ai/generate-project`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ prompt, budget }),
  })

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    throw new Error(errData.message || "Failed to generate project scope.")
  }

  return response.json()
}

/**
 * Generate AI Proposal Draft for Freelancers
 */
export async function generateAiProposal(
  projectTitle: string,
  projectDescription: string,
  token: string,
): Promise<string> {
  const response = await fetch(`${API_URL}/ai/generate-proposal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ projectTitle, projectDescription }),
  })

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    throw new Error(errData.message || "Failed to generate proposal draft.")
  }

  const data = await response.json()
  return data.proposal || ""
}
