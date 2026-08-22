/**
 * Unified Strategy Manager & Circuit Breaker for FairWork AI Assistant
 */

const OpenAIProvider = require("./openaiProvider")
const GeminiProvider = require("./geminiProvider")
const FallbackProvider = require("./fallbackProvider")

function getProviders() {
  const providers = []
  if (process.env.OPENAI_API_KEY) {
    providers.push(new OpenAIProvider(process.env.OPENAI_API_KEY))
  }
  if (process.env.GEMINI_API_KEY) {
    providers.push(new GeminiProvider(process.env.GEMINI_API_KEY))
  }
  providers.push(new FallbackProvider())
  return providers
}

async function* streamChat(userQuery, pageContext, abortSignal = null) {
  const providers = getProviders()
  for (const provider of providers) {
    try {
      yield* provider.chatStream(userQuery, pageContext, abortSignal)
      return
    } catch (err) {
      if (abortSignal?.aborted) return
      console.warn(`[AI CircuitBreaker] ${provider.name} failed: ${err.message}. Failing over...`)
    }
  }
}

async function generateProjectScope(prompt, budget) {
  const providers = getProviders()
  for (const provider of providers) {
    try {
      return await provider.generateProjectScope(prompt, budget)
    } catch (err) {
      console.warn(`[AI CircuitBreaker] ${provider.name} failed: ${err.message}. Failing over...`)
    }
  }
  throw new Error("All AI providers failed to generate project scope.")
}

async function generateProposal(projectTitle, projectDescription) {
  const providers = getProviders()
  for (const provider of providers) {
    try {
      return await provider.generateProposal(projectTitle, projectDescription)
    } catch (err) {
      console.warn(`[AI CircuitBreaker] ${provider.name} failed: ${err.message}. Failing over...`)
    }
  }
  throw new Error("All AI providers failed to generate proposal.")
}

module.exports = {
  streamChat,
  generateProjectScope,
  generateProposal,
}
