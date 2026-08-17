import { useEffect, useState } from "react"
import type { IconType } from "react-icons"
import { FiActivity, FiAlertTriangle, FiCheckCircle, FiFilePlus, FiShield, FiUnlock } from "react-icons/fi"
import { Card, CardBody } from "@/components/ui/Card"
import { EmptyState } from "@/components/feedback/EmptyState"
import { ErrorState } from "@/components/feedback/ErrorState"
import { Skeleton } from "@/components/ui/Skeleton"
import { SectionHeading } from "./SectionHeading"
import { formatRelativeTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { getActivities, type ApiActivity } from "@/services/activityApi"

const activityMeta: Record<string, { icon: IconType; tone: string }> = {
  project_created: { icon: FiFilePlus, tone: "bg-info-soft text-info" }, freelancer_assigned: { icon: FiCheckCircle, tone: "bg-success-soft text-success" },
  escrow_created: { icon: FiShield, tone: "bg-primary/15 text-info" }, escrow_funded: { icon: FiShield, tone: "bg-success-soft text-success" },
  escrow_refunded: { icon: FiUnlock, tone: "bg-elevated text-muted" }, milestone_released: { icon: FiUnlock, tone: "bg-success-soft text-success" },
  dispute_opened: { icon: FiAlertTriangle, tone: "bg-danger-soft text-danger" }, dispute_resolved: { icon: FiCheckCircle, tone: "bg-success-soft text-success" },
}

export function RecentActivity() {
  const { token } = useAuth()
  const [items, setItems] = useState<ApiActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!token) return
    let cancelled = false
    void getActivities(token, 1, 5).then((data) => { if (!cancelled) setItems(data.activities) }).catch((err: unknown) => { if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load activity.") }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [token])

  return <section aria-labelledby="activity-heading" className="flex flex-col gap-4"><SectionHeading id="activity-heading" title="Recent activity" description="Latest events for your projects" actionLabel="View all" actionTo="/activity" />
    {error ? <ErrorState title="Unable to load activity" description={error} /> : <Card><CardBody>{loading ? <div className="flex flex-col gap-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="flex gap-3"><Skeleton className="h-8 w-8 rounded-full" /><div className="flex-1"><Skeleton className="h-4 w-full max-w-xs" /><Skeleton className="mt-1.5 h-3 w-20" /></div></div>)}</div> : items.length === 0 ? <EmptyState icon={FiActivity} title="No recent activity" description="Project and escrow events will appear here." className="border-0" /> : <ol className="relative flex flex-col">{items.map((item, index) => { const meta = activityMeta[item.type] ?? { icon: FiActivity, tone: "bg-elevated text-muted" }; const Icon = meta.icon; return <li key={item.id} className="relative flex gap-3 pb-4 last:pb-0">{index < items.length - 1 && <span className="absolute left-4 top-8 h-[calc(100%-1rem)] w-px -translate-x-1/2 bg-border" aria-hidden />}<span className={cn("relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", meta.tone)}><Icon className="h-4 w-4" aria-hidden /></span><div className="min-w-0 pt-1"><p className="text-sm leading-snug text-foreground">{item.message}</p><p className="mt-1 text-xs text-subtle">{formatRelativeTime(item.createdAt)}</p></div></li> })}</ol>}</CardBody></Card>}</section>
}
