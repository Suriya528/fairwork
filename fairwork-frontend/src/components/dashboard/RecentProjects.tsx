import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { FiArrowRight } from "react-icons/fi"
import { DataTable, type Column } from "@/components/tables/DataTable"
import { ProjectStatusBadge } from "@/components/common/ProjectStatusBadge"
import { Button } from "@/components/ui/Button"
import { SectionHeading } from "./SectionHeading"
import { useAuth } from "@/context/AuthContext"
import { getMyProjects, type ApiProject } from "@/services/projectsApi"
import { formatCurrency, formatDate } from "@/lib/format"

/**
 * Table of the 5 most recent projects the current user is part of, with
 * client, budget, status and creation date.
 *
 * Real-data notes:
 *  - Uses getMyProjects(), not getProjects() — this is a personal
 *    dashboard widget, so "recent projects" means the user's own, not
 *    every open project platform-wide.
 *  - "Deadline" column is now "Created": the backend Project model has
 *    no dueDate field at all, but does have a real createdAt timestamp.
 *  - Milestone count and client name now come directly off the fetched
 *    project (milestones are embedded; clientName is pre-populated by
 *    the backend's own .populate() call) — no separate lookups needed,
 *    unlike the dummy-data version.
 *  - No longer accepts a `loading` prop from useSimulatedLoading; this
 *    component fetches its own data and manages its own loading state.
 *    See DashboardPage.tsx for the corresponding call-site change.
 */
export function RecentProjects() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await getMyProjects(token as string)
        if (cancelled) return
        const recent = [...data]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
        setProjects(recent)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Couldn't load projects.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [token])

  const columns: Column<ApiProject>[] = [
    {
      key: "title",
      header: "Project",
      cell: (p) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{p.title}</p>
          <p className="truncate text-xs text-subtle">
            {p.milestones.length} milestone{p.milestones.length !== 1 ? "s" : ""}
          </p>
        </div>
      ),
    },
    {
      key: "client",
      header: "Client",
      cell: (p) => <span className="text-muted">{p.clientName ?? "Unknown"}</span>,
    },
    {
      key: "budget",
      header: "Budget",
      align: "right",
      cell: (p) => (
        <span className="font-medium tabular-nums text-foreground">
          {formatCurrency(p.budget)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (p) => <ProjectStatusBadge status={p.status} />,
    },
    {
      key: "created",
      header: "Created",
      cell: (p) => (
        <span className="whitespace-nowrap text-muted tabular-nums">
          {formatDate(p.createdAt)}
        </span>
      ),
    },
    {
      key: "action",
      header: "",
      align: "right",
      cell: (p) => (
        <Button
          variant="ghost"
          size="sm"
          rightIcon={<FiArrowRight className="h-3.5 w-3.5" />}
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/projects?p=${p.id}`)
          }}
        >
          Open
        </Button>
      ),
    },
  ]

  return (
    <section aria-labelledby="recent-projects-heading" className="flex flex-col gap-4">
      <SectionHeading
        id="recent-projects-heading"
        title="Recent projects"
        description="Your latest escrow-backed contracts"
        actionLabel="All projects"
        actionTo="/projects"
      />
      {error ? (
        <div className="rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={projects}
          rowKey={(p) => p.id}
          loading={loading}
          onRowClick={(p) => navigate(`/projects?p=${p.id}`)}
          emptyTitle="No projects yet"
          emptyDescription="Create your first escrow-backed project to get started."
        />
      )}
    </section>
  )
}