import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiCalendar,
  FiDollarSign,
  FiExternalLink,
  FiLock,
  FiPaperclip,
  FiPlusCircle,
  FiUnlock,
} from "react-icons/fi"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Card, CardContent } from "@/components/ui/Card"
import { Progress } from "@/components/ui/Progress"
import { Breadcrumb } from "@/components/common/Breadcrumb"
import { StatusBadge } from "@/components/common/StatusBadge"
import { ProjectStatusBadge } from "@/components/common/ProjectStatusBadge"
import { MetricCard } from "@/components/common/MetricCard"
import { Avatar } from "@/components/ui/Avatar"
import { WalletAddress } from "@/components/common/WalletAddress"
import { Tabs, type TabItem } from "@/components/ui/Tabs"
import { formatCurrency, formatDate, toPercent } from "@/lib/format"
import { useAuth } from "@/context/AuthContext"
import { ApiError } from "@/services/apiClient"
import {
  getProjectById,
  type ApiMilestone,
  type ApiProject,
} from "@/services/projectsApi"

type TabValue = "overview" | "milestones" | "files" | "activity"

function ProjectNotFound() {
  const navigate = useNavigate()
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card className="mx-auto max-w-md">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-surface">
            <FiAlertTriangle className="h-6 w-6 text-subtle" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold text-foreground">Project not found</h3>
            <p className="text-sm text-muted">This project may have been removed, or the link is incorrect.</p>
          </div>
          <Button variant="primary" onClick={() => navigate("/projects")}>Back to projects</Button>
        </CardContent>
      </Card>
    </div>
  )
}

function IdentityCard({ role, name, walletAddress }: {
  role: "Client" | "Freelancer"
  name: string | null
  walletAddress: string | null
}) {
  if (!name) {
    return (
      <div className="flex flex-col gap-1 rounded-xl border border-dashed border-border bg-surface p-4">
        <span className="text-xs font-medium uppercase tracking-wide text-subtle">{role}</span>
        <span className="text-sm text-muted">Not assigned yet</span>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
      <Avatar name={name} size="md" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-subtle">{role}</span>
        <span className="truncate text-sm font-medium text-foreground">{name}</span>
        {walletAddress && <WalletAddress address={walletAddress} className="mt-1 w-fit" />}
      </div>
    </div>
  )
}

function MilestoneRow({ milestone }: { milestone: ApiMilestone }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex gap-3">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-elevated text-xs font-medium text-muted">{milestone.order}</div>
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-foreground">{milestone.title}</span>
            <StatusBadge status={milestone.status} />
          </div>
        </div>
      </div>
      <span className="shrink-0 text-sm font-semibold text-foreground">{formatCurrency(milestone.amount)}</span>
    </div>
  )
}

function DeferredAction({ label, icon, danger = false }: { label: string; icon: ReactNode; danger?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <Button variant={danger ? "danger" : "primary"} fullWidth leftIcon={icon} disabled>{label}</Button>
        <Badge tone="warning">Coming soon</Badge>
      </div>
      <p className="text-xs text-muted">Available once blockchain escrow integration is complete.</p>
    </div>
  )
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { token } = useAuth()
  const [tab, setTab] = useState<TabValue>("overview")
  const [project, setProject] = useState<ApiProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id || !token) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      setNotFound(false)
      try {
        const data = await getProjectById(id!, token!)
        if (!cancelled) setProject(data)
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 404) setNotFound(true)
          else setError(err instanceof Error ? err.message : "Couldn't load project.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [id, token])

  if (loading) return <div className="p-4 text-sm text-muted sm:p-6 lg:p-8">Loading project...</div>
  if (notFound) return <ProjectNotFound />
  if (error || !project) {
    return <div className="p-4 sm:p-6 lg:p-8"><div role="alert" className="rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger">{error ?? "Couldn't load project."}</div></div>
  }

  const completedCount = project.milestones.filter((milestone) => milestone.status === "completed").length
  const completedAmount = project.milestones
    .filter((milestone) => milestone.status === "completed")
    .reduce((sum, milestone) => sum + milestone.amount, 0)
  const remainingAmount = project.budget - completedAmount
  const tabItems: TabItem[] = [
    { label: "Overview", value: "overview" },
    { label: "Milestones", value: "milestones", count: project.milestones.length },
    { label: "Files", value: "files" },
    { label: "Activity", value: "activity", count: 1 },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Breadcrumb items={[{ label: "Dashboard", to: "/" }, { label: "Projects", to: "/projects" }, { label: project.title }]} />

        <Card className="p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance sm:text-3xl">{project.title}</h1>
                <ProjectStatusBadge status={project.status} />
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
                <span className="flex items-center gap-1.5"><FiDollarSign className="h-4 w-4 text-subtle" />{formatCurrency(project.budget)}</span>
                <span className="flex items-center gap-1.5"><FiCalendar className="h-4 w-4 text-subtle" />Created {formatDate(project.createdAt)}</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" leftIcon={<FiArrowLeft className="h-4 w-4" />} onClick={() => navigate("/projects")}>Back to projects</Button>
          </div>
        </Card>

        {project.status === "disputed" && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-danger/25 bg-danger-soft px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-danger"><FiAlertTriangle className="h-4 w-4 shrink-0" />This project has an open dispute. Escrow release is frozen until it&apos;s resolved.</div>
            <Link to="/disputes" className="flex shrink-0 items-center gap-1 text-xs font-medium text-danger hover:underline">View disputes<FiExternalLink className="h-3 w-3" /></Link>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <Tabs items={tabItems} value={tab} onChange={(value) => setTab(value as TabValue)} className="mb-6" />

            {tab === "overview" && (
              <div className="flex flex-col gap-6">
                <Card><CardContent className="flex flex-col gap-4 p-6"><h3 className="text-sm font-semibold text-foreground">Description</h3><p className="text-sm leading-relaxed text-muted">{project.description}</p></CardContent></Card>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <IdentityCard role="Client" name={project.clientName} walletAddress={project.clientWalletAddress} />
                  <IdentityCard role="Freelancer" name={project.freelancerName} walletAddress={project.freelancerWalletAddress} />
                </div>
                <Card><CardContent className="flex flex-col gap-3 p-6"><div className="flex items-center justify-between text-sm"><span className="font-medium text-foreground">Milestone progress</span><span className="text-muted">{completedCount} of {project.milestones.length} completed</span></div><Progress value={toPercent(completedCount, project.milestones.length)} tone={completedCount === project.milestones.length ? "success" : "primary"} /></CardContent></Card>
              </div>
            )}

            {tab === "milestones" && <div className="flex flex-col gap-3">{project.milestones.length === 0 ? <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">No milestones yet</p> : project.milestones.map((milestone) => <MilestoneRow key={milestone.id} milestone={milestone} />)}</div>}

            {tab === "files" && <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center"><FiPaperclip className="mb-3 h-6 w-6 text-subtle" /><Badge tone="warning">Coming soon</Badge><p className="mt-3 text-sm font-medium text-foreground">Deliverable tracking is not available yet</p><p className="mt-1 max-w-xs text-xs text-muted">File uploads and deliverable tracking arrive with blockchain integration.</p></div>}

            {tab === "activity" && <div className="flex flex-col gap-3"><div className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-subtle"><FiPlusCircle className="h-3.5 w-3.5" /></span><div className="flex flex-col gap-0.5"><span className="text-sm text-foreground">Project created</span><span className="text-xs text-subtle">{formatDate(project.createdAt)}</span></div></div><p className="rounded-xl border border-dashed border-border px-4 py-3 text-xs text-muted">Escrow funding, milestone approvals, and fund releases will appear here with blockchain integration.</p></div>}
          </div>

          <aside className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
              <MetricCard label="Total budget" value={formatCurrency(project.budget)} icon={FiDollarSign} />
              <MetricCard label="Completed" value={formatCurrency(completedAmount)} icon={FiUnlock} hint={`${completedCount} of ${project.milestones.length} milestones`} />
              <MetricCard label="Remaining" value={formatCurrency(remainingAmount)} icon={FiLock} />
            </div>
            <Card><CardContent className="flex flex-col gap-3 p-5"><h3 className="mb-1 text-sm font-semibold text-foreground">Actions</h3><DeferredAction label="Fund escrow" icon={<FiLock className="h-4 w-4" />} /><DeferredAction label="Approve & release" icon={<FiUnlock className="h-4 w-4" />} /><DeferredAction label="Raise a dispute" icon={<FiAlertTriangle className="h-4 w-4" />} danger /></CardContent></Card>
          </aside>
        </div>
      </div>
    </div>
  )
}
