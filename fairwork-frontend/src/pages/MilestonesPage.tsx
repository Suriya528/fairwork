import { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { FiCheckSquare, FiClock } from "react-icons/fi"
import { EmptyState } from "@/components/feedback/EmptyState"
import { MetricCard } from "@/components/common/MetricCard"
import { PageHeader } from "@/components/common/PageHeader"
import { Tabs, type TabItem } from "@/components/ui/Tabs"
import { useAuth } from "@/context/AuthContext"
import { getMyProjects, type ApiMilestone, type ApiProject } from "@/services/projectsApi"
import { formatCurrency } from "@/lib/format"

type Tab = "active" | "completed" | "all"
type PaymentFilter = "unreleased" | "released"
type Item = ApiMilestone & { projectTitle: string }

export function MilestonesPage() {
  const { user, token } = useAuth()
  const nav = useNavigate()
  const [searchParams] = useSearchParams()
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [tab, setTab] = useState<Tab>("active")
  const [error, setError] = useState("")

  const isClient = user?.role === "client"
  const payment = searchParams.get("payment") as PaymentFilter | null
  const paymentFilter = payment === "unreleased" || payment === "released" ? payment : null

  useEffect(() => {
    if (token) getMyProjects(token).then(setProjects).catch((e: Error) => setError(e.message))
  }, [token])

  const all = useMemo<Item[]>(
    () => projects.flatMap((p) => p.milestones.map((m) => ({ ...m, projectTitle: p.title }))),
    [projects],
  )
  const pending = all.filter((m) => m.status === "pending")
  const completed = all.filter((m) => m.status === "completed")
  const list =
    paymentFilter === "unreleased"
      ? all.filter((m) => !m.paymentReleased)
      : paymentFilter === "released"
        ? all.filter((m) => m.paymentReleased)
        : tab === "active"
          ? pending
          : tab === "completed"
            ? completed
            : all

  const tabs: TabItem[] = [
    { label: isClient ? "Pending Release" : "Pending Payout", value: "active", count: pending.length },
    { label: isClient ? "Released / Completed" : "Earned & Released", value: "completed", count: completed.length },
    { label: "All Milestones", value: "all", count: all.length },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <PageHeader
          title="Milestones"
          description={
            isClient
              ? "Review milestone deliverables and release escrowed funds for completed work."
              : "Track assigned project milestones, deliverable progress, and incoming payment releases."
          }
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard label={isClient ? "Unreleased milestones" : "Pending payouts"} value={String(pending.length)} icon={FiClock} />
          <MetricCard label={isClient ? "Released milestones" : "Completed payouts"} value={String(completed.length)} icon={FiCheckSquare} />
        </div>
        {paymentFilter ? (
          <p className="text-sm text-muted">Showing {paymentFilter} milestone payments.</p>
        ) : (
          <Tabs items={tabs} value={tab} onChange={(v) => setTab(v as Tab)} />
        )}
        {list.length ? (
          <div className="flex flex-col gap-3">
            {list.map((m) => (
              <button
                type="button"
                key={m.id}
                onClick={() => nav(`/projects/${m.projectId}`)}
                className="flex items-center justify-between rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-border-strong hover:bg-surface-hover"
              >
                <div>
                  <p className="font-medium text-foreground">{m.title}</p>
                  <p className="text-xs text-muted">{m.projectTitle}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">{formatCurrency(m.amount)}</p>
                  <p className="text-xs text-muted">
                    {m.paymentReleased
                      ? isClient
                        ? "Released ✓"
                        : "Earned & Released ✓"
                      : isClient
                        ? "Awaiting Release"
                        : "Unreleased"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FiCheckSquare}
            title="No milestones found"
            description={
              isClient
                ? "Milestones created for your projects will appear here."
                : "Milestones for assigned projects will appear here."
            }
          />
        )}
      </div>
    </div>
  )
}
