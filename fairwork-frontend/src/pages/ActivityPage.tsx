import { useMemo, useState } from "react"
import type { ComponentType, SVGProps } from "react"
import { useNavigate } from "react-router-dom"
import {
  FiAlertTriangle,
  FiActivity as FiActivityIcon,
  FiCheckCircle,
  FiMessageSquare,
  FiPlusCircle,
  FiShield,
  FiUnlock,
  FiUpload,
} from "react-icons/fi"
import { Button } from "@/components/ui/Button"
import { PageHeader } from "@/components/common/PageHeader"
import { Avatar } from "@/components/ui/Avatar"
import { Tabs, type TabItem } from "@/components/ui/Tabs"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/format"
import { activityFeed } from "@/data/activity"
import { projects } from "@/data/projects"
import { users } from "@/data/users"
import type { ActivityItem, ActivityType } from "@/types"
 
type IconType = ComponentType<SVGProps<SVGSVGElement>>
type FilterTab = "all" | "unread"
 
// TODO: replace with the real authenticated user once session/auth
// context exists (only services/authApi.ts is wired up so far).
const CURRENT_USER_ID = "usr_client_01"
 
const ACTIVITY_META: Record<
  ActivityType,
  { icon: IconType; tone: "neutral" | "success" | "danger" }
> = {
  project_created: { icon: FiPlusCircle, tone: "neutral" },
  escrow_funded: { icon: FiShield, tone: "neutral" },
  milestone_submitted: { icon: FiUpload, tone: "neutral" },
  milestone_approved: { icon: FiCheckCircle, tone: "success" },
  funds_released: { icon: FiUnlock, tone: "success" },
  dispute_opened: { icon: FiAlertTriangle, tone: "danger" },
  dispute_resolved: { icon: FiCheckCircle, tone: "success" },
  message: { icon: FiMessageSquare, tone: "neutral" },
}
 
function ActivityRow({
  item,
  isRead,
  onOpen,
}: {
  item: ActivityItem
  isRead: boolean
  onOpen: () => void
}) {
  const actor = users.find((u) => u.id === item.actorId)
  const meta = ACTIVITY_META[item.type]
 
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
 
      <Avatar name={actor?.name ?? "Unknown"} src={actor?.avatarUrl} size="sm" />
 
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className={cn("text-sm leading-relaxed", isRead ? "text-muted" : "text-foreground")}>
          {item.message}
        </p>
        <span className="text-xs text-subtle">{formatRelativeTime(item.createdAt)}</span>
      </div>
 
      {!isRead && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
      )}
    </div>
  )
}
 
export function ActivityPage() {
  const navigate = useNavigate()
  const currentUser = users.find((u) => u.id === CURRENT_USER_ID)
  const isClient = currentUser?.role === "client"
 
  const [tab, setTab] = useState<FilterTab>("all")
  const [locallyReadIds, setLocallyReadIds] = useState<string[]>([])
 
  const myFeed = useMemo(() => {
    if (!currentUser) return []
    const myProjectIds = new Set(
      projects
        .filter((p) => (isClient ? p.clientId === currentUser.id : p.freelancerId === currentUser.id))
        .map((p) => p.id),
    )
    return activityFeed
      .filter((item) => item.projectId && myProjectIds.has(item.projectId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [currentUser, isClient])
 
  const isRead = (item: ActivityItem) => item.read || locallyReadIds.includes(item.id)
  const unreadCount = myFeed.filter((item) => !isRead(item)).length
 
  const visible = tab === "unread" ? myFeed.filter((item) => !isRead(item)) : myFeed
 
  const handleOpen = (item: ActivityItem) => {
    if (!isRead(item)) setLocallyReadIds((prev) => [...prev, item.id])
    if (item.projectId) navigate(`/projects/${item.projectId}`)
  }
 
  const markAllRead = () => {
    setLocallyReadIds(myFeed.map((item) => item.id))
  }
 
  const tabItems: TabItem[] = [
    { label: "All", value: "all", count: myFeed.length },
    { label: "Unread", value: "unread", count: unreadCount },
  ]
 
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <PageHeader
          title="Activity"
          description="A live log of what's happening across your projects."
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
            <FiActivityIcon className="mb-3 h-6 w-6 text-subtle" />
            <p className="text-sm font-medium text-foreground">
              {tab === "unread" ? "You're all caught up" : "No activity yet"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {visible.map((item) => (
              <ActivityRow
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