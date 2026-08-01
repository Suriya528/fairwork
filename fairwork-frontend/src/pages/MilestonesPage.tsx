import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { FiCalendar, FiCheckSquare, FiClock, FiFolder } from "react-icons/fi"
import { PageHeader } from "@/components/common/PageHeader"
import { MetricCard } from "@/components/common/MetricCard"
import { StatusBadge } from "@/components/common/StatusBadge"
import { Tabs, type TabItem } from "@/components/ui/Tabs"
import { getMilestonesForProject, projects } from "@/data/projects"
import { users } from "@/data/users"
import { formatCurrency, formatDate } from "@/lib/format"
import type { Milestone } from "@/types"
 
// TODO: replace with the real authenticated user once session/auth
// context exists (only services/authApi.ts is wired up so far).
const CURRENT_USER_ID = "usr_client_01"
 
type FilterTab = "active" | "completed" | "all"
 
const ACTIVE_MILESTONE_STATUSES: Milestone["status"][] = [
  "pending",
  "in_progress",
  "submitted",
  "disputed",
  "rejected",
]
const COMPLETED_MILESTONE_STATUSES: Milestone["status"][] = ["approved", "released"]
 
interface MilestoneWithProject extends Milestone {
  projectTitle: string
}
 
function GlobalMilestoneRow({ milestone }: { milestone: MilestoneWithProject }) {
  const navigate = useNavigate()
  const goToProject = () => navigate(`/projects/${milestone.projectId}`)
 
  return (
    <div
      role="link"
      tabIndex={0}
      onClick={goToProject}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          goToProject()
        }
      }}
      className="flex cursor-pointer flex-col gap-2 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-surface-hover sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-foreground">{milestone.title}</span>
          <StatusBadge status={milestone.status} />
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-subtle">
          <span className="flex items-center gap-1">
            <FiFolder className="h-3 w-3" />
            {milestone.projectTitle}
          </span>
          <span className="flex items-center gap-1">
            <FiCalendar className="h-3 w-3" />
            Due {formatDate(milestone.dueDate)}
          </span>
        </div>
      </div>
      <span className="shrink-0 text-sm font-semibold text-foreground">
        {formatCurrency(milestone.amount)}
      </span>
    </div>
  )
}
 
export function MilestonesPage() {
  const [tab, setTab] = useState<FilterTab>("active")
  const currentUser = users.find((u) => u.id === CURRENT_USER_ID)
  const isClient = currentUser?.role === "client"
 
  const myMilestones: MilestoneWithProject[] = useMemo(() => {
    if (!currentUser) return []
    const myProjects = projects.filter((p) =>
      isClient ? p.clientId === currentUser.id : p.freelancerId === currentUser.id,
    )
    return myProjects.flatMap((p) =>
      getMilestonesForProject(p.id).map((m) => ({ ...m, projectTitle: p.title })),
    )
  }, [currentUser, isClient])
 
  const activeMilestones = myMilestones.filter((m) =>
    ACTIVE_MILESTONE_STATUSES.includes(m.status),
  )
  const completedMilestones = myMilestones.filter((m) =>
    COMPLETED_MILESTONE_STATUSES.includes(m.status),
  )
  const needsApproval = myMilestones.filter((m) => m.status === "submitted")
 
  const visible = useMemo(() => {
    const list =
      tab === "active" ? activeMilestones : tab === "completed" ? completedMilestones : myMilestones
 
    return [...list].sort((a, b) => {
      if (tab === "completed") {
        const aDate = a.releasedAt ?? a.approvedAt ?? a.dueDate
        const bDate = b.releasedAt ?? b.approvedAt ?? b.dueDate
        return new Date(bDate).getTime() - new Date(aDate).getTime()
      }
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })
  }, [tab, activeMilestones, completedMilestones, myMilestones])
 
  const tabItems: TabItem[] = [
    { label: "Active", value: "active", count: activeMilestones.length },
    { label: "Completed", value: "completed", count: completedMilestones.length },
    { label: "All", value: "all", count: myMilestones.length },
  ]
 
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <PageHeader
          title="Milestones"
          description="Track deliverables across every project you're part of."
        />
 
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard label="Active" value={String(activeMilestones.length)} icon={FiClock} />
          <MetricCard
            label={isClient ? "Awaiting your approval" : "Awaiting client review"}
            value={String(needsApproval.length)}
            icon={FiCheckSquare}
          />
          <MetricCard
            label="Completed"
            value={String(completedMilestones.length)}
            icon={FiCheckSquare}
          />
        </div>
 
        <Tabs items={tabItems} value={tab} onChange={(v) => setTab(v as FilterTab)} />
 
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <FiCheckSquare className="mb-3 h-6 w-6 text-subtle" />
            <p className="text-sm font-medium text-foreground">
              {tab === "active" ? "No active milestones" : tab === "completed" ? "No completed milestones yet" : "No milestones yet"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {visible.map((m) => (
              <GlobalMilestoneRow key={m.id} milestone={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}