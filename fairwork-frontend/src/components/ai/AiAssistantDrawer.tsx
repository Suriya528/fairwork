import { useState, useRef, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { FiCpu, FiX, FiSend, FiZap, FiRefreshCw } from "react-icons/fi"
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

const QUICK_CHIPS = [
  "How does FairWork Web3 escrow work?",
  "What are Sepolia gas fees?",
  "How do I release a milestone payment?",
  "What happens if a dispute is raised?",
]

export function AiAssistantDrawer() {
  const { status, token, user } = useAuth()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I am your **FairWork Ask AI** assistant. Ask me anything about Web3 escrow payments, milestone tracking, gas fees, or platform contracts!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ])
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Strict Production Guard: Restrict AI Assistant to authenticated internal workspace pages only.
  // Never show on public landing (/), auth routes (/login, /register, /forgot-password),
  // OAuth callback & role selection screens (/auth/*), or unauthenticated sessions.
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen])

  // Cleanup active streams on unmount or drawer close
  const handleClose = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsStreaming(false)
    setIsOpen(false)
  }

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

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
      pageUrl: window.location.pathname,
      conversationHistory: historyWindow,
    }

    await streamAiChat(
      token,
      text.trim(),
      context,
      (tokenChunk) => {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === assistantMsgId ? { ...msg, content: msg.content + tokenChunk } : msg)),
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
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-primary-600 via-primary-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-primary-500/25 transition-all duration-300 hover:scale-105 hover:shadow-primary-500/40 active:scale-95"
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

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-md bg-card/95 backdrop-blur-md border-l border-border/80 shadow-2xl flex flex-col">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-border/80 px-5 py-4 bg-secondary/30">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400 border border-primary-500/30">
                    <FiCpu className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                      FairWork Ask AI
                      <Badge tone="info" className="text-[10px] py-0 px-1.5 font-mono">
                        SSE STREAMING
                      </Badge>
                    </h2>
                    <p className="text-xs text-muted-foreground">Web3 Escrow & Milestone Assistant</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  aria-label="Close drawer"
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              {/* Chat Message List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-xs ${
                        msg.role === "user"
                          ? "bg-primary-600 text-white rounded-br-none"
                          : "bg-secondary/60 border border-border/60 text-foreground rounded-bl-none"
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                    <span className="mt-1 text-[10px] text-muted-foreground px-1">{msg.timestamp}</span>
                  </div>
                ))}
                {isStreaming && (
                  <div className="flex items-center gap-2 text-xs text-primary-400 font-mono animate-pulse">
                    <FiRefreshCw className="h-3 w-3 animate-spin" />
                    <span>Ask AI is typing...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Action Chips */}
              <div className="px-5 py-2 border-t border-border/40 bg-secondary/10 flex flex-wrap gap-1.5">
                {QUICK_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(chip)}
                    disabled={isStreaming}
                    className="text-[11px] bg-secondary/50 hover:bg-primary-500/10 hover:border-primary-500/30 text-muted-foreground hover:text-primary-400 border border-border/60 rounded-full px-2.5 py-1 transition-colors text-left"
                  >
                    ✨ {chip}
                  </button>
                ))}
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
                    className="flex-1 bg-secondary/40 border-border/80 focus:border-primary-500 text-sm"
                  />
                  <Button
                    type="submit"
                    disabled={!input.trim() || isStreaming}
                    className="bg-primary-600 hover:bg-primary-500 text-white h-10 px-4"
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
