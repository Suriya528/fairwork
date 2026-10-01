import { useEffect, useRef, useState, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
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
import { sanitizeUrl } from "@/lib/sanitizeUrl"
import { useAuth } from "@/context/AuthContext"
import { useCurrency } from "@/context/CurrencyContext"
import { getMyProjects, type ApiProject } from "@/services/projectsApi"
import {
  connectChat,
  disconnectChat,
  getMessages,
  getEscrowSnapshot,
  markRead,
  sendMessage,
  toApiMessage,
  type ApiMessage,
  type EscrowSnapshot,
} from "@/services/chatApi"
import { formatDate } from "@/lib/format"

export function ChatPage() {
  const { user, token } = useAuth()
  const { formatAmount } = useCurrency()
  const [searchParams, setSearchParams] = useSearchParams()
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

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  // Load user's workroom threads
  useEffect(() => {
    if (!token) return
    getMyProjects(token)
      .then((p) => {
        const threads = p.filter((x) => x.freelancerId)
        setProjects(threads)

        // Select project specified in URL search query or default to first thread
        const requestedId = searchParams.get("project")
        const matchingProject = requestedId ? threads.find((t) => t.id === requestedId) : null
        const initialSelected = matchingProject ? matchingProject.id : threads[0]?.id ?? null
        setSelected(initialSelected)
      })
      .catch((e: Error) => setError(e.message))
  }, [token, searchParams])

  // Listen to cross-component workroom selection event (e.g. from Topbar ChatNotificationBell)
  useEffect(() => {
    const handleWorkroomSelected = (e: Event) => {
      const customEvent = e as CustomEvent<{ projectId: string }>
      if (customEvent.detail?.projectId) {
        setSelected(customEvent.detail.projectId)
        setSearchParams({ project: customEvent.detail.projectId }, { replace: true })
      }
    }

    window.addEventListener("workroom_selected", handleWorkroomSelected)
    return () => {
      window.removeEventListener("workroom_selected", handleWorkroomSelected)
    }
  }, [setSearchParams])

  // Fetch messages and establish socket connection when selected project changes
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

    // Mark as read and notify Topbar
    void markRead(selected, token, new Date().toISOString())
      .then(() => {
        window.dispatchEvent(
          new CustomEvent("chat_messages_read", { detail: { projectId: selected } }),
        )
      })
      .catch(() => {})

    const socket = connectChat(token)
    socketRef.current = socket

    const joinSelectedRoom = () => {
      socket.emit("join_project", selected)
    }

    joinSelectedRoom()

    const onConnect = () => {
      joinSelectedRoom()
    }

    const onAppError = (errData: { code: string; message: string }) => {
      setError(`[${errData.code}] ${errData.message}`)
    }

    const onReceiveMessage = (raw: any) => {
      const message = toApiMessage(raw)
      if (message.projectId === selected) {
        setMessages((old) => {
          // If already exists by real id, ignore
          if (old.some((m) => m.id === message.id)) return old

          // If this is our own message and we have an optimistic pending message, replace it
          const optIdx = old.findIndex(
            (m) =>
              m.id.startsWith("temp-") &&
              m.content === message.content &&
              (m.senderId === message.senderId || m.senderId === user?.id),
          )
          if (optIdx !== -1) {
            const next = [...old]
            next[optIdx] = message
            return next
          }
          return [...old, message]
        })
        scrollToBottom()

        const currentUserId = user?.id || (user as any)?._id
        if (message.senderId && String(message.senderId).toLowerCase() !== String(currentUserId).toLowerCase()) {
          void markRead(selected, token, new Date().toISOString())
            .then(() => {
              window.dispatchEvent(
                new CustomEvent("chat_messages_read", { detail: { projectId: selected } }),
              )
            })
            .catch(() => {})
        }
      }
    }

    const onUserTyping = (data: { userId: string; projectId: string }) => {
      const currentUserId = user?.id || (user as any)?._id
      if (data.projectId === selected && String(data.userId).toLowerCase() !== String(currentUserId).toLowerCase()) {
        setTypingUser("Counterparty is typing...")
      }
    }

    const onUserStopTyping = (data: { userId: string; projectId: string }) => {
      const currentUserId = user?.id || (user as any)?._id
      if (data.projectId === selected && String(data.userId).toLowerCase() !== String(currentUserId).toLowerCase()) {
        setTypingUser(null)
      }
    }

    socket.on("connect", onConnect)
    socket.on("app_error", onAppError)
    socket.on("receive_message", onReceiveMessage)
    socket.on("user_typing", onUserTyping)
    socket.on("user_stop_typing", onUserStopTyping)

    return () => {
      socket.emit("leave_project", selected)
      socket.off("connect", onConnect)
      socket.off("app_error", onAppError)
      socket.off("receive_message", onReceiveMessage)
      socket.off("user_typing", onUserTyping)
      socket.off("user_stop_typing", onUserStopTyping)
    }
  }, [selected, token, user?.id, scrollToBottom])

  // Disconnect socket only when leaving ChatPage completely
  useEffect(() => {
    return () => {
      disconnectChat()
      socketRef.current = null
    }
  }, [])

  const handleSelectProject = (projectId: string) => {
    setSelected(projectId)
    setSearchParams({ project: projectId }, { replace: true })
  }

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

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const optimisticMsg: ApiMessage = {
      id: tempId,
      projectId: selected,
      senderId: user?.id || "",
      senderName: user?.name || "You",
      senderAvatarUrl: user?.avatarUrl || null,
      content,
      fileUrl: "",
      type: "TEXT",
      read: false,
      createdAt: new Date().toISOString(),
    }

    // Instantly append to state so sender immediately sees their message on the right
    setMessages((prev) => [...prev, optimisticMsg])
    scrollToBottom()

    // 1. Emit via socket
    if (socketRef.current?.connected) {
      socketRef.current.emit("send_message", {
        projectId: selected,
        content,
        type: "TEXT",
      })
    } else {
      // 2. Fallback to HTTP REST endpoint if socket is offline or reconnecting
      try {
        const confirmed = await sendMessage(selected, content, token)
        setMessages((prev) => prev.map((m) => (m.id === tempId ? confirmed : m)))
      } catch (err: any) {
        setError(err?.message || "Failed to deliver message.")
      }
    }
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

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const optimisticMsg: ApiMessage = {
        id: tempId,
        projectId: selected,
        senderId: user?.id || "",
        senderName: user?.name || "You",
        senderAvatarUrl: user?.avatarUrl || null,
        content: file.name,
        fileUrl: fileData.url,
        fileMeta: {
          filename: file.name,
          mimeType: file.type,
          size: file.size,
        },
        type: "FILE",
        read: false,
        createdAt: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, optimisticMsg])
      scrollToBottom()

      if (socketRef.current?.connected) {
        socketRef.current.emit("send_message", {
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
      } else {
        const confirmed = await sendMessage(
          selected,
          file.name,
          token,
          fileData.url,
          {
            filename: file.name,
            mimeType: file.type,
            size: file.size,
          },
          "FILE",
        )
        setMessages((prev) => prev.map((m) => (m.id === tempId ? confirmed : m)))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to attach file.")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const activeProject = projects.find((p) => p.id === selected)

  // Resolve counterparty accurately for both freelancers and clients
  const activeIsClient =
    activeProject &&
    (activeProject.clientId === user?.id || (activeProject as any).clientId?._id === user?.id)
  const activeCounterpartyName = activeIsClient
    ? (activeProject?.freelancerName || "Assigned Freelancer")
    : (activeProject?.clientName || "Project Client")

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <PageHeader
          title="Workroom Chat"
          description="Real-time Web3 workroom messaging, milestone system logs, and deliverable file sharing."
        />

        {error && <p className="text-sm text-danger">{error}</p>}

        {projects.length ? (
          <div className="grid min-h-[580px] grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-[#0c1219] md:grid-cols-[260px_1fr_auto]">
            {/* Thread List Sidebar */}
            <aside className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 md:border-b-0 md:border-r flex flex-col">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/80">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Workrooms ({projects.length})</p>
              </div>
              <div className="overflow-y-auto flex-1 divide-y divide-slate-200/60 dark:divide-slate-800/60">
                {projects.map((p) => {
                  const isClientUser =
                    p.clientId === user?.id || (p as any).clientId?._id === user?.id
                  const threadPartner = isClientUser
                    ? (p.freelancerName || "Assigned Freelancer")
                    : (p.clientName || "Project Client")

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProject(p.id)}
                      className={`w-full p-4 text-left text-sm transition-colors ${
                        p.id === selected
                          ? "bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-600 font-semibold"
                          : "hover:bg-slate-100/80 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <p className={`font-medium truncate ${p.id === selected ? "text-blue-700 dark:text-blue-300" : "text-slate-900 dark:text-slate-100"}`}>
                        {p.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        With {threadPartner}
                      </p>
                    </button>
                  )
                })}
              </div>
            </aside>

            {/* Center Chat Stream */}
            <section className="flex min-h-[460px] flex-col bg-white dark:bg-[#0c1219]">
              {/* Chat Header */}
              <header className="border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/50">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                    {activeProject?.title}
                    <Badge tone="primary" className="text-[10px]">
                      {activeProject?.status}
                    </Badge>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Workroom with {activeCounterpartyName}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSidePanel(!showSidePanel)}
                  className="text-xs border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {showSidePanel ? <FiChevronRight /> : <FiChevronLeft />} Escrow Info
                </Button>
              </header>

              {/* Message Stream */}
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 max-h-[420px] bg-white dark:bg-[#0c1219]">
                {messages.map((m) => {
                  const currentUserId = user?.id || (user as any)?._id
                  const isMe = Boolean(
                    currentUserId &&
                    m.senderId &&
                    (
                      String(m.senderId).toLowerCase() === String(currentUserId).toLowerCase() ||
                      (m.senderName && user?.name && m.senderName.trim().toLowerCase() === user.name.trim().toLowerCase())
                    ),
                  )
                  const isSystem = m.type === "SYSTEM_EVENT" || m.content.startsWith("[SYSTEM_EVENT]")

                  if (isSystem) {
                    return (
                      <div
                        key={m.id}
                        className="mx-auto my-2 max-w-md w-full rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 p-3 text-center text-xs text-blue-950 dark:text-blue-200 shadow-xs"
                      >
                        <div className="flex items-center justify-center gap-1.5 font-semibold text-blue-600 dark:text-blue-400 mb-0.5">
                          <FiShield className="h-3.5 w-3.5" />
                          <span>On-Chain Milestone Event</span>
                        </div>
                        <p className="leading-relaxed">{m.content.replace("[SYSTEM_EVENT]", "").trim()}</p>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">{formatDate(m.createdAt)}</span>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col max-w-[80%] ${isMe ? "self-end items-end" : "self-start items-start"}`}
                    >
                      {!isMe && (
                        <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mb-1 px-1">
                          {m.senderName || activeCounterpartyName}
                        </span>
                      )}
                      <div
                        className={`rounded-2xl p-3.5 text-sm shadow-sm transition-colors ${
                          isMe
                            ? "bg-blue-600 dark:bg-blue-600 text-white rounded-br-none shadow-blue-500/10"
                            : "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-bl-none shadow-slate-200/50 dark:shadow-none"
                        }`}
                      >
                        {m.type === "FILE" || m.fileUrl ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 font-medium">
                              <FiFileText className={`h-4 w-4 ${isMe ? "text-blue-100" : "text-blue-600 dark:text-blue-400"}`} />
                              <span className={`truncate ${isMe ? "text-white" : "text-slate-900 dark:text-slate-100"}`}>
                                {m.content || m.fileMeta?.filename || "Attachment"}
                              </span>
                            </div>
                            <a
                              href={sanitizeUrl(m.fileUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className={`inline-flex items-center gap-1 text-xs hover:underline pt-1 ${
                                isMe ? "text-blue-100 hover:text-white" : "text-blue-600 dark:text-blue-400 font-medium"
                              }`}
                            >
                              View / Download File <FiExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        ) : (
                          <p className={`whitespace-pre-wrap leading-relaxed ${isMe ? "text-white" : "text-slate-900 dark:text-slate-100"}`}>
                            {m.content}
                          </p>
                        )}
                      </div>
                      <span className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 px-1 font-medium">
                        {formatDate(m.createdAt)} {isMe && (m.id.startsWith("temp-") ? "• Sending..." : m.read ? "• Read" : "• Sent")}
                      </span>
                    </div>
                  )
                })}
                {typingUser && (
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-mono animate-pulse flex items-center gap-1">
                    <FiClock className="h-3 w-3 animate-spin" /> {typingUser}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="flex gap-2 border-t border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-[#0c1219] items-center">
                <label className="cursor-pointer p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors" title="Attach file">
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
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus-visible:ring-blue-600"
                />

                <Button
                  aria-label="Send message"
                  onClick={send}
                  disabled={!draft.trim() || uploading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-colors"
                >
                  <FiSend />
                </Button>
              </div>
            </section>

            {/* Collapsible Workroom Side Panel */}
            {showSidePanel && (
              <aside className="w-64 border-l border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-4 space-y-5">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Escrow Snapshot
                  </h4>
                  {snapshot ? (
                    <div className="space-y-3 bg-white dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shadow-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[10px]">TOTAL BUDGET</span>
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                          {formatAmount(snapshot.totalBudget)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[10px]">PAID / RELEASED</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatAmount(snapshot.releasedAmount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[10px]">UNRELEASED MILESTONES</span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {formatAmount(snapshot.unreleasedAmount)}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                        <Badge tone={snapshot.escrowFunded ? "success" : "warning"} className="w-full justify-center">
                          {snapshot.escrowFunded ? "Escrow Funded" : "Unfunded Draft"}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400">Loading snapshot...</p>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Workroom Security
                  </h4>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5">
                    <p className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <FiShield className="h-3.5 w-3.5" /> EIP-712 Encrypted Auth
                    </p>
                    <p className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
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
