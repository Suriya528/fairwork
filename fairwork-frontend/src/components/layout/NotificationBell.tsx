import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { FiBell, FiActivity, FiCheckCircle, FiShield, FiUnlock, FiAlertTriangle, FiPlusCircle } from "react-icons/fi"
import type { IconType } from "react-icons"
import { Dropdown, DropdownItem, DropdownSeparator } from "@/components/ui/Dropdown"
import { formatRelativeTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { getActivities, markActivitiesRead, type ApiActivity } from "@/services/activityApi"

const MAX_PREVIEW = 5

const ACTIVITY_ICONS: Record<string, { icon: IconType; tone: "neutral" | "success" | "danger" }> = {
  project_created: { icon: FiPlusCircle, tone: "neutral" },
  freelancer_assigned: { icon: FiCheckCircle, tone: "success" },
  escrow_created: { icon: FiShield, tone: "neutral" },
  escrow_funded: { icon: FiShield, tone: "success" },
  escrow_refunded: { icon: FiUnlock, tone: "neutral" },
  milestone_released: { icon: FiUnlock, tone: "success" },
  dispute_opened: { icon: FiAlertTriangle, tone: "danger" },
  dispute_resolved: { icon: FiCheckCircle, tone: "success" },
}

/**
 * Bell trigger + live activity notification preview panel for the Topbar.
 * Binds to real user session activity via `getActivities()`.
 */
export function NotificationBell() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [items, setItems] = useState<ApiActivity[]>([])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    void getActivities(token, 1, MAX_PREVIEW).then((data) => {
      if (!cancelled) setItems(data.activities)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [token])

  const unreadCount = items.filter((n) => !n.read).length
  const preview = items.slice(0, MAX_PREVIEW)

  const handleOpenNotification = (item: ApiActivity) => {
    if (!item.read && token) {
      void markActivitiesRead([item.id], token)
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)))
    }
    if (item.projectId) navigate(`/projects/${item.projectId}`)
  }

  const markAllRead = () => {
    if (!token || unreadCount === 0) return
    const unreadIds = items.filter((n) => !n.read).map((n) => n.id)
    void markActivitiesRead(unreadIds, token)
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <Dropdown
      trigger={
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-elevated hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        >
          <FiBell className="h-5 w-5" aria-hidden />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-none text-danger-foreground ring-2 ring-surface">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      }
      menuClassName="w-80 p-0"
    >
      <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
        <span className="text-sm font-semibold text-foreground">Notifications</span>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="text-xs font-medium text-info hover:text-primary transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto p-1">
        {preview.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-subtle">No notifications yet</p>
        ) : (
          preview.map((item) => {
            const meta = ACTIVITY_ICONS[item.type] ?? { icon: FiActivity, tone: "neutral" }
            const Icon = meta.icon
            return (
              <DropdownItem
                key={item.id}
                onSelect={() => handleOpenNotification(item)}
                icon={
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full border shrink-0",
                      meta.tone === "success" && "border-success/30 bg-success-soft text-success",
                      meta.tone === "danger" && "border-danger/30 bg-danger-soft text-danger",
                      meta.tone === "neutral" && "border-border bg-elevated text-muted",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                }
              >
                <span className="flex flex-col gap-0.5 py-0.5 min-w-0">
                  <span
                    className={cn(
                      "text-xs truncate",
                      item.read ? "text-muted" : "font-semibold text-foreground",
                    )}
                  >
                    {item.title}
                  </span>
                  <span className="text-[11px] leading-tight text-subtle truncate">{item.message}</span>
                  <span className="text-[10px] text-subtle/80 mt-0.5">{formatRelativeTime(item.createdAt)}</span>
                </span>
              </DropdownItem>
            )
          })
        )}
      </div>

      <DropdownSeparator />
      <DropdownItem onSelect={() => navigate("/activity")}>View all activity</DropdownItem>
    </Dropdown>
  )
}