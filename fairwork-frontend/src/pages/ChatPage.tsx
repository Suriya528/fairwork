import { useEffect, useRef, useState } from "react"
import type { Socket } from "socket.io-client"
import {
  FiMessageSquare,
  FiSend,
  FiPaperclip,
  FiShield,
  FiCheckCircle,
  FiClock,
  FiChevronRight,
  FiChevronLeft,
  FiFileText,
  FiExternalLink,
} from "react-icons/fi"
import { Button } from "@/components/ui/Button"
import { Textarea } from "@/components/ui/Textarea"
import { Badge } from "@/components/ui/Badge"
import { EmptyState } from "@/components/feedback/EmptyState"
import { PageHeader } from "@/components/common/PageHeader"
import { useAuth } from "@/context/AuthContext"
import { useCurrency } from "@/context/CurrencyContext"
import { getMyProjects, type ApiProject } from "@/services/projectsApi"
import {
  connectChat,
  getMessages,
  getEscrowSnapshot,
  markRead,
  toApiMessage,
  type ApiMessage,
  type EscrowSnapshot,
} from "@/services/chatApi"
import { formatDate } from "@/lib/format"

export function ChatPage() {
  const { user, token } = useAuth()
  const { formatAmount } = useCurrency()
  const socketRef = useRef<Socket | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [projects, setProjects] = useState<ApiProject[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [messages, setMessages] = useState<ApiMessage[]>([])
  const [snapshot, setSnapshot] = useState<EscrowSnapshot | null>(null)
  const [draft, setDraft] = useState("")
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [showSidePanel, setShowSidePanel] = useState(true)
  const [error, setError] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (!token) return
    getMyProjects(token)
      .then((p) => {
        const threads = p.filter((x) => x.freelancerId)
        setProjects(threads)
        setSelected(threads[0]?.id ?? null)
      })
      .catch((e: Error) => setError(e.message))
  }, [token])

  useEffect(() => {
    if (!token || !selected) return
    setError("")

    getMessages(selected, token)
      .then((msgs) => {
        setMessages(msgs)
        scrollToBottom()
      })
      .catch((e: Error) => setError(e.message))

    getEscrowSnapshot(selected, token)
      .then(setSnapshot)
      .catch(() => setSnapshot(null))

    void markRead(selected, token, new Date().toISOString()).catch(() => {})

    const socket = connectChat(token)
    socketRef.current = socket

    socket.emit("join_project", selected)

    socket.on("receive_message", (raw) => {
      const message = toApiMessage(raw)
      if (message.projectId === selected) {
        setMessages((old) => (old.some((m) => m.id === message.id) ? old : [...old, message]))
        scrollToBottom()
        if (message.senderId !== user?.id) {
          void markRead(selected, token, new Date().toISOString()).catch(() => {})
        }
      }
    })

    socket.on("user_typing", (data: { userId: string; projectId: string }) => {
      if (data.projectId === selected && data.userId !== user?.id) {
        setTypingUser("Counterparty is typing...")
      }
    })

    socket.on("user_stop_typing", (data: { userId: string; projectId: string }) => {
      if (data.projectId === selected && data.userId !== user?.id) {
        setTypingUser(null)
      }
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [selected, token, user?.id])

  const handleDraftChange = (val: string) => {
    setDraft(val)
    if (!selected || !socketRef.current) return

    socketRef.current.emit("typing", selected)

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("stop_typing", selected)
    }, 2000)
  }

  const send = async () => {
    if (!selected || !draft.trim() || !token) return
    const content = draft.trim()
    setDraft("")
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    socketRef.current?.emit("stop_typing", selected)

    socketRef.current?.emit("send_message", {
      projectId: selected,
      content,
      type: "TEXT",
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selected || !token) return

    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds maximum allowed 10MB limit.")
      return
    }

    setUploading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"
      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!res.ok) throw new Error("File upload failed")
      const fileData = await res.json()

      socketRef.current?.emit("send_message", {
        projectId: selected,
        content: file.name,
        fileUrl: fileData.url,
        fileMeta: {
          filename: file.name,
          mimeType: file.type,
          size: file.size,
        },
        type: "FILE",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to attach file.")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const activeProject = projects.find((p) => p.id === selected)

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <PageHeader
          title="Workroom Chat"
          description="Real-time Web3 workroom messaging, milestone system logs, and deliverable file sharing."
        />

        {error && <p className="text-sm text-danger">{error}</p>}

        {projects.length ? (
          <div className="grid min-h-[580px] grid-cols-1 overflow-hidden rounded-2xl border border-border shadow-xl md:grid-cols-[260px_1fr_auto]">
            {/* Thread List Sidebar */}
            <aside className="border-b border-border bg-surface md:border-b-0 md:border-r flex flex-col">
              <div className="p-4 border-b border-border/80 bg-secondary/20">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">Workrooms ({projects.length})</p>
              </div>
              <div className="overflow-y-auto flex-1 divide-y divide-border/60">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelected(p.id)}
                    className={`w-full p-4 text-left text-sm transition-colors hover:bg-elevated ${
                      p.id === selected ? "bg-primary/10 border-l-4 border-primary font-semibold" : ""
                    }`}
                  >
                    <p className="font-medium text-foreground truncate">{p.title}</p>
                    <p className="text-xs text-muted mt-0.5 truncate">
                      {p.freelancerName ? `With ${p.freelancerName}` : "Assigned freelancer"}
                    </p>
                  </button>
                ))}
              </div>
            </aside>

            {/* Center Chat Stream */}
            <section className="flex min-h-[460px] flex-col bg-card">
              {/* Chat Header */}
              <header className="border-b border-border/80 p-4 flex items-center justify-between bg-secondary/10">
                <div>
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    {activeProject?.title}
                    <Badge tone="primary" className="text-[10px]">
                      {activeProject?.status}
                    </Badge>
                  </h3>
                  <p className="text-xs text-muted">
                    {activeProject?.freelancerName
                      ? `Workroom with ${activeProject.freelancerName}`
                      : "Assigned freelancer workroom"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSidePanel(!showSidePanel)}
                  className="text-xs"
                >
                  {showSidePanel ? <FiChevronRight /> : <FiChevronLeft />} Escrow Info
                </Button>
              </header>

              {/* Message Stream */}
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 max-h-[420px]">
                {messages.map((m) => {
                  const isMe = m.senderId === user?.id
                  const isSystem = m.type === "SYSTEM_EVENT" || m.content.startsWith("[SYSTEM_EVENT]")

                  if (isSystem) {
                    return (
                      <div
                        key={m.id}
                        className="mx-auto my-2 max-w-md w-full rounded-xl bg-primary-500/10 border border-primary-500/30 p-3 text-center text-xs text-primary-300 shadow-xs"
                      >
                        <div className="flex items-center justify-center gap-1.5 font-semibold text-primary-400 mb-0.5">
                          <FiShield className="h-3.5 w-3.5" />
                          <span>On-Chain Milestone Event</span>
                        </div>
                        <p>{m.content.replace("[SYSTEM_EVENT]", "").trim()}</p>
                        <span className="text-[10px] text-muted block mt-1">{formatDate(m.createdAt)}</span>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col max-w-[80%] ${isMe ? "self-end items-end" : "self-start items-start"}`}
                    >
                      <div
                        className={`rounded-2xl p-3.5 text-sm shadow-xs ${
                          isMe
                            ? "bg-primary-600 text-white rounded-br-none"
                            : "bg-secondary/60 border border-border/60 text-foreground rounded-bl-none"
                        }`}
                      >
                        {m.type === "FILE" || m.fileUrl ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 font-medium">
                              <FiFileText className="h-4 w-4" />
                              <span className="truncate">{m.content || m.fileMeta?.filename || "Attachment"}</span>
                            </div>
                            <a
                              href={m.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-accent-300 hover:underline pt-1"
                            >
                              View / Download File <FiExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                        )}
                      </div>
                      <span className="mt-1 text-[10px] text-muted px-1">
                        {formatDate(m.createdAt)} {isMe && (m.read ? "• Read" : "• Sent")}
                      </span>
                    </div>
                  )
                })}
                {typingUser && (
                  <div className="text-xs text-primary-400 font-mono animate-pulse flex items-center gap-1">
                    <FiClock className="h-3 w-3 animate-spin" /> {typingUser}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="flex gap-2 border-t border-border p-3 bg-surface items-center">
                <label className="cursor-pointer p-2 text-muted hover:text-foreground transition-colors">
                  <FiPaperclip className="h-5 w-5" />
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>

                <Textarea
                  value={draft}
                  onChange={(e) => handleDraftChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      send()
                    }
                  }}
                  rows={1}
                  placeholder="Type a message or press Enter to send..."
                  className="flex-1 bg-secondary/30 border-border/80 text-sm"
                />

                <Button
                  aria-label="Send message"
                  onClick={send}
                  disabled={!draft.trim()}
                  className="bg-primary-600 hover:bg-primary-500 text-white"
                >
                  <FiSend />
                </Button>
              </div>
            </section>

            {/* Collapsible Workroom Side Panel */}
            {showSidePanel && (
              <aside className="w-64 border-l border-border bg-surface/60 p-4 space-y-5">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">
                    Escrow Snapshot
                  </h4>
                  {snapshot ? (
                    <div className="space-y-3 bg-secondary/30 p-3 rounded-xl border border-border/60 text-xs">
                      <div>
                        <span className="text-muted block text-[10px]">TOTAL BUDGET</span>
                        <span className="font-mono font-bold text-sm text-foreground">
                          {formatAmount(snapshot.totalBudget)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted block text-[10px]">PAID / RELEASED</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {formatAmount(snapshot.releasedAmount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted block text-[10px]">UNRELEASED MILESTONES</span>
                        <span className="font-mono font-bold text-primary-400">
                          {formatAmount(snapshot.unreleasedAmount)}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-border/40">
                        <Badge tone={snapshot.escrowFunded ? "success" : "warning"} className="w-full justify-center">
                          {snapshot.escrowFunded ? "Escrow Funded" : "Unfunded Draft"}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted">Loading snapshot...</p>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">
                    Workroom Security
                  </h4>
                  <div className="text-[11px] text-muted space-y-1.5">
                    <p className="flex items-center gap-1 text-emerald-400">
                      <FiShield className="h-3.5 w-3.5" /> EIP-712 Encrypted Auth
                    </p>
                    <p className="flex items-center gap-1 text-primary-400">
                      <FiCheckCircle className="h-3.5 w-3.5" /> Reconciled Milestones
                    </p>
                  </div>
                </div>
              </aside>
            )}
          </div>
        ) : (
          <EmptyState
            icon={FiMessageSquare}
            title="No conversations"
            description="A project becomes an active workroom conversation once a freelancer is assigned."
          />
        )}
      </div>
    </div>
  )
}
