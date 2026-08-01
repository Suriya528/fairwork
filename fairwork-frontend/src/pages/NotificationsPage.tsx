import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { FiBell } from "react-icons/fi"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { PageHeader } from "@/components/common/PageHeader"
import { Tabs, type TabItem } from "@/components/ui/Tabs"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/format"
import { getNotificationsForUser } from "@/data/notifications"
import { NOTIFICATION_META } from "@/components/common/notificationMeta"
import type { Notification } from "@/types"

type FilterTab = "all" | "unread"

// TODO: replace with the real authenticated user once session/auth
// context exists (only services/authApi.ts is wired up so far).
const CURRENT_USER_ID = "usr_client_01"

function NotificationRow({
  item,
  isRead,
  onOpen,
}: {
  item: Notification
  isRead: boolean
  onOpen: () => void
}) {
  const meta = NOTIFICATION_META[item.type]

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onOpen()
        }
      }}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
        isRead
          ? "border-border bg-surface hover:border-border-strong"
          : "border-primary/25 bg-primary/[0.04] hover:border-primary/40",
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
          meta.tone === "success" && "border-success/40 bg-success-soft text-success",
          meta.tone === "danger" && "border-danger/40 bg-danger-soft text-danger",
          meta.tone === "neutral" && "border-border bg-elevated text-muted",
        )}
      >
        <meta.icon className="h-4 w-4" />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("text-sm font-medium", isRead ? "text-muted" : "text-foreground")}>
            {item.title}
          </span>
          {item.priority === "high" && !isRead && (
            <Badge tone="danger">Important</Badge>
          )}
        </div>
        <p className="text-xs leading-relaxed text-subtle">{item.message}</p>
        <span className="text-xs text-subtle">{formatRelativeTime(item.createdAt)}</span>
      </div>

      {!isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />}
    </div>
  )
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<FilterTab>("all")
  const [locallyReadIds, setLocallyReadIds] = useState<string[]>([])

  const myNotifications = useMemo(() => getNotificationsForUser(CURRENT_USER_ID), [])

  const isRead = (item: Notification) => item.read || locallyReadIds.includes(item.id)
  const unreadCount = myNotifications.filter((item) => !isRead(item)).length

  const visible = tab === "unread" ? myNotifications.filter((item) => !isRead(item)) : myNotifications

  const handleOpen = (item: Notification) => {
    if (!isRead(item)) setLocallyReadIds((prev) => [...prev, item.id])
    if (item.projectId) navigate(`/projects/${item.projectId}`)
  }

  const markAllRead = () => setLocallyReadIds(myNotifications.map((item) => item.id))

  const tabItems: TabItem[] = [
    { label: "All", value: "all", count: myNotifications.length },
    { label: "Unread", value: "unread", count: unreadCount },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <PageHeader
          title="Notifications"
          description="Alerts about your projects, payments, and messages."
          actions={
            unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllRead}>
                Mark all as read
              </Button>
            )
          }
        />

        <Tabs items={tabItems} value={tab} onChange={(v) => setTab(v as FilterTab)} />

        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <FiBell className="mb-3 h-6 w-6 text-subtle" />
            <p className="text-sm font-medium text-foreground">
              {tab === "unread" ? "You're all caught up" : "No notifications yet"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {visible.map((item) => (
              <NotificationRow
                key={item.id}
                item={item}
                isRead={isRead(item)}
                onOpen={() => handleOpen(item)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}