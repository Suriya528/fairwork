import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
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
  FiSearch,
  FiLock,
} from "react-icons/fi"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Avatar } from "@/components/ui/Avatar"
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
import { cn } from "@/lib/utils"

export function ChatPage() {
  const { user, token } = useAuth()
  const { formatAmount } = useCurrency()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const socketRef = useRef<Socket | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [projects, setProjects] = useState<ApiProject[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [messages, setMessages] = useState<ApiMessage[]>([])
  const [snapshot, setSnapshot] = useState<EscrowSnapshot | null>(null)
  const [draft, setDraft] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
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

  // Filter project threads by search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects
    const q = searchQuery.toLowerCase()
    return projects.filter((p) => {
      const partner = p.clientId === user?.id ? p.freelancerName : p.clientName
      return (
        p.title.toLowerCase().includes(q) ||
        (partner && partner.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q)
      )
    })
  }, [projects, searchQuery, user?.id])

  // Format timestamp like WhatsApp (e.g. "10:45 AM")
  const formatTime = (isoString?: string) => {
    if (!isoString) return ""
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return ""
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <PageHeader
          title="Workroom Chat"
          description="Real-time Web3 workroom messaging, milestone system logs, and deliverable file sharing."
        />

        {error && (
          <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-xs text-danger flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-danger font-bold text-sm">✕</button>
          </div>
        )}

        {projects.length ? (
          <div className="min-h-[600px] w-full rounded-2xl border border-border/80 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-[280px_1fr_auto] bg-surface dark:bg-[#111b21]">
            {/* WHATSAPP LEFT COLUMN: CHAT LIST SIDEBAR */}
            <aside className="border-b md:border-b-0 md:border-r border-border/60 flex flex-col bg-surface dark:bg-[#111b21] max-h-[300px] md:max-h-none">
              {/* WhatsApp Header */}
              <div className="h-16 px-4 flex items-center justify-between border-b border-border/60 bg-surface-elevated/40 dark:bg-[#202c33]">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar name={user?.name || "User"} src={user?.avatarUrl || undefined} size="sm" />
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-surface" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Workroom Chats</h3>
                    <p className="text-[11px] text-muted">{projects.length} Active Thread{projects.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowSidePanel(!showSidePanel)}
                    title="Toggle Escrow Snapshot"
                    className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated/70 dark:hover:bg-[#2a3942] transition-colors"
                  >
                    <FiShield className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* WhatsApp Search Bar */}
              <div className="p-2.5 border-b border-border/40 bg-surface dark:bg-[#111b21]">
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-surface-elevated/80 dark:bg-[#202c33] border border-border/40 focus-within:border-primary/60 transition-colors">
                  <FiSearch className="h-3.5 w-3.5 text-muted shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search or start new chat..."
                    className="w-full text-xs bg-transparent text-foreground placeholder:text-muted/60 focus:outline-none"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="text-muted hover:text-foreground text-xs">
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* WhatsApp Conversation List */}
              <div className="flex-1 overflow-y-auto divide-y divide-border/20">
                {filteredProjects.map((p) => {
                  const isClientUser = p.clientId === user?.id || (p as any).clientId?._id === user?.id
                  const threadPartner = isClientUser ? (p.freelancerName || "Assigned Freelancer") : (p.clientName || "Project Client")
                  const isSelected = p.id === selected

                  return (
                    <div
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelectProject(p.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          handleSelectProject(p.id)
                        }
                      }}
                      className={cn(
                        "w-full p-3.5 text-left transition-colors flex items-center gap-3 cursor-pointer group relative",
                        isSelected
                          ? "bg-primary/10 dark:bg-[#2a3942] border-l-4 border-primary dark:border-[#00a884]"
                          : "hover:bg-surface-elevated/60 dark:hover:bg-[#202c33]",
                      )}
                    >
                      <div className="relative shrink-0">
                        <Avatar name={threadPartner} size="md" />
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-surface" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <h4 className={cn("text-sm font-semibold truncate", isSelected ? "text-primary dark:text-[#00a884]" : "text-foreground")}>
                            {p.title}
                          </h4>
                          <span className="text-[10px] text-muted font-mono shrink-0">
                            {formatAmount(p.budget)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className="text-xs text-muted truncate">
                            With <span className="text-foreground/90 font-medium">{threadPartner}</span>
                          </p>
                          <Badge
                            tone={p.status === "completed" ? "success" : p.escrowFunded ? "info" : "neutral"}
                            className="text-[9px] px-1.5 py-0 shrink-0 font-normal capitalize"
                          >
                            {p.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </aside>

            {/* WHATSAPP CENTER COLUMN: CHAT STREAM & INPUT */}
            <section className="flex-1 flex flex-col min-w-0 bg-[#efeae2]/50 dark:bg-[#0b141a] relative">
              {/* WhatsApp Active Chat Header */}
              <header className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-border/60 bg-surface-elevated/70 dark:bg-[#202c33] backdrop-blur-sm z-10 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <Avatar name={activeCounterpartyName} size="md" />
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-surface" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-foreground truncate flex items-center gap-2">
                      {activeProject?.title}
                      <span className="text-xs font-normal text-muted">•</span>
                      <span className="text-xs font-semibold text-primary dark:text-[#00a884]">{activeCounterpartyName}</span>
                    </h3>
                    <p className="text-xs text-muted truncate flex items-center gap-1.5">
                      {typingUser ? (
                        <span className="text-emerald-500 font-semibold flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                          typing...
                        </span>
                      ) : (
                        <span>Workroom Chat • Non-custodial Escrow Protected</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selected && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/projects/${selected}`)}
                      className="text-xs text-muted hover:text-foreground hidden sm:flex items-center gap-1"
                    >
                      <span>Project Details</span>
                      <FiExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSidePanel(!showSidePanel)}
                    className="text-xs border-border/80 text-foreground hover:bg-surface-elevated flex items-center gap-1.5"
                  >
                    <FiShield className="h-3.5 w-3.5 text-emerald-500" />
                    <span>{showSidePanel ? "Hide Details" : "Escrow Info"}</span>
                    {showSidePanel ? <FiChevronRight className="h-3.5 w-3.5" /> : <FiChevronLeft className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </header>

              {/* WhatsApp Chat Stream (Wall-paper Texture) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 bg-[#efeae2]/60 dark:bg-[#0b141a]">
                {/* WhatsApp Security Encryption Pill */}
                <div className="mx-auto w-fit max-w-md rounded-xl bg-amber-100/80 dark:bg-[#182229] border border-amber-300/40 dark:border-border/60 px-3.5 py-1.5 text-center text-[11px] text-amber-900 dark:text-amber-200/90 shadow-xs flex items-center justify-center gap-1.5">
                  <FiLock className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>Messages and smart-contract settlements are verified on-chain via EIP-712 auth.</span>
                </div>

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
                        className="mx-auto my-3 max-w-lg w-full rounded-2xl bg-white/95 dark:bg-[#182229] border border-border/80 p-3.5 text-center text-xs text-foreground shadow-sm"
                      >
                        <div className="flex items-center justify-center gap-1.5 font-semibold text-emerald-600 dark:text-[#00a884] mb-1">
                          <FiShield className="h-4 w-4 shrink-0" />
                          <span>On-Chain Milestone Event</span>
                        </div>
                        <p className="leading-relaxed text-foreground/90 font-medium">
                          {m.content.replace("[SYSTEM_EVENT]", "").trim()}
                        </p>
                        <span className="text-[10px] text-muted block mt-1.5 font-mono">
                          {formatDate(m.createdAt)}
                        </span>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={m.id}
                      className={cn(
                        "flex flex-col max-w-[85%] sm:max-w-[70%]",
                        isMe ? "ml-auto items-end" : "mr-auto items-start",
                      )}
                    >
                      {/* WhatsApp Speech Bubble */}
                      <div
                        className={cn(
                          "relative px-4 py-2.5 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] transition-all",
                          isMe
                            ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-2xl rounded-tr-xs border border-[#c1f3b8] dark:border-transparent"
                            : "bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-2xl rounded-tl-xs border border-border/50 dark:border-transparent",
                        )}
                      >
                        {!isMe && (
                          <div className="text-[11px] font-bold text-emerald-700 dark:text-[#53bdeb] mb-1">
                            {m.senderName || activeCounterpartyName}
                          </div>
                        )}

                        {m.type === "FILE" || m.fileUrl ? (
                          <div className="space-y-2 min-w-[200px]">
                            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/10">
                              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <FiFileText className="h-5 w-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-xs truncate">
                                  {m.content || m.fileMeta?.filename || "Attachment"}
                                </p>
                                {m.fileMeta?.size && (
                                  <p className="text-[10px] text-muted">
                                    {(m.fileMeta.size / 1024).toFixed(0)} KB
                                  </p>
                                )}
                              </div>
                            </div>
                            <a
                              href={sanitizeUrl(m.fileUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className={cn(
                                "inline-flex items-center gap-1.5 text-xs font-semibold hover:underline",
                                isMe ? "text-emerald-800 dark:text-emerald-200" : "text-primary dark:text-[#53bdeb]",
                              )}
                            >
                              Download File <FiExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap leading-relaxed text-sm break-words">
                            {m.content}
                          </p>
                        )}

                        {/* WhatsApp Time & Double Checkmark (bottom-right inside bubble) */}
                        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-muted/80 font-mono">
                          <span>{formatTime(m.createdAt)}</span>
                          {isMe && (
                            m.id.startsWith("temp-") ? (
                              <FiClock className="h-3 w-3 text-muted shrink-0" />
                            ) : m.read ? (
                              <span className="text-[#53bdeb] font-bold flex tracking-tighter" title="Read">
                                ✓✓
                              </span>
                            ) : (
                              <span className="text-[#8696a0] font-bold flex tracking-tighter" title="Delivered">
                                ✓✓
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {typingUser && (
                  <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium px-2 py-1 bg-white/70 dark:bg-[#202c33]/70 rounded-full w-fit shadow-xs animate-pulse">
                    <span className="flex gap-1 items-center px-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" />
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
                    </span>
                    <span>{typingUser}</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* WhatsApp Bottom Input Toolbar */}
              <div className="p-3 bg-surface-elevated/60 dark:bg-[#202c33] border-t border-border/60 flex items-center gap-2.5 shrink-0">
                <label
                  className="cursor-pointer p-2.5 rounded-full text-muted hover:text-foreground hover:bg-surface-elevated dark:hover:bg-[#2a3942] transition-colors"
                  title="Attach File or Deliverable"
                >
                  <FiPaperclip className="h-5 w-5" />
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>

                <div className="flex-1 relative flex items-center">
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => handleDraftChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        send()
                      }
                    }}
                    placeholder="Type a message..."
                    className="w-full rounded-full bg-surface dark:bg-[#2a3942] border border-border/60 px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                  />
                </div>

                <button
                  type="button"
                  aria-label="Send message"
                  onClick={send}
                  disabled={!draft.trim() || uploading}
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center transition-all shrink-0 shadow-md",
                    draft.trim()
                      ? "bg-[#00a884] hover:bg-[#008f6f] text-white active:scale-95"
                      : "bg-surface-elevated text-muted cursor-not-allowed",
                  )}
                >
                  <FiSend className="h-4 w-4 -translate-x-0.5 translate-y-0.5" />
                </button>
              </div>
            </section>

            {/* WHATSAPP RIGHT COLUMN: ESCROW SNAPSHOT & SECURITY DRAWER */}
            {showSidePanel && (
              <aside className="w-full md:w-72 lg:w-80 border-t md:border-t-0 md:border-l border-border/60 flex flex-col bg-surface dark:bg-[#111b21] p-4 sm:p-5 space-y-5 overflow-y-auto shrink-0">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-1.5">
                    <FiShield className="text-emerald-500" />
                    <span>Escrow Snapshot</span>
                  </h4>

                  {snapshot ? (
                    <div className="space-y-3 bg-surface-elevated/50 dark:bg-[#202c33] p-4 rounded-2xl border border-border/60 text-xs shadow-xs">
                      <div className="flex justify-between items-center pb-2.5 border-b border-border/40">
                        <span className="text-[11px] text-muted">TOTAL BUDGET</span>
                        <span className="font-mono font-bold text-sm text-foreground">
                          {formatAmount(snapshot.totalBudget)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pb-2.5 border-b border-border/40">
                        <span className="text-[11px] text-muted">PAID / RELEASED</span>
                        <span className="font-mono font-bold text-emerald-500">
                          {formatAmount(snapshot.releasedAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pb-2.5 border-b border-border/40">
                        <span className="text-[11px] text-muted">UNRELEASED</span>
                        <span className="font-mono font-bold text-primary">
                          {formatAmount(snapshot.unreleasedAmount)}
                        </span>
                      </div>
                      <div className="pt-1">
                        <Badge
                          tone={snapshot.escrowFunded ? "success" : "warning"}
                          className="w-full justify-center py-1 text-xs"
                        >
                          {snapshot.escrowFunded ? "Escrow Funded ✓" : "Unfunded Draft ⚠️"}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl border border-border/60 bg-surface-elevated/30 text-xs text-muted flex items-center gap-2">
                      <FiClock className="h-4 w-4 animate-spin text-primary" />
                      <span>Loading escrow state...</span>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-1.5">
                    <FiLock className="text-primary" />
                    <span>Workroom Security</span>
                  </h4>
                  <div className="p-4 rounded-2xl border border-border/60 bg-surface-elevated/40 space-y-2.5 text-xs text-muted">
                    <div className="flex items-center gap-2 text-foreground font-medium">
                      <FiCheckCircle className="h-4 w-4 text-emerald-500" />
                      <span>EIP-712 Encrypted Auth</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground font-medium">
                      <FiCheckCircle className="h-4 w-4 text-emerald-500" />
                      <span>Reconciled Milestones</span>
                    </div>
                    <p className="text-[11px] leading-relaxed pt-1 border-t border-border/40 text-muted">
                      Funds are held in non-custodial smart contracts on Sepolia and released only upon client approval.
                    </p>
                  </div>
                </div>

                {selected && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/projects/${selected}`)}
                    className="w-full text-xs"
                  >
                    View Full Project &amp; Milestones
                  </Button>
                )}
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
