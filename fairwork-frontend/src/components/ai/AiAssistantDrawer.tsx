import { useState, useRef, useEffect, useMemo } from "react"
import { useLocation } from "react-router-dom"
import {
  FiCpu,
  FiX,
  FiSend,
  FiZap,
  FiRefreshCw,
  FiCopy,
  FiCheck,
  FiTrash2,
} from "react-icons/fi"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Badge } from "@/components/ui/Badge"
import { useAuth } from "@/context/AuthContext"
import { streamAiChat } from "@/services/aiApi"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

type PromptCategory = "all" | "escrow" | "contracts" | "wallet" | "disputes"

interface PromptChip {
  text: string
  category: PromptCategory
}

/**
 * Lightweight Rich Markdown Parser for FairWork Ask AI
 * Parses code blocks, headers, lists, quotes, bold, italic, and links.
 */
function MarkdownRenderer({ content }: { content: string }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const copyCode = (code: string, idx: number) => {
    void navigator.clipboard.writeText(code)
    setCopiedIndex(idx)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  // Parse into blocks (code blocks vs regular paragraphs/lists)
  const blocks = useMemo(() => {
    const rawBlocks: Array<{ type: "code" | "text"; content: string; lang?: string }> = []
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        const textChunk = content.slice(lastIndex, match.index)
        if (textChunk.trim()) {
          rawBlocks.push({ type: "text", content: textChunk })
        }
      }
      rawBlocks.push({
        type: "code",
        lang: match[1] || "code",
        content: match[2].trimEnd(),
      })
      lastIndex = match.index + match[0].length
    }

    if (lastIndex < content.length) {
      const remaining = content.slice(lastIndex)
      if (remaining.trim()) {
        rawBlocks.push({ type: "text", content: remaining })
      }
    }

    return rawBlocks.length > 0 ? rawBlocks : [{ type: "text" as const, content }]
  }, [content])

  const renderInline = (str: string) => {
    // Process bold **text**, inline `code`, and [text](url)
    const parts: React.ReactNode[] = []
    const inlineRegex = /(\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g
    let lastIdx = 0
    let m: RegExpExecArray | null

    while ((m = inlineRegex.exec(str)) !== null) {
      if (m.index > lastIdx) {
        parts.push(str.slice(lastIdx, m.index))
      }
      if (m[2]) {
        // Bold
        parts.push(
          <strong key={m.index} className="font-semibold text-foreground">
            {m[2]}
          </strong>,
        )
      } else if (m[3]) {
        // Inline code
        parts.push(
          <code
            key={m.index}
            className="rounded bg-secondary/80 px-1 py-0.5 font-mono text-[11px] text-primary border border-border/60"
          >
            {m[3]}
          </code>,
        )
      } else if (m[4] && m[5]) {
        // Link
        parts.push(
          <a
            key={m.index}
            href={m[5]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            {m[4]}
          </a>,
        )
      }
      lastIdx = m.index + m[0].length
    }

    if (lastIdx < str.length) {
      parts.push(str.slice(lastIdx))
    }

    return parts.length > 0 ? parts : str
  }

  return (
    <div className="space-y-2.5 text-xs sm:text-sm leading-relaxed">
      {blocks.map((block, idx) => {
        if (block.type === "code") {
          return (
            <div
              key={idx}
              className="my-2 overflow-hidden rounded-xl border border-border/80 bg-base/90 font-mono text-xs shadow-inner"
            >
              <div className="flex items-center justify-between border-b border-border/60 bg-secondary/50 px-3 py-1.5 text-[11px] text-muted">
                <span className="uppercase tracking-wider font-semibold">{block.lang}</span>
                <button
                  type="button"
                  onClick={() => copyCode(block.content, idx)}
                  className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-secondary text-subtle hover:text-foreground transition-colors cursor-pointer"
                >
                  {copiedIndex === idx ? (
                    <>
                      <FiCheck className="h-3 w-3 text-success" />
                      <span className="text-success text-[10px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <FiCopy className="h-3 w-3" />
                      <span className="text-[10px]">Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="overflow-x-auto p-3 text-foreground/95">
                <code>{block.content}</code>
              </pre>
            </div>
          )
        }

        // Handle paragraphs, lists, and headers inside text block
        const lines = block.content.split("\n")
        return (
          <div key={idx} className="space-y-1.5">
            {lines.map((line, lineIdx) => {
              const trimmed = line.trim()
              if (!trimmed) return <div key={lineIdx} className="h-1" />

              // Headers
              if (trimmed.startsWith("### ")) {
                return (
                  <h4 key={lineIdx} className="font-bold text-foreground text-sm pt-1">
                    {renderInline(trimmed.slice(4))}
                  </h4>
                )
              }
              if (trimmed.startsWith("## ")) {
                return (
                  <h3 key={lineIdx} className="font-bold text-foreground text-base pt-1">
                    {renderInline(trimmed.slice(3))}
                  </h3>
                )
              }
              if (trimmed.startsWith("# ")) {
                return (
                  <h2 key={lineIdx} className="font-extrabold text-foreground text-base pt-1">
                    {renderInline(trimmed.slice(2))}
                  </h2>
                )
              }

              // Blockquotes
              if (trimmed.startsWith("> ")) {
                return (
                  <blockquote
                    key={lineIdx}
                    className="border-l-2 border-primary pl-3 py-0.5 text-xs text-subtle italic my-1"
                  >
                    {renderInline(trimmed.slice(2))}
                  </blockquote>
                )
              }

              // Unordered list
              if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                return (
                  <div key={lineIdx} className="flex items-start gap-2 pl-1">
                    <span className="text-primary font-bold leading-relaxed shrink-0">•</span>
                    <span className="flex-1">{renderInline(trimmed.slice(2))}</span>
                  </div>
                )
              }

              // Numbered list (e.g. "1. ")
              const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/)
              if (numberedMatch) {
                return (
                  <div key={lineIdx} className="flex items-start gap-2 pl-1">
                    <span className="font-mono text-[11px] font-bold text-primary shrink-0">
                      {numberedMatch[1]}.
                    </span>
                    <span className="flex-1">{renderInline(numberedMatch[2])}</span>
                  </div>
                )
              }

              // Default paragraph line
              return (
                <p key={lineIdx} className="leading-relaxed">
                  {renderInline(line)}
                </p>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

export function AiAssistantDrawer() {
  const { status, token, user } = useAuth()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory>("all")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatScrollContainerRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const welcomeContent = useMemo(() => {
    const roleTitle = user?.role === "client" ? "Client" : user?.role === "freelancer" ? "Freelancer" : "Member"
    return `Hello **${user?.name || roleTitle}**! I am your **FairWork Ask AI** copilot.\n\nI can assist you with:\n- **Web3 Escrow**: Funding, milestone releases, and 5,000 mock USDC claims\n- **Formal Contracts**: Identifying agreements, reference IDs (\`FAIR-CNT-...\`), and digital signing\n- **Project Execution**: Milestone deliverables, reviews, and dispute protection\n\nHow can I help you today?`
  }, [user?.name, user?.role])

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: welcomeContent,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ])

  // Context-aware dynamic prompt chips
  const dynamicChips: PromptChip[] = useMemo(() => {
    const pathname = location.pathname.toLowerCase()
    const isClient = user?.role === "client"

    const baseChips: PromptChip[] = [
      {
        text: "How does FairWork Web3 escrow protect my funds?",
        category: "escrow",
      },
      {
        text: "How do I claim my 5,000 mock USDC on Sepolia?",
        category: "wallet",
      },
      {
        text: "How do legal contracts work and when do they become binding?",
        category: "contracts",
      },
      {
        text: "How does the DisputeContract arbitrate disagreements?",
        category: "disputes",
      },
    ]

    if (pathname.includes("/contracts")) {
      return [
        {
          text: "What makes a FairWork contract legally binding?",
          category: "contracts",
        },
        {
          text: "What is the difference between client & freelancer signature?",
          category: "contracts",
        },
        {
          text: "Where do I find my Contract Reference ID (FAIR-CNT)?",
          category: "contracts",
        },
        {
          text: "What happens if milestone deadlines are breached?",
          category: "disputes",
        },
      ]
    }

    if (pathname.includes("/projects") || pathname.includes("/escrow")) {
      return [
        {
          text: isClient
            ? "How do I safely approve and release a milestone payment?"
            : "How do I submit deliverables for client milestone approval?",
          category: "escrow",
        },
        {
          text: "How does the milestone escrow release USDC to the wallet?",
          category: "escrow",
        },
        {
          text: "What happens if a revision is requested on my deliverable?",
          category: "disputes",
        },
        {
          text: "How do one-time client reviews work upon project completion?",
          category: "contracts",
        },
      ]
    }

    if (pathname.includes("/wallet")) {
      return [
        {
          text: "How do I claim my sponsored 5,000 mock USDC?",
          category: "wallet",
        },
        {
          text: "How do I add mock USDC token to MetaMask?",
          category: "wallet",
        },
        {
          text: "Why is Sepolia ETH needed for on-chain gas fees?",
          category: "wallet",
        },
        {
          text: "Can I use the Sepolia Relayer without a wallet extension?",
          category: "wallet",
        },
      ]
    }

    if (pathname.includes("/chat")) {
      return [
        {
          text: "Why should all project communication stay on FairWork chat?",
          category: "contracts",
        },
        {
          text: "How do WhatsApp-style message delivery ticks work?",
          category: "contracts",
        },
        {
          text: "What should I do if a counterparty asks to pay off-platform?",
          category: "disputes",
        },
      ]
    }

    if (pathname.includes("/disputes")) {
      return [
        {
          text: "How does DisputeContract.sol arbitrate disagreements?",
          category: "disputes",
        },
        {
          text: "What evidence provides the strongest dispute case?",
          category: "disputes",
        },
        {
          text: "How are escrow funds split upon dispute resolution?",
          category: "escrow",
        },
      ]
    }

    return baseChips
  }, [location.pathname, user?.role])

  const filteredChips = useMemo(() => {
    if (selectedCategory === "all") return dynamicChips
    return dynamicChips.filter((chip) => chip.category === selectedCategory)
  }, [dynamicChips, selectedCategory])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen])

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Active page label
  const activePageLabel = useMemo(() => {
    const p = location.pathname.toLowerCase()
    if (p.includes("/contracts")) return "Contracts Workspace"
    if (p.includes("/projects")) return "Projects & Milestones"
    if (p.includes("/wallet")) return "Web3 Wallet & Faucet"
    if (p.includes("/chat")) return "Workroom Chat"
    if (p.includes("/disputes")) return "Dispute Resolution"
    if (p.includes("/settings")) return "Account Settings"
    if (p.includes("/profile")) return "Profile & Reputation"
    return "FairWork Platform"
  }, [location.pathname])

  // Strict Production Guard: Restrict AI Assistant to authenticated internal workspace pages only.
  const pathname = location.pathname.toLowerCase()
  const isExcludedRoute =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/auth/")

  if (status !== "authenticated" || !user || isExcludedRoute) {
    return null
  }

  const handleClose = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsStreaming(false)
    setIsOpen(false)
  }

  const handleClearHistory = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsStreaming(false)
    setMessages([
      {
        id: "welcome-reset",
        role: "assistant",
        content: welcomeContent,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ])
  }

  const copyMessage = (text: string, id: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedMsgId(id)
    setTimeout(() => setCopiedMsgId(null), 2000)
  }

  const handleSend = async (queryText?: string) => {
    const text = queryText || input
    if (!text.trim() || isStreaming || !token) return

    // Cancel any previous stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    const assistantMsgId = crypto.randomUUID()
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, userMsg, initialAssistantMsg])
    setInput("")
    setIsStreaming(true)

    const historyWindow = messages
      .slice(-6)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n")

    const context = {
      userRole: user?.role || "guest",
      userName: user?.name || "User",
      userEmail: user?.email || "",
      pageUrl: window.location.pathname,
      pageTitle: document.title,
      walletConnected: Boolean(user?.walletAddress),
      hasClaimedMockUSDC: Boolean(user?.hasClaimedMockUSDC),
      conversationHistory: historyWindow,
    }

    await streamAiChat(
      token,
      text.trim(),
      context,
      (tokenChunk) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, content: msg.content + tokenChunk } : msg,
          ),
        )
      },
      (err) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, content: `⚠️ **AI Service Note**: ${err}` } : msg,
          ),
        )
        setIsStreaming(false)
      },
      () => {
        setIsStreaming(false)
        abortControllerRef.current = null
      },
      controller.signal,
    )
  }

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-primary-600 via-primary-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-primary-500/25 transition-all duration-300 hover:scale-105 hover:shadow-primary-500/40 active:scale-95 cursor-pointer"
        aria-label="Open FairWork Ask AI"
      >
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-75"></span>
          <span className="relative inline-flex h-3 w-3 rounded-full bg-accent-400"></span>
        </span>
        <FiZap className="h-4 w-4 animate-pulse text-accent-300" />
        <span>Ask AI</span>
      </button>

      {/* Slide-over Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-background/60 backdrop-blur-xs transition-opacity"
            onClick={handleClose}
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
            <div className="w-screen max-w-lg bg-card/95 backdrop-blur-md border-l border-border/80 shadow-2xl flex flex-col">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-border/80 px-5 py-4 bg-secondary/30">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-indigo-500/20 text-primary border border-primary/30 shadow-xs">
                    <FiCpu className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-foreground">FairWork Ask AI</h2>
                      <Badge tone="info" className="text-[10px] py-0 px-1.5 font-mono">
                        COPILOT
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-subtle mt-0.5">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-success"></span>
                      <span>{activePageLabel}</span>
                      <span>·</span>
                      <span className="capitalize">{user?.role}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    title="Clear Chat History"
                    className="rounded-lg p-2 text-subtle hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    aria-label="Close drawer"
                    className="rounded-lg p-2 text-subtle hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Chat Message List */}
              <div
                ref={chatScrollContainerRef}
                className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4"
              >
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`relative group max-w-[90%] rounded-2xl px-4 py-3 text-xs sm:text-sm shadow-xs ${
                        msg.role === "user"
                          ? "bg-primary text-white rounded-br-xs"
                          : "bg-surface/80 border border-border text-foreground rounded-bl-xs"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <MarkdownRenderer content={msg.content || "..."} />
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      )}

                      {/* 1-Click Copy Icon for Assistant Messages */}
                      {msg.role === "assistant" && msg.content && (
                        <button
                          type="button"
                          onClick={() => copyMessage(msg.content, msg.id)}
                          title="Copy response"
                          className="absolute -bottom-2 right-2 rounded-full border border-border bg-base p-1 text-subtle shadow-xs opacity-0 group-hover:opacity-100 hover:text-primary transition-all cursor-pointer"
                        >
                          {copiedMsgId === msg.id ? (
                            <FiCheck className="h-3 w-3 text-success" />
                          ) : (
                            <FiCopy className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>
                    <span className="mt-1 text-[10px] text-muted px-1 font-mono">
                      {msg.timestamp}
                    </span>
                  </div>
                ))}

                {isStreaming && (
                  <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary font-medium animate-pulse">
                    <FiRefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>FairWork Ask AI is streaming answer...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Dynamic Contextual Prompt Chips Section */}
              <div className="border-t border-border/60 bg-secondary/20 p-3 sm:p-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-muted">
                  <span className="flex items-center gap-1.5">
                    <FiZap className="h-3.5 w-3.5 text-primary" />
                    Suggested Quick Prompts
                  </span>
                  <div className="flex items-center gap-1">
                    {(["all", "escrow", "contracts", "wallet"] as PromptCategory[]).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`rounded-md px-1.5 py-0.5 text-[10px] uppercase font-bold transition-colors cursor-pointer ${
                          selectedCategory === cat
                            ? "bg-primary/20 text-primary font-bold"
                            : "text-muted hover:text-foreground"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {filteredChips.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(chip.text)}
                      disabled={isStreaming}
                      className="text-[11px] bg-card hover:bg-primary/10 hover:border-primary/40 text-subtle hover:text-primary border border-border/80 rounded-xl px-2.5 py-1.5 transition-all text-left flex items-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
                    >
                      <span className="text-primary text-[10px]">✨</span>
                      <span>{chip.text}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input Bar */}
              <div className="p-4 border-t border-border/80 bg-card">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSend()
                  }}
                  className="flex items-center gap-2"
                >
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask AI about escrow, gas, or milestones..."
                    disabled={isStreaming}
                    className="flex-1 bg-surface border-border/80 focus:border-primary text-xs sm:text-sm h-11"
                  />
                  <Button
                    type="submit"
                    disabled={!input.trim() || isStreaming}
                    className="h-11 px-4 bg-primary hover:bg-primary-hover font-semibold shrink-0"
                  >
                    <FiSend className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
