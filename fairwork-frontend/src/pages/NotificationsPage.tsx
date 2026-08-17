import { useCallback, useEffect, useMemo, useState } from "react"
import type { ComponentType, SVGProps } from "react"
import { useNavigate } from "react-router-dom"
import { FiBell, FiAlertTriangle, FiCheckCircle, FiPlusCircle, FiShield, FiUnlock, FiActivity as FiActivityIcon } from "react-icons/fi"
import { Button } from "@/components/ui/Button"
import { PageHeader } from "@/components/common/PageHeader"
import { Tabs, type TabItem } from "@/components/ui/Tabs"
import { LoadingState } from "@/components/feedback/LoadingState"
import { ErrorState } from "@/components/feedback/ErrorState"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/format"
import { useAuth } from "@/context/AuthContext"
import { getActivities, markActivitiesRead, type ApiActivity } from "@/services/activityApi"

type IconType = ComponentType<SVGProps<SVGSVGElement>>
type FilterTab = "all" | "unread"

const NOTIFICATION_META: Record<string, { icon: IconType; tone: "neutral" | "success" | "danger" }> = {
  project_created: { icon: FiPlusCircle, tone: "neutral" },
  freelancer_assigned: { icon: FiCheckCircle, tone: "success" },
  escrow_created: { icon: FiShield, tone: "neutral" },
  escrow_funded: { icon: FiShield, tone: "success" },
  escrow_refunded: { icon: FiUnlock, tone: "neutral" },
  milestone_released: { icon: FiUnlock, tone: "success" },
  dispute_opened: { icon: FiAlertTriangle, tone: "danger" },
  dispute_resolved: { icon: FiCheckCircle, tone: "success" },
}

function NotificationRow({
  item,
  onOpen,
}: {
  item: ApiActivity
  onOpen: () => void
}) {
  const meta = NOTIFICATION_META[item.type] ?? { icon: FiActivityIcon, tone: "neutral" }

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex w-full text-left cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        item.read
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
        <span className={cn("text-sm font-medium", item.read ? "text-muted" : "text-foreground")}>
          {item.title}
        </span>
        <p className="text-xs leading-relaxed text-subtle">{item.message}</p>
        <span className="text-[11px] text-subtle/80 mt-1">{formatRelativeTime(item.createdAt)}</span>
      </div>

      {!item.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
    </button>
  )
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [tab, setTab] = useState<FilterTab>("all")
  const [items, setItems] = useState<ApiActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError("")
    try {
      const data = await getActivities(token, 1, 50)
      setItems(data.activities)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load notifications.")
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  const unreadCount = items.filter((item) => !item.read).length
  const visible = useMemo(() => (tab === "unread" ? items.filter((item) => !item.read) : items), [items, tab])

  const handleOpen = (item: ApiActivity) => {
    if (!item.read && token) {
      void markActivitiesRead([item.id], token)
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)))
    }
    if (item.projectId) navigate(`/projects/${item.projectId}`)
  }

  const markAllRead = async () => {
    if (!token || unreadCount === 0) return
    const unreadIds = items.filter((n) => !n.read).map((n) => n.id)
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    try {
      await markActivitiesRead(unreadIds, token)
    } catch {
      void load()
    }
  }

  const tabItems: TabItem[] = [
    { label: "All", value: "all", count: items.length },
    { label: "Unread", value: "unread", count: unreadCount },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <PageHeader
          title="Notifications"
          description="Alerts and logs about your projects, milestone escrow, and disputes."
          actions={
            unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllRead}>
                Mark all as read
              </Button>
            )
          }
        />

        <Tabs items={tabItems} value={tab} onChange={(v) => setTab(v as FilterTab)} />

        {loading ? (
          <LoadingState label="Loading notifications…" />
        ) : error ? (
          <ErrorState title="Couldn't load notifications" description={error} onRetry={() => void load()} />
        ) : visible.length === 0 ? (
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
                onOpen={() => handleOpen(item)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}