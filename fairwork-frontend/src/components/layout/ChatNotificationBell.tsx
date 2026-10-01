import { useEffect, useState, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { FiMessageSquare, FiUser, FiArrowRight } from "react-icons/fi"
import { Dropdown, DropdownItem, DropdownSeparator } from "@/components/ui/Dropdown"
import { formatRelativeTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import {
  getChatSummary,
  connectChat,
  type ChatThreadSummary,
  type ChatSummaryResponse,
} from "@/services/chatApi"

/**
 * Topbar Chat Symbol + Real-Time Workroom Notification Bell.
 * Displays live unread message counts across active projects,
 * real-time socket dispatches, and quick-jump navigation to workrooms.
 */
export function ChatNotificationBell() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [summary, setSummary] = useState<ChatSummaryResponse>({
    totalUnread: 0,
    threads: [],
  })
  const isFetchingRef = useRef(false)

  const fetchSummary = useCallback(async () => {
    if (!token || isFetchingRef.current) return
    isFetchingRef.current = true
    try {
      const data = await getChatSummary(token)
      setSummary(data)
    } catch {
      // Ignore background fetch errors
    } finally {
      isFetchingRef.current = false
    }
  }, [token])

  useEffect(() => {
    if (!token) return
    void fetchSummary()

    // Safety net polling every 30 seconds
    const interval = setInterval(fetchSummary, 30000)
    return () => clearInterval(interval)
  }, [token, fetchSummary])

  // Real-time socket listener for incoming chat notifications
  useEffect(() => {
    if (!token) return

    const socket = connectChat(token)

    const onChatNotification = () => {
      void fetchSummary()
    }

    const onMessagesRead = () => {
      void fetchSummary()
    }

    // Local custom event fired by ChatPage when messages are marked read
    const onLocalChatRead = () => {
      void fetchSummary()
    }

    socket.on("chat_notification", onChatNotification)
    socket.on("messages_read", onMessagesRead)
    window.addEventListener("chat_messages_read", onLocalChatRead)

    return () => {
      socket.off("chat_notification", onChatNotification)
      socket.off("messages_read", onMessagesRead)
      window.removeEventListener("chat_messages_read", onLocalChatRead)
    }
  }, [token, fetchSummary])

  const handleOpenThread = (thread: ChatThreadSummary) => {
    // Dispatch local event so if user is already on ChatPage it switches immediately
    window.dispatchEvent(
      new CustomEvent("workroom_selected", {
        detail: { projectId: thread.projectId },
      }),
    )
    navigate(`/chat?project=${thread.projectId}`)
  }

  const unreadCount = summary.totalUnread
  const threads = summary.threads.slice(0, 6)

  return (
    <Dropdown
      trigger={
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-elevated hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          aria-label={
            unreadCount > 0
              ? `Workroom Chat, ${unreadCount} unread messages`
              : "Workroom Chat"
          }
          title="Workroom Chat"
        >
          <FiMessageSquare className="h-5 w-5" aria-hidden />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-surface shadow-xs animate-in zoom-in-50">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      }
      menuClassName="w-88 p-0 sm:w-96"
    >
      <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5 bg-secondary/15">
        <div className="flex items-center gap-2">
          <FiMessageSquare className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Workroom Messages</span>
        </div>
        {unreadCount > 0 ? (
          <span className="rounded-full bg-primary-500/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
            {unreadCount} unread
          </span>
        ) : (
          <span className="text-[11px] text-subtle">All caught up</span>
        )}
      </div>

      <div className="max-h-84 overflow-y-auto divide-y divide-border/40 p-1">
        {threads.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <FiMessageSquare className="mx-auto h-8 w-8 text-subtle/50 mb-2" />
            <p className="text-xs font-medium text-foreground">No messages yet</p>
            <p className="text-[11px] text-subtle mt-0.5">
              Assigned project workroom chats will appear here.
            </p>
          </div>
        ) : (
          threads.map((thread) => {
            const hasUnread = thread.unreadCount > 0
            const counterparty = thread.counterparty

            return (
              <DropdownItem
                key={thread.projectId}
                onSelect={() => handleOpenThread(thread)}
                className={cn(
                  "p-2.5 rounded-xl transition-all cursor-pointer",
                  hasUnread ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-elevated",
                )}
                icon={
                  <div className="relative shrink-0">
                    {counterparty?.avatarUrl ? (
                      <img
                        src={counterparty.avatarUrl}
                        alt={counterparty.name}
                        className="h-9 w-9 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold text-xs">
                        {counterparty?.name ? counterparty.name.charAt(0).toUpperCase() : <FiUser className="h-4 w-4" />}
                      </div>
                    )}
                    {hasUnread && (
                      <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary-600 ring-2 ring-surface" />
                    )}
                  </div>
                }
              >
                <div className="flex flex-col min-w-0 gap-0.5 pr-1">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={cn(
                        "text-xs truncate",
                        hasUnread ? "font-bold text-foreground" : "font-medium text-foreground/90",
                      )}
                    >
                      {counterparty?.name || "Participant"}
                    </span>
                    {thread.lastMessage && (
                      <span className="text-[10px] text-subtle shrink-0">
                        {formatRelativeTime(thread.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-subtle font-medium truncate">
                    {thread.projectTitle}
                  </p>

                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p
                      className={cn(
                        "text-[11px] truncate leading-tight",
                        hasUnread ? "font-medium text-foreground/80" : "text-muted",
                      )}
                    >
                      {thread.lastMessage?.content || "No messages yet"}
                    </p>
                    {hasUnread && (
                      <span className="shrink-0 rounded-full bg-primary-600 px-1.5 py-0.2 text-[10px] font-bold text-white leading-none">
                        {thread.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </DropdownItem>
            )
          })
        )}
      </div>

      <DropdownSeparator />
      <div
        onClick={() => navigate("/chat")}
        className="flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-primary hover:bg-elevated cursor-pointer transition-colors"
      >
        <span>Open Workroom Chat</span>
        <FiArrowRight className="h-3.5 w-3.5" />
      </div>
    </Dropdown>
  )
}
