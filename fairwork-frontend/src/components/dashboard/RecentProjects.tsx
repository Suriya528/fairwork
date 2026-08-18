import { useNavigate } from "react"
import { DataTable, type Column } from "@/components/tables/DataTable"
import { ProjectStatusBadge } from "@/components/common/ProjectStatusBadge"
import { Badge, type BadgeTone } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { SectionHeading } from "./SectionHeading"
import { formatDate } from "@/lib/format"
import { getDisplayCategory, type ApiProject } from "@/services/projectsApi"

const escrowTone = (project: ApiProject): BadgeTone => {
  if (project.escrowDisputed) return "danger"
  if (project.escrowCompleted) return "success"
  if (project.escrowFunded) return "info"
  return "neutral"
}

const escrowLabel = (project: ApiProject): string => {
  if (project.escrowDisputed) return "Disputed"
  if (project.escrowCompleted) return "Completed"
  if (project.escrowFunded) return "Funded"
  return "Not funded"
}

export function RecentProjects({ projects, loading, error, role }: { projects: ApiProject[]; loading: boolean; error: string | null; role: "client" | "freelancer" }) {
  const navigate = useNavigate()
  const recent = [...projects].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)
  const columns: Column<ApiProject>[] = [
    { key: "title", header: "Project", width: "32%", cell: (project) => <div className="min-w-0"><p className="truncate font-medium text-foreground">{project.title}</p><p className="text-xs text-subtle">{getDisplayCategory(project)} · {project.milestones.length} milestone{project.milestones.length === 1 ? "" : "s"}</p></div> },
    { key: "counterpart", header: role === "client" ? "Freelancer" : "Client", width: "18%", cell: (project) => <span className="block truncate text-muted">{role === "client" ? project.freelancerName ?? "Unassigned" : project.clientName ?? "Unavailable"}</span> },
    { key: "status", header: "Status", width: "14%", cell: (project) => <ProjectStatusBadge status={project.status} /> },
    { key: "escrow", header: "Escrow", width: "14%", cell: (project) => <Badge tone={escrowTone(project)}>{escrowLabel(project)}</Badge> },
    { key: "created", header: "Created", width: "16%", cell: (project) => <span className="whitespace-nowrap text-muted">{formatDate(project.createdAt)}</span> },
    { key: "action", header: "", align: "right", width: "6%", cell: (project) => <Button variant="ghost" size="sm" onClick={(event) => { event.stopPropagation(); navigate(`/projects/${project.id}`) }} className="h-7 px-2 text-xs">Open</Button> },
  ]

  return <section aria-labelledby="recent-projects-heading" className="flex flex-col gap-4">
    <SectionHeading id="recent-projects-heading" title="Recent projects" description={role === "client" ? "Projects you created and their current escrow state" : "Projects assigned to you and their current state"} actionLabel="All projects" actionTo="/projects/mine" />
    {error ? <div role="alert" className="rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger">{error}</div> : <DataTable className="[&_table]:min-w-[760px]" columns={columns} data={recent} rowKey={(project) => project.id} loading={loading} onRowClick={(project) => navigate(`/projects/${project.id}`)} emptyTitle="No projects found" emptyDescription={role === "client" ? "Projects you create will appear here." : "Projects assigned to you will appear here."} />}
  </section>
}
