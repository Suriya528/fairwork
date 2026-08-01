import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { FiBell } from "react-icons/fi"
import { Dropdown, DropdownItem, DropdownSeparator } from "@/components/ui/Dropdown"
import { NOTIFICATION_META } from "@/components/common/notificationMeta"
import { getNotificationsForUser } from "@/data/notifications"
import { currentUser } from "@/data/users"
import { formatRelativeTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Notification } from "@/types"

const MAX_PREVIEW = 5

/**
 * Bell trigger + preview panel for the Topbar. Full history and filtering
 * live on the Notifications page (/notifications) — this is a compact
 * "last 5" view sharing the exact same icon/tone metadata.
 *
 * Still reads the dummy `currentUser` from data/users.ts rather than
 * AuthContext, unlike Topbar/AccountMenu. Those two only display the
 * logged-in person's identity; this filters data/notifications.ts by
 * user ID, and that dummy data is keyed to fake IDs (usr_client_01, etc)
 * that no real logged-in user will ever match. Switching this over
 * belongs with the "replace dummy business data" pass, not this one —
 * doing it now would just make notifications empty for real users.
 */
export function NotificationBell() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Notification[]>(() =>
    getNotificationsForUser(currentUser.id),
  )

  const unreadCount = items.filter((n) => !n.read).length
  const preview = items.slice(0, MAX_PREVIEW)

  const handleOpenNotification = (item: Notification) => {
    setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)))
    if (item.projectId) navigate(`/projects/${item.projectId}`)
  }

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <Dropdown
      trigger={
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-elevated hover:text-foreground"
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
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <span className="text-sm font-semibold text-foreground">Notifications</span>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="text-xs font-medium text-info hover:text-primary"
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
            const meta = NOTIFICATION_META[item.type]
            return (
              <DropdownItem
                key={item.id}
                onSelect={() => handleOpenNotification(item)}
                icon={
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full",
                      meta.tone === "success" && "bg-success-soft text-success",
                      meta.tone === "danger" && "bg-danger-soft text-danger",
                      meta.tone === "neutral" && "bg-elevated text-muted",
                    )}
                  >
                    <meta.icon className="h-3.5 w-3.5" />
                  </span>
                }
              >
                <span className="flex flex-col gap-0.5 py-0.5">
                  <span
                    className={cn(
                      "text-sm",
                      item.read ? "text-muted" : "font-medium text-foreground",
                    )}
                  >
                    {item.title}
                  </span>
                  <span className="text-xs text-subtle">{formatRelativeTime(item.createdAt)}</span>
                </span>
              </DropdownItem>
            )
          })
        )}
      </div>

      <DropdownSeparator />
      <DropdownItem onSelect={() => navigate("/notifications")}>View all notifications</DropdownItem>
    </Dropdown>
  )
}