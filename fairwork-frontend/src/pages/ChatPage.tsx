import { useEffect, useMemo, useRef, useState } from "react"
import { FiArrowLeft, FiCheck, FiCheckCircle, FiFolder, FiPaperclip, FiSend } from "react-icons/fi"
import { Avatar } from "@/components/ui/Avatar"
import { Button } from "@/components/ui/Button"
import { getProjectById } from "@/data/projects"
import { conversations, getMessagesForConversation, messages as seedMessages, onlineStatusByUserId } from "@/data/chat"
import { users } from "@/data/users"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/format"
import type { Message } from "@/types"

// TODO: replace with the real authenticated user once session/auth
// context exists (only services/authApi.ts is wired up so far).
const CURRENT_USER_ID = "usr_client_01"

function getOtherParticipant(conversationId: string) {
  const conv = conversations.find((c) => c.id === conversationId)
  const otherId = conv?.participants.find((p) => p.userId !== CURRENT_USER_ID)?.userId
  return otherId ? users.find((u) => u.id === otherId) : undefined
}

export function ChatPage() {
  const [allMessages, setAllMessages] = useState<Message[]>(seedMessages)
  const [selectedId, setSelectedId] = useState<string | null>(conversations[0]?.id ?? null)
  const [draft, setDraft] = useState("")
  const [typingUserId, setTypingUserId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const conversationList = useMemo(() => {
    return [...conversations]
      .map((conv) => {
        const other = getOtherParticipant(conv.id)
        const convMessages = allMessages
          .filter((m) => m.conversationId === conv.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        const lastMessage = convMessages[0]
        const unread = convMessages.filter(
          (m) => m.senderId !== CURRENT_USER_ID && !m.readBy.includes(CURRENT_USER_ID),
        ).length
        return { conv, other, lastMessage, unread }
      })
      .sort(
        (a, b) =>
          new Date(b.lastMessage?.createdAt ?? b.conv.updatedAt).getTime() -
          new Date(a.lastMessage?.createdAt ?? a.conv.updatedAt).getTime(),
      )
  }, [allMessages])

  const activeMessages = useMemo(
    () => (selectedId ? getMessagesForConversation(selectedId).map((m) => allMessages.find((am) => am.id === m.id) ?? m) : []),
    [selectedId, allMessages],
  )

  const activeConversation = conversations.find((c) => c.id === selectedId)
  const activeProject = activeConversation?.projectId ? getProjectById(activeConversation.projectId) : undefined
  const activeOther = selectedId ? getOtherParticipant(selectedId) : undefined
  const activeStatus = activeOther ? onlineStatusByUserId[activeOther.id] : undefined

  // Mark active conversation's incoming messages as read on open.
  useEffect(() => {
    if (!selectedId) return
    setAllMessages((prev) =>
      prev.map((m) =>
        m.conversationId === selectedId && !m.readBy.includes(CURRENT_USER_ID)
          ? { ...m, readBy: [...m.readBy, CURRENT_USER_ID] }
          : m,
      ),
    )
  }, [selectedId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [activeMessages.length, typingUserId])

  const handleSend = () => {
    if (!draft.trim() || !selectedId) return
    const newMessage: Message = {
      id: `local_${Date.now()}`,
      conversationId: selectedId,
      senderId: CURRENT_USER_ID,
      content: draft.trim(),
      attachments: [],
      createdAt: new Date().toISOString(),
      readBy: [CURRENT_USER_ID],
    }
    setAllMessages((prev) => [...prev, newMessage])
    setDraft("")

    if (activeOther) {
      setTypingUserId(activeOther.id)
      setTimeout(() => setTypingUserId(null), 1800)
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Conversation list */}
      <aside
        className={cn(
          "w-full shrink-0 flex-col border-r border-border bg-surface sm:w-80 sm:flex",
          selectedId ? "hidden sm:flex" : "flex",
        )}
      >
        <div className="border-b border-border p-4">
          <h2 className="text-sm font-semibold text-foreground">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversationList.map(({ conv, other, lastMessage, unread }) => {
            const project = conv.projectId ? getProjectById(conv.projectId) : undefined
            const status = other ? onlineStatusByUserId[other.id] : undefined
            const isActive = conv.id === selectedId
            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => setSelectedId(conv.id)}
                className={cn(
                  "flex w-full items-start gap-3 border-b border-border p-4 text-left transition-colors",
                  isActive ? "bg-elevated" : "hover:bg-elevated/60",
                )}
              >
                <div className="relative shrink-0">
                  <Avatar name={other?.name ?? "Unknown"} src={other?.avatarUrl} size="md" />
                  {status === "online" && (
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-surface bg-success" />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {other?.name ?? "Unknown"}
                    </span>
                    {lastMessage && (
                      <span className="shrink-0 text-xs text-subtle">
                        {formatRelativeTime(lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  {project && (
                    <span className="flex items-center gap-1 text-xs text-subtle">
                      <FiFolder className="h-2.5 w-2.5" />
                      {project.title}
                    </span>
                  )}
                  <span className="truncate text-xs text-muted">
                    {lastMessage?.senderId === CURRENT_USER_ID ? "You: " : ""}
                    {lastMessage?.content ?? "No messages yet"}
                  </span>
                </div>
                {unread > 0 && (
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                    {unread}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </aside>

      {/* Active conversation */}
      <div className={cn("flex flex-1 flex-col", selectedId ? "flex" : "hidden sm:flex")}>
        {!activeConversation ? (
          <div className="flex flex-1 items-center justify-center text-sm text-subtle">
            Select a conversation to start chatting
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-border bg-surface p-4">
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="text-subtle hover:text-foreground sm:hidden"
                aria-label="Back to conversations"
              >
                <FiArrowLeft className="h-4 w-4" />
              </button>
              <div className="relative shrink-0">
                <Avatar name={activeOther?.name ?? "Unknown"} src={activeOther?.avatarUrl} size="sm" />
                {activeStatus === "online" && (
                  <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-surface bg-success" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{activeOther?.name}</span>
                <span className="text-xs text-subtle">
                  {activeProject?.title}
                  {activeStatus && ` · ${activeStatus}`}
                </span>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
              <div className="flex flex-col gap-3">
                {activeMessages.map((m) => {
                  const isMine = m.senderId === CURRENT_USER_ID
                  const sender = users.find((u) => u.id === m.senderId)
                  const seenByOther = isMine && !!activeOther && m.readBy.includes(activeOther.id)
                  return (
                    <div
                      key={m.id}
                      className={cn("flex items-end gap-2", isMine ? "flex-row-reverse" : "flex-row")}
                    >
                      {!isMine && <Avatar name={sender?.name ?? "?"} src={sender?.avatarUrl} size="sm" />}
                      <div className={cn("flex max-w-[75%] flex-col gap-1", isMine ? "items-end" : "items-start")}>
                        <div
                          className={cn(
                            "rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                            isMine
                              ? "rounded-br-sm bg-primary text-primary-foreground"
                              : "rounded-bl-sm bg-elevated text-foreground",
                          )}
                        >
                          {m.content}
                        </div>
                        {m.attachments.length > 0 && (
                          <div className="flex flex-col gap-1">
                            {m.attachments.map((a) => (
                              <a
                                key={a.id}
                                href={a.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-muted transition-colors hover:text-foreground"
                              >
                                <FiPaperclip className="h-3 w-3" />
                                {a.name}
                                {a.size && <span className="text-subtle">· {a.size}</span>}
                              </a>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-1 px-1 text-[10px] text-subtle">
                          {formatRelativeTime(m.createdAt)}
                          {isMine && (seenByOther ? <FiCheckCircle className="h-3 w-3 text-info" /> : <FiCheck className="h-3 w-3" />)}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {typingUserId && activeOther && (
                  <div className="flex items-center gap-2">
                    <Avatar name={activeOther.name} src={activeOther.avatarUrl} size="sm" />
                    <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-elevated px-3.5 py-2.5">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-subtle"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 border-t border-border bg-surface p-3">
              <button
                type="button"
                className="shrink-0 rounded-lg p-2 text-subtle transition-colors hover:bg-elevated hover:text-foreground"
                aria-label="Attach file"
              >
                <FiPaperclip className="h-4 w-4" />
              </button>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Type a message…"
                className="h-10 flex-1 rounded-xl border border-input-border bg-input px-3.5 text-sm text-foreground placeholder-subtle outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
              <Button
                variant="primary"
                size="icon"
                onClick={handleSend}
                disabled={!draft.trim()}
                aria-label="Send message"
              >
                <FiSend className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}