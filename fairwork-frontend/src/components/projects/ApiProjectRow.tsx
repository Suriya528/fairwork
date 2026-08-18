import { useNavigate } from "react"
import { FiClock, FiLock, FiUser } from "react-icons/fi"
import { ProjectStatusBadge } from "@/components/common/ProjectStatusBadge"
import { Badge } from "@/components/ui/Badge"
import { formatCurrency, formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { ApiProject } from "@/services/projectsApi"

/** List summary for the real backend project shape used by Browse Projects. */
export function ApiProjectRow({ project }: { project: ApiProject }) {
  const navigate = useNavigate()
  const goToProject = () => navigate(`/projects/${project.id}`)

  return (
    <article
      className={cn(
        "group flex cursor-pointer items-center gap-4 rounded-xl border border-border bg-surface px-5 py-4",
        "transition-all duration-150 hover:border-border-strong hover:bg-surface-hover",
      )}
      tabIndex={0}
      role="link"
      aria-label={`View project: ${project.title}`}
      onClick={goToProject}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          goToProject()
        }
      }}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-info">
          {project.title}
        </span>
        <span className="flex items-center gap-1 text-xs text-subtle">
          <FiUser className="h-3 w-3 shrink-0" />
          {project.clientName ?? "Unknown"}
          <span aria-hidden>·</span>
          {project.category || "Web Development"}
          <span aria-hidden>·</span>
          {project.milestones.length} milestone{project.milestones.length !== 1 ? "s" : ""}
        </span>
      </div>

      <Badge tone={project.escrowTxnHash ? "success" : "neutral"} className="hidden w-28 justify-center lg:inline-flex">
        <FiLock className="h-3 w-3" />
        {project.escrowTxnHash ? "Funded" : "Unfunded"}
      </Badge>

      <div className="shrink-0 text-sm font-semibold text-foreground">
        {formatCurrency(project.budget)}
      </div>

      <div className="hidden w-28 shrink-0 items-center gap-1 text-xs text-subtle lg:flex">
        <FiClock className="h-3 w-3" />
        {formatDate(project.createdAt)}
      </div>

      <div className="hidden w-24 justify-end sm:flex">
        <ProjectStatusBadge status={project.status} />
      </div>
    </article>
  )
}
