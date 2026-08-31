const { streamChat, generateProjectScope, generateProposal } = require("../services/ai/aiService")

/**
 * Server-Sent Events (SSE) Stream Controller for FairWork AI Chat
 *
 * Implements:
 *  - Stream Backpressure handling (awaiting 'drain' if res.write returns false)
 *  - Proxy buffer bypass headers (Nginx/Cloudflare/Express compression)
 *  - 15-second idle heartbeat ping (: ping\n\n) to maintain ALB connections
 *  - Teardown lifecycle bound to req.on('close') clearing timers & aborting streams
 */
exports.chatStream = async (req, res) => {
  const abortController = new AbortController()
  let heartbeatTimer = null

  const cleanup = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
    abortController.abort()
  }

  req.on("close", cleanup)

  try {
    const userQuery = req.body?.q || req.query?.q || ""
    let pageContext = req.body?.context || null;
    if (!pageContext && req.query?.context) {
      try { pageContext = JSON.parse(req.query.context); } catch { pageContext = null; }
    }

    if (!userQuery.trim()) {
      return res.status(400).json({ message: "Payload property 'q' is required." })
    }

    // Set zero-buffering headers for proxies & compression middleware
    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache, no-transform")
    res.setHeader("Connection", "keep-alive")
    res.setHeader("X-Accel-Buffering", "no")
    res.setHeader("x-no-compression", "1")
    res.flushHeaders?.()

    // Function to send 15s heartbeat comment ping to keep connection alive through ALBs
    const resetHeartbeat = () => {
      if (heartbeatTimer) clearInterval(heartbeatTimer)
      heartbeatTimer = setInterval(() => {
        if (!res.writableEnded && !abortController.signal.aborted) {
          const ok = res.write(": ping\n\n")
          if (!ok) {
            // Respect socket backpressure on ping
            res.once("drain", () => {})
          }
        }
      }, 15000)
    }

    resetHeartbeat()

    const stream = streamChat(userQuery, pageContext, abortController.signal)
    for await (const token of stream) {
      if (abortController.signal.aborted) break
      resetHeartbeat()

      // Respect Stream Backpressure for slow mobile consumers
      const writeOk = res.write(`data: ${JSON.stringify({ token })}\n\n`)
      if (!writeOk) {
        await new Promise((resolve) => res.once("drain", resolve))
      }
    }

    if (!abortController.signal.aborted && !res.writableEnded) {
      res.write("data: [DONE]\n\n")
      res.end()
    }
  } catch (err) {
    console.error("[AIController] stream error:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "AI stream error" })
    } else if (!res.writableEnded) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: "Stream interrupted" })}\n\n`)
      res.end()
    }
  } finally {
    cleanup()
  }
}

/**
 * REST Endpoint for AI Project Scope & Milestone Generator
 */
exports.generateProject = async (req, res) => {
  try {
    const { prompt, budget } = req.body
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ message: "Prompt is required." })
    }
    const numBudget = Number(budget)
    if (isNaN(numBudget) || numBudget <= 0) {
      return res.status(400).json({ message: "A positive budget is required." })
    }

    const scope = await generateProjectScope(prompt.trim(), numBudget)
    res.json(scope)
  } catch (err) {
    console.error("[AIController] generateProject error:", err);
    res.status(500).json({ message: "Failed to generate project scope." })
  }
}

/**
 * REST Endpoint for AI Proposal Drafting Assistant
 */
exports.generateProposalDraft = async (req, res) => {
  try {
    const { projectTitle, projectDescription } = req.body
    if (!projectTitle && !projectDescription) {
      return res.status(400).json({ message: "Project title or description is required." })
    }

    const proposal = await generateProposal(projectTitle || "", projectDescription || "")
    res.json({ proposal })
  } catch (err) {
    console.error("[AIController] generateProposal error:", err);
    res.status(500).json({ message: "Failed to generate proposal." })
  }
}
