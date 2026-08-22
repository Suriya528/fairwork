/**
 * Production Google Gemini Provider for FairWork AI Assistant
 */

const { formatHardenedPrompt } = require("./promptHardening")
const { balanceMilestones } = require("./budgetBalancer")

class GeminiProvider {
  name = "GeminiProvider"

  constructor(apiKey) {
    this.apiKey = apiKey
  }

  async *chatStream(userQuery, pageContext, abortSignal = null) {
    const systemInstructions =
      "You are FairWork Ask AI, an expert assistant for the FairWork Web3 freelance marketplace."
    const promptText = formatHardenedPrompt({ systemInstructions, pageContext, userQuery })

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${this.apiKey}`
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: abortSignal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
      }),
    })

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`)
    const data = await response.json()

    for (const item of data) {
      if (abortSignal?.aborted) break
      const token = item.candidates?.[0]?.content?.parts?.[0]?.text
      if (token) yield token
    }
  }

  async generateProjectScope(promptText, budget = 1000) {
    const numBudget = Number(budget) || 1000
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`
    const prompt = `Generate JSON project scope for "${promptText}" with budget ${numBudget}. Return ONLY valid JSON: {"title": string, "category": string, "description": string, "milestones": [{"title": string, "amount": number}]}`

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    })

    if (!response.ok) throw new Error(`Gemini error: ${response.status}`)
    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}"
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim()
    const parsed = JSON.parse(cleanJson)

    return {
      title: parsed.title || `Scope: ${promptText.slice(0, 30)}`,
      category: parsed.category || "Web Development",
      description: parsed.description || promptText,
      budget: numBudget,
      milestones: balanceMilestones(parsed.milestones, numBudget),
    }
  }

  async generateProposal(projectTitle, projectDescription) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`
    const prompt = `Draft a freelancer proposal for project "${projectTitle}": ${projectDescription}`

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    })

    if (!response.ok) throw new Error(`Gemini error: ${response.status}`)
    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ""
  }
}

module.exports = GeminiProvider
