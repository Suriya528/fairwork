import { Link } from "react-router-dom"
import { FiBell } from "react-icons/fi"
import { Card, CardBody } from "@/components/ui/Card"
import { Skeleton } from "@/components/ui/Skeleton"
import { EmptyState } from "@/components/feedback/EmptyState"
import { activityFeed } from "@/data/activity"
import { formatRelativeTime } from "@/lib/format"
import { cn } from "@/lib/utils"

export interface NotificationsPreviewProps {
  loading?: boolean
}

/** Compact panel surfacing the newest notifications. */
export function NotificationsPreview({
  loading = false,
}: NotificationsPreviewProps) {
  const notifications = [...activityFeed]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 4)
  const unread = notifications.filter((n) => !n.read).length

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-2">
          <FiBell className="h-4 w-4 text-muted" aria-hidden />
          <h2 className="text-sm font-semibold text-foreground">
            Notifications
          </h2>
          {unread > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
              {unread}
            </span>
          )}
        </div>
        <Link
          to="/activity"
          className="rounded text-xs font-medium text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          View all
        </Link>
      </div>

      {loading ? (
        <CardBody className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="mt-1 h-2 w-2 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-full max-w-[200px]" />
                <Skeleton className="mt-1.5 h-3 w-16" />
              </div>
            </div>
          ))}
        </CardBody>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={FiBell}
          title="You're all caught up"
          description="New notifications will appear here."
          className="border-0 bg-transparent"
        />
      ) : (
        <ul className="divide-y divide-border">
          {notifications.map((n) => (
            <li
              key={n.id}
              className="flex items-start gap-3 p-4 transition-colors hover:bg-surface-hover"
            >
              <span
                className={cn(
                  "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                  n.read ? "bg-border-strong" : "bg-primary",
                )}
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-sm leading-relaxed text-foreground text-pretty">
                  {n.message}
                </p>
                <p className="mt-0.5 text-xs text-subtle">
                  {formatRelativeTime(n.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
