import { useEffect, useMemo, useState } from "react"
import { FiBriefcase, FiCheckCircle, FiDollarSign, FiFolder, FiPlus } from "react-icons/fi"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ApiProjectCard } from "@/components/projects/ApiProjectCard"
import { EmptyState } from "@/components/feedback/EmptyState"
import { MetricCard } from "@/components/common/MetricCard"
import { PageHeader } from "@/components/common/PageHeader"
import { Tabs, type TabItem } from "@/components/ui/Tabs"
import { Button } from "@/components/ui/Button"
import { useAuth } from "@/context/AuthContext"
import { useCurrency } from "@/context/CurrencyContext"
import { getMyProjects, type ApiProject } from "@/services/projectsApi"
import { formatDate } from "@/lib/format"

type Filter = "active" | "completed" | "all" | "in_progress" | "escrow_funded"

const FILTERS: Filter[] = ["active", "completed", "all", "in_progress", "escrow_funded"]

export function MyProjectsPage() {
  const { user, token } = useAuth()
  const { formatAmount } = useCurrency()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [error, setError] = useState("")
  const requestedFilter = searchParams.get("filter")
  const filter: Filter = FILTERS.includes(requestedFilter as Filter) ? (requestedFilter as Filter) : "active"

  const isClient = user?.role === "client"
  const isFreelancer = user?.role === "freelancer"

  useEffect(() => {
    if (token) getMyProjects(token).then(setProjects).catch((e: Error) => setError(e.message))
  }, [token])

  const roleProjects = useMemo(() => {
    if (!user) return []
    const currentUserId = (user.id || (user as unknown as { _id?: string })._id || "").toString().toLowerCase()
    if (!currentUserId) return projects

    if (isFreelancer) {
      return projects.filter((p) => (p.freelancerId || "").toString().toLowerCase() === currentUserId)
    }
    if (isClient) {
      return projects.filter((p) => (p.clientId || "").toString().toLowerCase() === currentUserId)
    }
    return projects
  }, [projects, user, isClient, isFreelancer])

  const active = useMemo(
    () => roleProjects.filter((p) => p.status === "open" || p.status === "in_progress" || p.status === "disputed"),
    [roleProjects],
  )
  const completed = useMemo(
    () => roleProjects.filter((p) => p.status === "completed"),
    [roleProjects],
  )
  const visible = useMemo(() => {
    if (filter === "active") return active
    if (filter === "completed") return completed
    if (filter === "in_progress") return roleProjects.filter((p) => p.status === "in_progress")
    if (filter === "escrow_funded") return roleProjects.filter((p) => p.escrowFunded)
    return roleProjects
  }, [filter, active, completed, roleProjects])

  const total = useMemo(
    () =>
      roleProjects
        .flatMap((p) => p.milestones)
        .filter((m) => m.status === "completed")
        .reduce((sum, m) => sum + m.amount, 0),
    [roleProjects],
  )

  const tabs: TabItem[] = [
    { label: "Active", value: "active", count: active.length },
    { label: "Completed", value: "completed", count: completed.length },
    { label: "All Projects", value: "all", count: roleProjects.length },
  ]
  const selectTab = (value: string) => setSearchParams({ filter: value })

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <PageHeader
          title={isClient ? "Posted projects" : "Assigned projects"}
          description={
            isClient
              ? "Projects you've created, freelancer assignments, and escrow state."
              : "Projects assigned to you by clients and active deliverable progress."
          }
          actions={
            isClient ? (
              <Button size="sm" leftIcon={<FiPlus />} onClick={() => navigate("/projects/new")}>
                Post project
              </Button>
            ) : undefined
          }
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard label="Active" value={String(active.length)} icon={FiFolder} />
          <MetricCard label="Completed" value={String(completed.length)} icon={FiCheckCircle} />
          <MetricCard
            label={isClient ? "Total spent" : "Total earned"}
            value={formatAmount(total)}
            icon={isClient ? FiDollarSign : FiBriefcase}
          />
        </div>
        {filter === "in_progress" ? (
          <p className="text-sm text-muted">Showing projects that are in progress.</p>
        ) : filter === "escrow_funded" ? (
          <p className="text-sm text-muted">Showing projects with funded escrow.</p>
        ) : (
          <Tabs items={tabs} value={filter} onChange={selectTab} />
        )}
        {error ? (
          <p className="text-sm text-danger">{error}</p>
        ) : visible.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((p) => (
              <ApiProjectCard key={p.id} project={p} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FiFolder}
            title={
              filter === "completed"
                ? (isClient ? "No completed posted projects" : "No completed assigned projects")
                : filter === "in_progress"
                ? (isClient ? "No in-progress posted projects" : "No in-progress assigned projects")
                : filter === "escrow_funded"
                ? "No projects with funded escrow"
                : (isClient ? "No posted projects yet" : "No assigned projects yet")
            }
            description={
              filter === "completed"
                ? (isClient ? "Projects you post will appear here once all milestones are completed and approved." : "Projects assigned to you will appear here once all milestones are completed and approved.")
                : filter === "in_progress"
                ? (isClient ? "Active projects currently in progress will appear here." : "Projects assigned to you currently in progress will appear here.")
                : filter === "escrow_funded"
                ? "Projects with funded escrow protection will appear here."
                : (isClient ? "Click 'Post project' to create your first project and hire freelancers." : "Explore available project opportunities on the marketplace to get assigned.")
            }
            action={
              isClient ? (
                <Button size="sm" leftIcon={<FiPlus />} onClick={() => navigate("/projects/new")}>
                  Post project
                </Button>
              ) : (
                <Button size="sm" onClick={() => navigate("/projects")}>
                  Browse Marketplace
                </Button>
              )
            }
          />
        )}
      </div>
    </div>
  )
}
