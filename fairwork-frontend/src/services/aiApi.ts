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
            else if (parsed.token) onToken(parsed.token)
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
