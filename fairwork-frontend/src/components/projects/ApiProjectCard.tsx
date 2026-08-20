import { useNavigate } from "react-router-dom"
import { FiCalendar, FiClock, FiLock, FiUser } from "react-icons/fi"
import { ProjectStatusBadge } from "@/components/common/ProjectStatusBadge"
import { Badge } from "@/components/ui/Badge"
import { useCurrency } from "@/context/CurrencyContext"
import { formatDate, formatDeadlineCountdown } from "@/lib/format"
import { cn } from "@/lib/utils"
import { getDisplayCategory, type ApiProject } from "@/services/projectsApi"

/** Grid summary for the real backend project shape used by Browse Projects. */
export function ApiProjectCard({ project }: { project: ApiProject }) {
  const navigate = useNavigate()
  const { formatAmount } = useCurrency()
  const goToProject = () => navigate(`/projects/${project.id}`)

  return (
    <article
      className={cn(
        "group flex min-h-[250px] cursor-pointer flex-col rounded-2xl border border-border bg-surface p-5",
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
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-info">
            {project.title}
          </h2>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-subtle">
            <FiUser className="h-3 w-3 shrink-0" />
            <span className="truncate">{project.clientName ?? "Unknown"}</span>
          </div>
        </div>
        <ProjectStatusBadge status={project.status} />
      </div>

      <p className="mt-4 line-clamp-3 text-xs leading-relaxed text-muted">{project.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge tone="neutral">
          {getDisplayCategory(project)}
        </Badge>
        <Badge tone={project.escrowTxnHash ? "success" : "neutral"}>
          <FiLock className="h-3 w-3" />
          {project.escrowTxnHash ? "Escrow funded" : "Not yet funded"}
        </Badge>
        <Badge tone="neutral">
          {project.milestones.length} milestone{project.milestones.length !== 1 ? "s" : ""}
        </Badge>
        {project.deadlineAt && (
          <Badge tone={formatDeadlineCountdown(project.deadlineAt).isUrgent ? "warning" : "neutral"}>
            <FiClock className="h-3 w-3 mr-1" />
            {formatDeadlineCountdown(project.deadlineAt).text}
          </Badge>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
          {formatAmount(project.budget)}
        </div>
        <div className="flex items-center gap-1 text-xs text-subtle">
          <FiCalendar className="h-3 w-3" />
          Created {formatDate(project.createdAt)}
        </div>
      </div>
    </article>
  )
}
