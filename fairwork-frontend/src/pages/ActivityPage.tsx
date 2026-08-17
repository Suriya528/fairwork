import { useCallback, useEffect, useMemo, useState } from "react"
import type { ComponentType, SVGProps } from "react"
import { useNavigate } from "react-router-dom"
import { FiActivity as FiActivityIcon, FiAlertTriangle, FiCheckCircle, FiPlusCircle, FiShield, FiUnlock } from "react-icons/fi"
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
const ACTIVITY_META: Record<string, { icon: IconType; tone: "neutral" | "success" | "danger" }> = {
  project_created: { icon: FiPlusCircle, tone: "neutral" }, freelancer_assigned: { icon: FiCheckCircle, tone: "success" },
  escrow_created: { icon: FiShield, tone: "neutral" }, escrow_funded: { icon: FiShield, tone: "success" }, escrow_refunded: { icon: FiUnlock, tone: "neutral" },
  milestone_released: { icon: FiUnlock, tone: "success" }, dispute_opened: { icon: FiAlertTriangle, tone: "danger" },
  dispute_resolved: { icon: FiCheckCircle, tone: "success" }, wallet_verified: { icon: FiShield, tone: "success" },
}

function ActivityRow({ item, onOpen }: { item: ApiActivity; onOpen: () => void }) {
  const meta = ACTIVITY_META[item.type] ?? { icon: FiActivityIcon, tone: "neutral" as const }
  return <button type="button" onClick={onOpen} className={cn("flex w-full text-left cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", item.read ? "border-border bg-surface hover:border-border-strong" : "border-primary/25 bg-primary/[0.04] hover:border-primary/40")}>
    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full border", meta.tone === "success" && "border-success/40 bg-success-soft text-success", meta.tone === "danger" && "border-danger/40 bg-danger-soft text-danger", meta.tone === "neutral" && "border-border bg-elevated text-muted")}><meta.icon className="h-4 w-4" /></span>
    <div className="flex min-w-0 flex-1 flex-col gap-0.5"><p className={cn("text-sm font-medium", item.read ? "text-muted" : "text-foreground")}>{item.title}</p><p className="text-sm leading-relaxed text-muted">{item.message}</p><span className="text-xs text-subtle">{formatRelativeTime(item.createdAt)}</span></div>
    {!item.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
  </button>
}

export function ActivityPage() {
  const { token } = useAuth(); const navigate = useNavigate()
  const [tab, setTab] = useState<FilterTab>("all"), [items, setItems] = useState<ApiActivity[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState(""), [page, setPage] = useState(1), [hasMore, setHasMore] = useState(false)
  const load = useCallback(async (nextPage = 1) => { if (!token) return; setLoading(nextPage === 1); setError(""); try { const data = await getActivities(token, nextPage); setItems(current => nextPage === 1 ? data.activities : [...current, ...data.activities]); setPage(data.pagination.page); setHasMore(data.pagination.hasMore) } catch (err) { setError(err instanceof Error ? err.message : "Could not load activity.") } finally { setLoading(false) } }, [token])
  useEffect(() => { void load() }, [load])
  const visible = useMemo(() => tab === "unread" ? items.filter(item => !item.read) : items, [items, tab]); const unread = items.filter(item => !item.read)
  const markRead = async (ids: string[]) => { if (!token || !ids.length) return; setItems(current => current.map(item => ids.includes(item.id) ? { ...item, read: true } : item)); try { await markActivitiesRead(ids, token) } catch { void load() } }
  const open = (item: ApiActivity) => { if (!item.read) void markRead([item.id]); if (item.projectId) navigate(`/projects/${item.projectId}`) }
  const tabs: TabItem[] = [{ label: "All", value: "all", count: items.length }, { label: "Unread", value: "unread", count: unread.length }]
  return <div className="p-4 sm:p-6 lg:p-8"><div className="mx-auto flex w-full max-w-3xl flex-col gap-6"><PageHeader title="Activity" description="A live log of what's happening across your projects." actions={unread.length > 0 && <Button variant="outline" size="sm" onClick={() => void markRead(unread.map(item => item.id))}>Mark all as read</Button>} /><Tabs items={tabs} value={tab} onChange={(value) => setTab(value as FilterTab)} />{loading ? <LoadingState label="Loading activity…" /> : error ? <ErrorState title="Couldn't load activity" description={error} onRetry={() => void load()} /> : visible.length === 0 ? <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center"><FiActivityIcon className="mb-3 h-6 w-6 text-subtle" /><p className="text-sm font-medium text-foreground">{tab === "unread" ? "You're all caught up" : "No activity yet"}</p></div> : <><div className="flex flex-col gap-2">{visible.map(item => <ActivityRow key={item.id} item={item} onOpen={() => open(item)} />)}</div>{tab === "all" && hasMore && <Button variant="outline" onClick={() => void load(page + 1)}>Load more</Button>}</>}</div></div>
}
