/**
 * Production OpenAI LLM Provider for FairWork AI Assistant
 */

const { formatHardenedPrompt } = require("./promptHardening")
const { balanceMilestones } = require("./budgetBalancer")

class OpenAIProvider {
  name = "OpenAIProvider"

  constructor(apiKey) {
    this.apiKey = apiKey
  }

  async *chatStream(userQuery, pageContext, abortSignal = null) {
    const systemInstructions =
      "You are FairWork Ask AI, an expert assistant for the FairWork Web3 freelance marketplace. Help users with escrow payments, gas fees, milestones, proposals, and contract signing."

    const prompt = formatHardenedPrompt({ systemInstructions, pageContext, userQuery })

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      signal: abortSignal,
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: prompt }],
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder("utf-8")
    let buffer = ""

    while (true) {
      if (abortSignal?.aborted) break
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith("data: ")) {
          const dataStr = trimmed.replace("data: ", "")
          if (dataStr === "[DONE]") return
          try {
            const parsed = JSON.parse(dataStr)
            const token = parsed.choices?.[0]?.delta?.content
            if (token) yield token
          } catch {
            // Ignore parse errors on stream end
          }
        }
      }
    }
  }

  async generateProjectScope(promptText, budget = 1000) {
    const numBudget = Number(budget) || 1000
    const systemPrompt = `You are a project manager on FairWork. Generate a structured JSON project scope for prompt: "${promptText}" with budget: ${numBudget}. Output format MUST be a valid JSON object matching: {"title": string, "category": string, "description": string, "milestones": [{"title": string, "amount": number}]}`

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: systemPrompt }],
      }),
    })

    if (!response.ok) throw new Error(`OpenAI error: ${response.status}`)
    const data = await response.json()
    const parsed = JSON.parse(data.choices[0].message.content)

    return {
      title: parsed.title || `Scope: ${promptText.slice(0, 30)}`,
      category: parsed.category || "Web Development",
      description: parsed.description || promptText,
      budget: numBudget,
      milestones: balanceMilestones(parsed.milestones, numBudget),
    }
  }

  async generateProposal(projectTitle, projectDescription) {
    const prompt = `Draft a high-converting freelancer proposal for project "${projectTitle}": ${projectDescription}`
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      }),
    })
    if (!response.ok) throw new Error(`OpenAI error: ${response.status}`)
    const data = await response.json()
    return data.choices[0].message.content
  }
}

module.exports = OpenAIProvider
